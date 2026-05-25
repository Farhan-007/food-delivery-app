import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq, and, desc } from 'drizzle-orm';
import { router, protectedProcedure } from '../trpc.js';
import { notifications } from '@repo/db';
import { paginationSchema } from '@repo/validators/user';

// ============================================================
// Notification Router
// ============================================================

export const notificationRouter = router({
  list: protectedProcedure
    .input(paginationSchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const offset = (input.page - 1) * input.pageSize;

      const items = await ctx.db.query.notifications.findMany({
        where: eq(notifications.userId, ctx.user.id),
        orderBy: [desc(notifications.createdAt)],
        limit: input.pageSize,
        offset,
      });

      const unreadCountResult = await ctx.db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, ctx.user.id),
            eq(notifications.isRead, false),
          ),
        );

      return {
        items,
        unreadCount: unreadCountResult.length,
      };
    }),

  markRead: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const [updated] = await ctx.db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.id, input.id),
            eq(notifications.userId, ctx.user.id),
          ),
        )
        .returning();

      if (!updated) throw new TRPCError({ code: 'NOT_FOUND', message: 'Notification not found' });
      return updated;
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

    await ctx.db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, ctx.user.id));

    return { success: true };
  }),
});
