import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq, and, desc, inArray, sql } from 'drizzle-orm';
import {
  router,
  protectedProcedure,
  vendorProcedure,
  riderProcedure,
  adminProcedure,
} from '../trpc.js';
import {
  orders,
  orderItems,
  foodItems,
  restaurants,
  coupons,
  wallets,
  walletTransactions,
  reviews,
} from '@repo/db';
import {
  placeOrderSchema,
  orderListSchema,
  updateOrderStatusSchema,
  cancelOrderSchema,
  assignRiderSchema,
  submitReviewSchema,
} from '@repo/validators/order';
import { getServerEnv } from '@repo/config';
import {
  enqueueOrderStatusNotification,
  enqueueNewOrderNotification,
} from '../queues/index.js';

// ============================================================
// Order Router
// ============================================================

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `FH-${timestamp}-${random}`;
}

export const orderRouter = router({
  // Customer: place a new order
  place: protectedProcedure
    .input(placeOrderSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const env = getServerEnv();

      // 1. Validate restaurant
      const restaurant = await ctx.db.query.restaurants.findFirst({
        where: and(
          eq(restaurants.id, input.restaurantId),
          eq(restaurants.isActive, true),
          eq(restaurants.isApproved, true),
        ),
      });
      if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND', message: 'Restaurant not found or closed' });
      if (!restaurant.isOpen) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Restaurant is currently closed' });

      // 2. Validate cart items and compute prices
      const foodItemIds = input.items.map((i) => i.foodItemId);
      const dbFoodItems = await ctx.db.query.foodItems.findMany({
        where: and(
          inArray(foodItems.id, foodItemIds),
          eq(foodItems.restaurantId, input.restaurantId),
          eq(foodItems.isAvailable, true),
        ),
        with: { variations: { with: { options: true } } },
      });

      if (dbFoodItems.length !== foodItemIds.length) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Some items are unavailable' });
      }

      const itemMap = new Map(dbFoodItems.map((i) => [i.id, i]));
      const orderItemSnapshots = [];
      let subtotal = 0;

      for (const cartItem of input.items) {
        const dbItem = itemMap.get(cartItem.foodItemId);
        if (!dbItem) throw new TRPCError({ code: 'BAD_REQUEST' });

        let unitPrice = dbItem.price;

        // Apply variation price modifiers
        for (const sel of cartItem.selectedVariations) {
          const variation = dbItem.variations.find((v) => v.id === sel.variationId);
          const option = variation?.options.find((o) => o.id === sel.optionId);
          if (option) unitPrice += option.priceModifier;
        }

        const totalPrice = unitPrice * cartItem.quantity;
        subtotal += totalPrice;

        orderItemSnapshots.push({
          foodItemId: dbItem.id,
          foodItemName: dbItem.name,
          quantity: cartItem.quantity,
          unitPrice,
          totalPrice,
          selectedVariations: cartItem.selectedVariations,
        });
      }

      if (subtotal < restaurant.minOrderAmount) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Minimum order is $${restaurant.minOrderAmount.toFixed(2)}`,
        });
      }

      // 3. Calculate fees
      const deliveryFee = input.type === 'pickup' ? 0 : 3.99;
      const platformFee = subtotal * (env.PLATFORM_FEE_PERCENT / 100);
      const tax = subtotal * (env.TAX_PERCENT / 100);

      // 4. Apply coupon
      let discount = 0;
      if (input.couponCode) {
        const coupon = await ctx.db.query.coupons.findFirst({
          where: and(
            eq(coupons.code, input.couponCode.toUpperCase()),
            eq(coupons.isActive, true),
          ),
        });

        if (
          coupon &&
          new Date() >= coupon.validFrom &&
          new Date() <= coupon.validUntil &&
          subtotal >= coupon.minOrderAmount &&
          (coupon.usageLimit === null || coupon.usedCount < coupon.usageLimit)
        ) {
          if (coupon.type === 'flat') {
            discount = coupon.value;
          } else {
            discount = subtotal * (coupon.value / 100);
            if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
          }

          // Increment usage counter
          await ctx.db
            .update(coupons)
            .set({ usedCount: sql`${coupons.usedCount} + 1` })
            .where(eq(coupons.id, coupon.id));
        }
      }

      const total = Math.max(0, subtotal + deliveryFee + platformFee + tax - discount);

      // 5. Handle wallet payment
      if (input.paymentMethod === 'wallet') {
        const wallet = await ctx.db.query.wallets.findFirst({
          where: eq(wallets.userId, ctx.user.id),
        });
        if (!wallet || wallet.balance < total) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Insufficient wallet balance' });
        }
        await ctx.db
          .update(wallets)
          .set({ balance: sql`${wallets.balance} - ${total}` })
          .where(eq(wallets.id, wallet.id));

        await ctx.db.insert(walletTransactions).values({
          walletId: wallet.id,
          type: 'debit',
          amount: total,
          description: `Order payment`,
          referenceId: null,
        });
      }

      // 6. Create order
      const [order] = await ctx.db
        .insert(orders)
        .values({
          orderNumber: generateOrderNumber(),
          customerId: ctx.user.id,
          restaurantId: input.restaurantId,
          deliveryAddressId: input.deliveryAddressId ?? null,
          status: 'pending',
          type: input.type,
          items: orderItemSnapshots,
          subtotal,
          deliveryFee,
          platformFee,
          tax,
          discount,
          total,
          paymentMethod: input.paymentMethod,
          paymentStatus: input.paymentMethod === 'wallet' ? 'paid' : 'pending',
          specialInstructions: input.specialInstructions ?? null,
        })
        .returning();

      if (!order) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

      // 7. Insert order items for analytics
      await ctx.db.insert(orderItems).values(
        orderItemSnapshots.map((item) => ({ ...item, orderId: order.id })),
      );

      // 8. Real-time: notify restaurant of new order
      if (ctx.io) {
        ctx.io.of('/restaurant')
          .to(`restaurant:${order.restaurantId}`)
          .emit('order:new', {
            orderId: order.id,
            orderNumber: order.orderNumber,
            restaurantId: order.restaurantId,
            total: order.total,
          });

        ctx.io.of('/admin').emit('order:new', {
          orderId: order.id,
          orderNumber: order.orderNumber,
          restaurantId: order.restaurantId,
          total: order.total,
        });
      }

      // 9. Enqueue notification for restaurant owner
      try {
        await enqueueNewOrderNotification(
          order.restaurantId,
          restaurant.ownerId,
          order.id,
          order.orderNumber,
        );
      } catch (err) {
        console.error('[Order] Failed to enqueue new_order notification:', err);
      }

      return order;
    }),

  // Customer: get order list
  myOrders: protectedProcedure
    .input(orderListSchema.pick({ status: true, page: true, pageSize: true }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const conditions = [eq(orders.customerId, ctx.user.id)];
      if (input.status?.length) conditions.push(inArray(orders.status, input.status));

      const offset = ((input.page ?? 1) - 1) * (input.pageSize ?? 20);

      return ctx.db.query.orders.findMany({
        where: and(...conditions),
        orderBy: [desc(orders.createdAt)],
        limit: input.pageSize ?? 20,
        offset,
        with: {
          restaurant: {
            columns: { id: true, name: true, slug: true, logoUrl: true },
          },
          deliveryAddress: true,
        },
      });
    }),

  // Customer/Rider/Vendor: get single order
  byId: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const order = await ctx.db.query.orders.findFirst({
        where: eq(orders.id, input.id),
        with: {
          restaurant: true,
          deliveryAddress: true,
          customer: { columns: { id: true, name: true, phone: true, avatarUrl: true } },
          rider: { columns: { id: true, name: true, phone: true, avatarUrl: true } },
          review: true,
        },
      });

      if (!order) throw new TRPCError({ code: 'NOT_FOUND' });

      // Authorization check
      const userId = ctx.user.id;
      const role = ctx.user.role;
      const isAuthorized =
        order.customerId === userId ||
        order.riderId === userId ||
        role === 'admin' ||
        role === 'super_admin';

      if (!isAuthorized) {
        // Check if vendor owns the restaurant
        if (role !== 'vendor') throw new TRPCError({ code: 'FORBIDDEN' });
      }

      return order;
    }),

  // Customer: cancel order
  cancel: protectedProcedure
    .input(cancelOrderSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const order = await ctx.db.query.orders.findFirst({
        where: eq(orders.id, input.orderId),
        with: { restaurant: { columns: { name: true } } },
      });

      if (!order) throw new TRPCError({ code: 'NOT_FOUND' });
      if (order.customerId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN' });
      if (!['pending', 'accepted'].includes(order.status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Order cannot be cancelled at this stage',
        });
      }

      const [updated] = await ctx.db
        .update(orders)
        .set({
          status: 'cancelled',
          cancelledAt: new Date(),
          cancellationReason: input.reason,
        })
        .where(eq(orders.id, input.orderId))
        .returning();

      // Emit socket event
      if (ctx.io && updated) {
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

  // Vendor: update order status
  updateStatus: vendorProcedure
    .input(updateOrderStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.query.orders.findFirst({
        where: eq(orders.id, input.orderId),
        with: {
          restaurant: { columns: { name: true } },
          customer: { columns: { id: true } },
        },
      });

      if (!order) throw new TRPCError({ code: 'NOT_FOUND' });

      const [updated] = await ctx.db
        .update(orders)
        .set({
          status: input.status,
          ...(input.status === 'delivered' ? { deliveredAt: new Date() } : {}),
          ...(input.estimatedMinutes
            ? {
                estimatedDeliveryAt: new Date(
                  Date.now() + input.estimatedMinutes * 60 * 1000,
                ),
              }
            : {}),
        })
        .where(eq(orders.id, input.orderId))
        .returning();

      if (!updated) throw new TRPCError({ code: 'NOT_FOUND' });

      // Real-time: notify customer of status change
      if (ctx.io) {
        ctx.io.of('/orders')
          .to(`order:${updated.id}`)
          .emit('order:status:update', {
            orderId: updated.id,
            orderNumber: updated.orderNumber,
            status: updated.status,
          });

        ctx.io.of('/admin').emit('order:status:update', {
          orderId: updated.id,
          status: updated.status,
        });
      }

      // Enqueue notification for customer
      try {
        await enqueueOrderStatusNotification(
          order.customer.id,
          updated.id,
          updated.orderNumber,
          updated.status,
          order.restaurant.name,
        );
      } catch (err) {
        console.error('[Order] Failed to enqueue status notification:', err);
      }

      return updated;
    }),

  // Rider: accept assigned order
  riderAccept: riderProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const [updated] = await ctx.db
        .update(orders)
        .set({ riderId: ctx.user.id, status: 'rider_assigned' })
        .where(
          and(eq(orders.id, input.orderId), eq(orders.status, 'ready_for_pickup')),
        )
        .returning();

      if (!updated) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Order not available for pickup' });

      // Real-time: notify customer that a rider was assigned
      if (ctx.io) {
        ctx.io.of('/orders')
          .to(`order:${updated.id}`)
          .emit('order:status:update', {
            orderId: updated.id,
            orderNumber: updated.orderNumber,
            status: 'rider_assigned',
            riderId: ctx.user.id,
          });
      }

      // Enqueue notification
      try {
        await enqueueOrderStatusNotification(
          updated.customerId,
          updated.id,
          updated.orderNumber,
          'rider_assigned',
          '', // restaurant name not fetched here for brevity
        );
      } catch (err) {
        console.error('[Order] Failed to enqueue rider_assigned notification:', err);
      }

      return updated;
    }),

  // Rider: update delivery status
  riderUpdateStatus: riderProcedure
    .input(z.object({
      orderId: z.string().uuid(),
      status: z.enum(['picked_up', 'delivered']),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const [updated] = await ctx.db
        .update(orders)
        .set({
          status: input.status,
          ...(input.status === 'delivered' ? { deliveredAt: new Date() } : {}),
        })
        .where(
          and(eq(orders.id, input.orderId), eq(orders.riderId, ctx.user.id)),
        )
        .returning();

      if (!updated) throw new TRPCError({ code: 'NOT_FOUND' });

      // Real-time: customer order tracking update
      if (ctx.io) {
        ctx.io.of('/orders')
          .to(`order:${updated.id}`)
          .emit('order:status:update', {
            orderId: updated.id,
            orderNumber: updated.orderNumber,
            status: updated.status,
          });
      }

      return updated;
    }),

  // Admin: assign rider
  assignRider: adminProcedure
    .input(assignRiderSchema)
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.query.orders.findFirst({
        where: eq(orders.id, input.orderId),
        with: { customer: { columns: { id: true } } },
      });

      if (!order) throw new TRPCError({ code: 'NOT_FOUND' });

      const [updated] = await ctx.db
        .update(orders)
        .set({ riderId: input.riderId, status: 'rider_assigned' })
        .where(eq(orders.id, input.orderId))
        .returning();

      if (!updated) throw new TRPCError({ code: 'NOT_FOUND' });

      // Notify the rider via socket
      if (ctx.io) {
        ctx.io.of('/rider')
          .to(`rider:${input.riderId}`)
          .emit('order:assigned', {
            orderId: updated.id,
            orderNumber: updated.orderNumber,
          });

        ctx.io.of('/orders')
          .to(`order:${updated.id}`)
          .emit('order:status:update', {
            orderId: updated.id,
            orderNumber: updated.orderNumber,
            status: 'rider_assigned',
            riderId: input.riderId,
          });
      }

      return updated;
    }),

  // Admin: list all orders
  adminList: adminProcedure
    .input(orderListSchema)
    .query(async ({ ctx, input }) => {
      const { status, restaurantId, customerId, riderId, page, pageSize } = input;
      const conditions = [];

      if (status?.length) conditions.push(inArray(orders.status, status));
      if (restaurantId) conditions.push(eq(orders.restaurantId, restaurantId));
      if (customerId) conditions.push(eq(orders.customerId, customerId));
      if (riderId) conditions.push(eq(orders.riderId, riderId));

      const offset = ((page ?? 1) - 1) * (pageSize ?? 20);

      return ctx.db.query.orders.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: [desc(orders.createdAt)],
        limit: pageSize ?? 20,
        offset,
        with: {
          restaurant: { columns: { id: true, name: true } },
          customer: { columns: { id: true, name: true, email: true } },
          rider: { columns: { id: true, name: true } },
        },
      });
    }),

  // Customer: submit review
  submitReview: protectedProcedure
    .input(submitReviewSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const order = await ctx.db.query.orders.findFirst({
        where: and(
          eq(orders.id, input.orderId),
          eq(orders.customerId, ctx.user.id),
          eq(orders.status, 'delivered'),
        ),
      });

      if (!order) throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found or not delivered' });

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

      // Update restaurant rating avg
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
});
