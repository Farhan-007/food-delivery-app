import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';
import { router, adminProcedure } from '../trpc.js';
import { users, orders, restaurants, coupons, zones } from '@repo/db';
import { createCouponSchema, updateCouponSchema } from '@repo/validators/coupon';
import { createZoneSchema, updateZoneSchema } from '@repo/validators/zone';

// ============================================================
// Admin Router
// ============================================================

export const adminRouter = router({
  // Platform analytics overview
  overview: adminProcedure.query(async ({ ctx }) => {
    const [
      totalUsersResult,
      totalOrdersResult,
      totalRevenueResult,
      activeRidersResult,
      pendingRestaurantsResult,
    ] = await Promise.all([
      ctx.db.select({ count: sql<number>`COUNT(*)::int` }).from(users),
      ctx.db.select({ count: sql<number>`COUNT(*)::int` }).from(orders),
      ctx.db
        .select({ total: sql<number>`COALESCE(SUM(total), 0)::float` })
        .from(orders)
        .where(eq(orders.status, 'delivered')),
      ctx.db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(users)
        .where(and(eq(users.role, 'rider'), eq(users.isActive, true))),
      ctx.db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(restaurants)
        .where(eq(restaurants.isApproved, false)),
    ]);

    return {
      totalUsers: totalUsersResult[0]?.count ?? 0,
      totalOrders: totalOrdersResult[0]?.count ?? 0,
      totalRevenue: totalRevenueResult[0]?.total ?? 0,
      activeRiders: activeRidersResult[0]?.count ?? 0,
      pendingRestaurants: pendingRestaurantsResult[0]?.count ?? 0,
    };
  }),

  // Revenue chart data (last 30 days)
  revenueChart: adminProcedure
    .input(
      z.object({
        days: z.number().int().min(7).max(365).default(30),
      }),
    )
    .query(async ({ ctx, input }) => {
      const from = new Date();
      from.setDate(from.getDate() - input.days);

      const result = await ctx.db
        .select({
          date: sql<string>`DATE(created_at)::text`,
          revenue: sql<number>`COALESCE(SUM(total), 0)::float`,
          orderCount: sql<number>`COUNT(*)::int`,
        })
        .from(orders)
        .where(
          and(
            eq(orders.status, 'delivered'),
            gte(orders.createdAt, from),
          ),
        )
        .groupBy(sql`DATE(created_at)`)
        .orderBy(sql`DATE(created_at) ASC`);

      return result;
    }),

  // User management
  listUsers: adminProcedure
    .input(
      z.object({
        role: z.enum(['customer', 'rider', 'vendor', 'admin', 'super_admin']).optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.role) conditions.push(eq(users.role, input.role));

      const offset = (input.page - 1) * input.pageSize;

      const [data, countResult] = await Promise.all([
        ctx.db.query.users.findMany({
          where: conditions.length > 0 ? and(...conditions) : undefined,
          orderBy: [desc(users.createdAt)],
          limit: input.pageSize,
          offset,
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
          },
        }),
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(users)
          .where(conditions.length > 0 ? and(...conditions) : undefined),
      ]);

      return {
        data,
        total: countResult[0]?.count ?? 0,
        page: input.page,
        pageSize: input.pageSize,
        hasNextPage: offset + input.pageSize < (countResult[0]?.count ?? 0),
        hasPrevPage: input.page > 1,
      };
    }),

  // Toggle user active status
  toggleUserActive: adminProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, input.userId),
        columns: { id: true, isActive: true, role: true },
      });

      if (!user) throw new TRPCError({ code: 'NOT_FOUND' });
      if (user.role === 'super_admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot deactivate super admin' });
      }

      const [updated] = await ctx.db
        .update(users)
        .set({ isActive: !user.isActive })
        .where(eq(users.id, input.userId))
        .returning({ id: users.id, isActive: users.isActive });

      return updated;
    }),

  // Coupon management
  listCoupons: adminProcedure
    .input(z.object({ page: z.number().int().min(1).default(1), pageSize: z.number().int().min(1).max(100).default(20) }))
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.pageSize;
      return ctx.db.query.coupons.findMany({
        orderBy: [desc(coupons.createdAt)],
        limit: input.pageSize,
        offset,
        with: { restaurant: { columns: { id: true, name: true } } },
      });
    }),

  createCoupon: adminProcedure
    .input(createCouponSchema)
    .mutation(async ({ ctx, input }) => {
      const [coupon] = await ctx.db.insert(coupons).values({
        ...input,
        validFrom: new Date(input.validFrom),
        validUntil: new Date(input.validUntil),
      }).returning();
      return coupon;
    }),

  updateCoupon: adminProcedure
    .input(updateCouponSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await ctx.db.update(coupons).set({
        ...data,
        ...(data.validFrom ? { validFrom: new Date(data.validFrom) } : {}),
        ...(data.validUntil ? { validUntil: new Date(data.validUntil) } : {}),
      }).where(eq(coupons.id, id)).returning();
      if (!updated) throw new TRPCError({ code: 'NOT_FOUND' });
      return updated;
    }),

  deleteCoupon: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(coupons).where(eq(coupons.id, input.id));
      return { success: true };
    }),

  // Zone management
  listZones: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.query.zones.findMany({ orderBy: [desc(zones.createdAt)] });
  }),

  createZone: adminProcedure
    .input(createZoneSchema)
    .mutation(async ({ ctx, input }) => {
      const [zone] = await ctx.db.insert(zones).values(input).returning();
      return zone;
    }),

  updateZone: adminProcedure
    .input(updateZoneSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await ctx.db.update(zones).set(data).where(eq(zones.id, id)).returning();
      if (!updated) throw new TRPCError({ code: 'NOT_FOUND' });
      return updated;
    }),

  deleteZone: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(zones).where(eq(zones.id, input.id));
      return { success: true };
    }),
});
