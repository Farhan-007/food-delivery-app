import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq, and, desc, sql, gte, lte, inArray } from 'drizzle-orm';
import { router, vendorProcedure } from '../trpc.js';
import {
  orders,
  restaurants,
  orderItems,
} from '@repo/db';

// ============================================================
// Store Router — Restaurant Owner (Vendor) perspective
// ============================================================

export const storeRouter = router({
  // Get vendor's own restaurant profile
  myRestaurant: vendorProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const restaurant = await ctx.db.query.restaurants.findFirst({
      where: eq(restaurants.ownerId, ctx.user.id),
      with: {
        categories: {
          orderBy: (c, { asc }) => [asc(c.sortOrder)],
          with: {
            foodItems: {
              orderBy: (fi, { asc }) => [asc(fi.name)],
              with: { variations: { with: { options: true } } },
            },
          },
        },
      },
    });

    if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND', message: 'No restaurant found for your account' });
    return restaurant;
  }),

  // Get incoming/active orders for the restaurant
  liveOrders: vendorProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const restaurant = await ctx.db.query.restaurants.findFirst({
      where: eq(restaurants.ownerId, ctx.user.id),
      columns: { id: true },
    });

    if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND' });

    return ctx.db.query.orders.findMany({
      where: and(
        eq(orders.restaurantId, restaurant.id),
        inArray(orders.status, ['pending', 'accepted', 'preparing', 'ready_for_pickup']),
      ),
      orderBy: [desc(orders.createdAt)],
      with: {
        customer: { columns: { id: true, name: true, phone: true } },
        deliveryAddress: true,
      },
    });
  }),

  // Get order history for the restaurant with optional date filters
  orderHistory: vendorProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(50).default(20),
        dateFrom: z.string().datetime().optional(),
        dateTo: z.string().datetime().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const restaurant = await ctx.db.query.restaurants.findFirst({
        where: eq(restaurants.ownerId, ctx.user.id),
        columns: { id: true },
      });

      if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND' });

      const conditions = [
        eq(orders.restaurantId, restaurant.id),
        inArray(orders.status, ['delivered', 'cancelled', 'refunded']),
      ];

      if (input.dateFrom) conditions.push(gte(orders.createdAt, new Date(input.dateFrom)));
      if (input.dateTo) conditions.push(lte(orders.createdAt, new Date(input.dateTo)));

      const offset = (input.page - 1) * input.pageSize;

      const [data, countResult] = await Promise.all([
        ctx.db.query.orders.findMany({
          where: and(...conditions),
          orderBy: [desc(orders.createdAt)],
          limit: input.pageSize,
          offset,
          with: {
            customer: { columns: { id: true, name: true } },
          },
        }),
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(orders)
          .where(and(...conditions)),
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

  // Restaurant analytics summary
  analytics: vendorProcedure
    .input(
      z.object({
        days: z.number().int().min(1).max(365).default(30),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const restaurant = await ctx.db.query.restaurants.findFirst({
        where: eq(restaurants.ownerId, ctx.user.id),
        columns: { id: true },
      });

      if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND' });

      const from = new Date();
      from.setDate(from.getDate() - input.days);

      const [summary, dailyRevenue, topItems] = await Promise.all([
        // Overall summary
        ctx.db
          .select({
            totalOrders: sql<number>`COUNT(*)::int`,
            totalRevenue: sql<number>`COALESCE(SUM(total), 0)::float`,
            avgOrderValue: sql<number>`COALESCE(AVG(total), 0)::float`,
          })
          .from(orders)
          .where(
            and(
              eq(orders.restaurantId, restaurant.id),
              eq(orders.status, 'delivered'),
              gte(orders.createdAt, from),
            ),
          ),

        // Daily revenue chart
        ctx.db
          .select({
            date: sql<string>`DATE(created_at)::text`,
            revenue: sql<number>`COALESCE(SUM(total), 0)::float`,
            orderCount: sql<number>`COUNT(*)::int`,
          })
          .from(orders)
          .where(
            and(
              eq(orders.restaurantId, restaurant.id),
              eq(orders.status, 'delivered'),
              gte(orders.createdAt, from),
            ),
          )
          .groupBy(sql`DATE(created_at)`)
          .orderBy(sql`DATE(created_at) ASC`),

        // Top selling items
        ctx.db
          .select({
            foodItemId: orderItems.foodItemId,
            foodItemName: orderItems.foodItemName,
            totalQuantity: sql<number>`SUM(quantity)::int`,
            totalRevenue: sql<number>`SUM(total_price)::float`,
          })
          .from(orderItems)
          .innerJoin(orders, eq(orderItems.orderId, orders.id))
          .where(
            and(
              eq(orders.restaurantId, restaurant.id),
              eq(orders.status, 'delivered'),
              gte(orders.createdAt, from),
            ),
          )
          .groupBy(orderItems.foodItemId, orderItems.foodItemName)
          .orderBy(sql`SUM(quantity) DESC`)
          .limit(10),
      ]);

      return {
        summary: summary[0] ?? { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 },
        dailyRevenue,
        topItems,
      };
    }),

  // Accept an incoming order (set to 'accepted' + estimated prep time)
  acceptOrder: vendorProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
        estimatedMinutes: z.number().int().min(1).max(120).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const restaurant = await ctx.db.query.restaurants.findFirst({
        where: eq(restaurants.ownerId, ctx.user.id),
        columns: { id: true },
      });

      if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND' });

      const [updated] = await ctx.db
        .update(orders)
        .set({
          status: 'accepted',
          ...(input.estimatedMinutes
            ? {
                estimatedDeliveryAt: new Date(
                  Date.now() + input.estimatedMinutes * 60 * 1000,
                ),
              }
            : {}),
        })
        .where(
          and(
            eq(orders.id, input.orderId),
            eq(orders.restaurantId, restaurant.id),
            eq(orders.status, 'pending'),
          ),
        )
        .returning();

      if (!updated) throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found or not in pending state' });

      // Real-time: notify customer
      if (ctx.io) {
        ctx.io.of('/orders')
          .to(`order:${updated.id}`)
          .emit('order:status:update', {
            orderId: updated.id,
            orderNumber: updated.orderNumber,
            status: 'accepted',
          });
      }

      return updated;
    }),

  // Reject/cancel an order
  rejectOrder: vendorProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
        reason: z.string().min(1).max(255).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const restaurant = await ctx.db.query.restaurants.findFirst({
        where: eq(restaurants.ownerId, ctx.user.id),
        columns: { id: true },
      });

      if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND' });

      const [updated] = await ctx.db
        .update(orders)
        .set({
          status: 'cancelled',
          cancelledAt: new Date(),
          cancellationReason: input.reason ?? 'Rejected by restaurant',
        })
        .where(
          and(
            eq(orders.id, input.orderId),
            eq(orders.restaurantId, restaurant.id),
            inArray(orders.status, ['pending', 'accepted']),
          ),
        )
        .returning();

      if (!updated) throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found or cannot be cancelled' });

      // Real-time: notify customer
      if (ctx.io) {
        ctx.io.of('/orders')
          .to(`order:${updated.id}`)
          .emit('order:status:update', {
            orderId: updated.id,
            orderNumber: updated.orderNumber,
            status: 'cancelled',
          });
      }

      return updated;
    }),
});
