import { TRPCError } from '@trpc/server';
import { eq, and } from 'drizzle-orm';
import { router, protectedProcedure, adminProcedure } from '../trpc.js';
import { coupons, restaurants } from '@repo/db';
import { validateCouponSchema } from '@repo/validators/coupon';
import { z } from 'zod';

// ============================================================
// Coupon Router
// ============================================================

export const couponRouter = router({
  // Validate a coupon code before checkout
  validate: protectedProcedure
    .input(validateCouponSchema)
    .query(async ({ ctx, input }) => {
      const coupon = await ctx.db.query.coupons.findFirst({
        where: and(
          eq(coupons.code, input.code.toUpperCase()),
          eq(coupons.isActive, true),
        ),
      });

      if (!coupon) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Coupon not found or expired' });
      }

      const now = new Date();
      if (now < coupon.validFrom || now > coupon.validUntil) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Coupon has expired' });
      }

      if (input.orderAmount < coupon.minOrderAmount) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Minimum order amount is $${coupon.minOrderAmount.toFixed(2)}`,
        });
      }

      if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Coupon usage limit reached' });
      }

      // Check if coupon is restaurant-specific
      if (coupon.restaurantId && coupon.restaurantId !== input.restaurantId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Coupon is not valid for this restaurant',
        });
      }

      // Calculate discount
      let discountAmount: number;
      if (coupon.type === 'flat') {
        discountAmount = Math.min(coupon.value, input.orderAmount);
      } else {
        discountAmount = input.orderAmount * (coupon.value / 100);
        if (coupon.maxDiscount) {
          discountAmount = Math.min(discountAmount, coupon.maxDiscount);
        }
      }

      return {
        valid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
        },
        discountAmount,
        finalAmount: input.orderAmount - discountAmount,
      };
    }),

  // List active platform-wide coupons (for customer discovery)
  listPublic: protectedProcedure
    .input(z.object({ restaurantId: z.string().uuid().optional() }))
    .query(async ({ ctx, input }) => {
      const now = new Date();

      const results = await ctx.db.query.coupons.findMany({
        where: (c, { eq, and, isNull, or, gte, lte }) =>
          and(
            eq(c.isActive, true),
            lte(c.validFrom, now),
            gte(c.validUntil, now),
            or(
              isNull(c.restaurantId),
              input.restaurantId ? eq(c.restaurantId, input.restaurantId) : isNull(c.restaurantId),
            ),
          ),
        columns: {
          id: true,
          code: true,
          type: true,
          value: true,
          minOrderAmount: true,
          maxDiscount: true,
          validUntil: true,
        },
      });

      return results;
    }),
});
