import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq, and, sql, gte, lte } from 'drizzle-orm';
import { router, riderProcedure } from '../trpc.js';
import { riderLocations, orders } from '@repo/db';
import { riderLocationSchema } from '@repo/validators/order';
import { desc } from 'drizzle-orm';

// ============================================================
// Rider Router
// ============================================================

export const riderRouter = router({
  // Update rider's GPS location (called every ~5 seconds)
  updateLocation: riderProcedure
    .input(riderLocationSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      await ctx.db
        .insert(riderLocations)
        .values({
          riderId: ctx.user.id,
          lat: input.lat,
          lng: input.lng,
          heading: input.heading ?? null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: riderLocations.riderId,
          set: {
            lat: input.lat,
            lng: input.lng,
            heading: input.heading ?? null,
            updatedAt: new Date(),
          },
        });

      // Broadcast location to any customer subscribed to this rider's active order
      if (ctx.io) {
        ctx.io.of('/orders')
          .to(`rider:tracking:${ctx.user.id}`)
          .emit('rider:location:update', {
            riderId: ctx.user.id,
            lat: input.lat,
            lng: input.lng,
            heading: input.heading ?? null,
          });
      }

      return { success: true };
    }),


  // Get rider's current location (for customer tracking)
  getLocation: riderProcedure
    .input(z.object({ riderId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const location = await ctx.db.query.riderLocations.findFirst({
        where: eq(riderLocations.riderId, input.riderId),
      });
      return location ?? null;
    }),

  // Get available orders for rider (nearby restaurants)
  availableOrders: riderProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

    return ctx.db.query.orders.findMany({
      where: eq(orders.status, 'ready_for_pickup'),
      orderBy: [desc(orders.createdAt)],
      limit: 20,
      with: {
        restaurant: {
          columns: { id: true, name: true, address: true, lat: true, lng: true },
        },
        deliveryAddress: true,
      },
    });
  }),

  // Get rider's active delivery
  activeDelivery: riderProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

    return ctx.db.query.orders.findFirst({
      where: and(
        eq(orders.riderId, ctx.user.id),
        eq(orders.status, 'picked_up'),
      ),
      with: {
        restaurant: true,
        deliveryAddress: true,
        customer: { columns: { id: true, name: true, phone: true } },
      },
    });
  }),

  // Get rider order history
  orderHistory: riderProcedure
    .input(z.object({
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(50).default(20),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const offset = (input.page - 1) * input.pageSize;

      return ctx.db.query.orders.findMany({
        where: and(
          eq(orders.riderId, ctx.user.id),
          eq(orders.status, 'delivered'),
        ),
        orderBy: [desc(orders.deliveredAt)],
        limit: input.pageSize,
        offset,
        with: {
          restaurant: { columns: { id: true, name: true } },
        },
      });
    }),

  // Rider earnings summary
  earnings: riderProcedure
    .input(z.object({
      dateFrom: z.string().datetime().optional(),
      dateTo: z.string().datetime().optional(),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const conditions = [
        eq(orders.riderId, ctx.user.id),
        eq(orders.status, 'delivered'),
      ];

      if (input.dateFrom) conditions.push(gte(orders.createdAt, new Date(input.dateFrom)));
      if (input.dateTo) conditions.push(lte(orders.createdAt, new Date(input.dateTo)));

      const result = await ctx.db
        .select({
          totalOrders: sql<number>`COUNT(*)::int`,
          totalEarnings: sql<number>`SUM(delivery_fee)::float`,
          avgEarningsPerOrder: sql<number>`AVG(delivery_fee)::float`,
        })
        .from(orders)
        .where(and(...conditions));

      return result[0] ?? { totalOrders: 0, totalEarnings: 0, avgEarningsPerOrder: 0 };
    }),
});
