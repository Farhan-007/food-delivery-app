import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq, and } from 'drizzle-orm';
import { router, protectedProcedure } from '../trpc.js';
import { users, addresses, wallets, walletTransactions, notifications } from '@repo/db';
import { updateProfileSchema, createAddressSchema, updateAddressSchema, paginationSchema } from '@repo/validators/user';
import { desc } from 'drizzle-orm';

// ============================================================
// User Router
// ============================================================

export const userRouter = router({
  // Get current user profile
  me: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.user.id),
      columns: {
        id: true,
        email: true,
        phone: true,
        name: true,
        avatarUrl: true,
        role: true,
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw new TRPCError({ code: 'NOT_FOUND' });
    return user;
  }),

  // Update profile
  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const [updated] = await ctx.db
        .update(users)
        .set(input)
        .where(eq(users.id, ctx.user.id))
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          avatarUrl: users.avatarUrl,
        });

      return updated;
    }),

  // --- Addresses ---
  listAddresses: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

    return ctx.db.query.addresses.findMany({
      where: eq(addresses.userId, ctx.user.id),
      orderBy: [desc(addresses.isDefault), desc(addresses.createdAt)],
    });
  }),

  addAddress: protectedProcedure
    .input(createAddressSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      // If this is the default address, unset others
      if (input.isDefault) {
        await ctx.db
          .update(addresses)
          .set({ isDefault: false })
          .where(eq(addresses.userId, ctx.user.id));
      }

      const [address] = await ctx.db
        .insert(addresses)
        .values({ ...input, userId: ctx.user.id })
        .returning();

      return address;
    }),

  updateAddress: protectedProcedure
    .input(updateAddressSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
      const { id, ...data } = input;

      if (data.isDefault) {
        await ctx.db
          .update(addresses)
          .set({ isDefault: false })
          .where(eq(addresses.userId, ctx.user.id));
      }

      const [updated] = await ctx.db
        .update(addresses)
        .set(data)
        .where(and(eq(addresses.id, id), eq(addresses.userId, ctx.user.id)))
        .returning();

      if (!updated) throw new TRPCError({ code: 'NOT_FOUND' });
      return updated;
    }),

  deleteAddress: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
      await ctx.db
        .delete(addresses)
        .where(and(eq(addresses.id, input.id), eq(addresses.userId, ctx.user.id)));
      return { success: true };
    }),

  // --- Wallet ---
  getWallet: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const wallet = await ctx.db.query.wallets.findFirst({
      where: eq(wallets.userId, ctx.user.id),
    });

    // Auto-create wallet if it doesn't exist
    if (!wallet) {
      const [newWallet] = await ctx.db
        .insert(wallets)
        .values({ userId: ctx.user.id, balance: 0 })
        .returning();
      return { ...newWallet, transactions: [] };
    }

    const transactions = await ctx.db.query.walletTransactions.findMany({
      where: eq(walletTransactions.walletId, wallet.id),
      orderBy: [desc(walletTransactions.createdAt)],
      limit: 20,
    });

    return { ...wallet, transactions };
  }),

  // --- Notifications ---
  listNotifications: protectedProcedure
    .input(paginationSchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const offset = (input.page - 1) * input.pageSize;

      return ctx.db.query.notifications.findMany({
        where: eq(notifications.userId, ctx.user.id),
        orderBy: [desc(notifications.createdAt)],
        limit: input.pageSize,
        offset,
      });
    }),

  markNotificationRead: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      await ctx.db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.id, input.id),
            eq(notifications.userId, ctx.user.id),
          ),
        );

      return { success: true };
    }),

  markAllNotificationsRead: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

    await ctx.db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, ctx.user.id));

    return { success: true };
  }),
});
