import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq, and, desc, sql } from 'drizzle-orm';
import { router, protectedProcedure, publicProcedure, vendorProcedure } from '../trpc.js';
import { reviews, orders, restaurants } from '@repo/db';
import { submitReviewSchema } from '@repo/validators/order';

// ============================================================
// Review Router
// ============================================================

export const reviewRouter = router({
  // Submit a new review for a completed order
  submit: protectedProcedure
    .input(submitReviewSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      // 1. Ensure order exists, belongs to user, and is delivered
      const order = await ctx.db.query.orders.findFirst({
        where: and(
          eq(orders.id, input.orderId),
          eq(orders.customerId, ctx.user.id),
          eq(orders.status, 'delivered'),
        ),
      });

      if (!order) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Order not eligible for review (must be delivered)',
        });
      }

      // 2. Ensure review doesn't already exist for this order
      const existing = await ctx.db.query.reviews.findFirst({
        where: eq(reviews.orderId, input.orderId),
      });

      if (existing) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Review already submitted for this order',
        });
      }

      // 3. Insert review
      const [review] = await ctx.db
        .insert(reviews)
        .values({
          orderId: input.orderId,
          customerId: ctx.user.id,
          restaurantId: order.restaurantId,
          rating: input.rating,
          comment: input.comment ?? null,
        })
        .returning();

      if (!review) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

      // 4. Update restaurant rating count and average
      const ratingResult = await ctx.db
        .select({
          avg: sql<number>`AVG(rating)::float`,
          count: sql<number>`COUNT(*)::int`,
        })
        .from(reviews)
        .where(eq(reviews.restaurantId, order.restaurantId));

      if (ratingResult[0]) {
        await ctx.db
          .update(restaurants)
          .set({
            ratingAvg: ratingResult[0].avg ?? 0,
            ratingCount: ratingResult[0].count ?? 0,
          })
          .where(eq(restaurants.id, order.restaurantId));
      }

      return review;
    }),

  // Reply to a review (for restaurant owners/vendors)
  reply: vendorProcedure
    .input(
      z.object({
        reviewId: z.string().uuid(),
        reply: z.string().min(1).max(1000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      // Get restaurant owned by vendor
      const restaurant = await ctx.db.query.restaurants.findFirst({
        where: eq(restaurants.ownerId, ctx.user.id),
      });

      if (!restaurant) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You must own a restaurant to reply to reviews',
        });
      }

      const [updated] = await ctx.db
        .update(reviews)
        .set({ restaurantReply: input.reply })
        .where(
          and(
            eq(reviews.id, input.reviewId),
            eq(reviews.restaurantId, restaurant.id),
          ),
        )
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Review not found or does not belong to your restaurant',
        });
      }

      return updated;
    }),

  // Get reviews list for a specific restaurant
  byRestaurant: publicProcedure
    .input(
      z.object({
        restaurantId: z.string().uuid(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(50).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.pageSize;

      const items = await ctx.db.query.reviews.findMany({
        where: eq(reviews.restaurantId, input.restaurantId),
        orderBy: [desc(reviews.createdAt)],
        limit: input.pageSize,
        offset,
        with: {
          customer: {
            columns: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      });

      return items;
    }),
});
