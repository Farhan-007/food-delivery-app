import { TRPCError } from '@trpc/server';
import { eq, and, inArray } from 'drizzle-orm';
import { router, publicProcedure } from '../trpc.js';
import { foodItems, restaurants } from '@repo/db';
import { placeOrderBaseSchema } from '@repo/validators/order';
import { getServerEnv } from '@repo/config';

// ============================================================
// Cart Router — Pricing and validation logic
// ============================================================

export const cartRouter = router({
  validate: publicProcedure
    .input(placeOrderBaseSchema.pick({
      restaurantId: true,
      items: true,
      type: true,
    }))
    .mutation(async ({ ctx, input }) => {
      const env = getServerEnv();

      // 1. Fetch restaurant
      const restaurant = await ctx.db.query.restaurants.findFirst({
        where: and(
          eq(restaurants.id, input.restaurantId),
          eq(restaurants.isActive, true),
          eq(restaurants.isApproved, true),
        ),
      });

      if (!restaurant) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Restaurant not found or is suspended',
        });
      }

      // 2. Fetch food items
      const foodItemIds = input.items.map((i: { foodItemId: string }) => i.foodItemId);
      if (foodItemIds.length === 0) {
        return {
          isValid: true,
          subtotal: 0,
          deliveryFee: 0,
          platformFee: 0,
          tax: 0,
          total: 0,
          errors: [],
        };
      }

      const dbFoodItems = await ctx.db.query.foodItems.findMany({
        where: and(
          inArray(foodItems.id, foodItemIds),
          eq(foodItems.restaurantId, input.restaurantId),
        ),
        with: {
          variations: {
            with: { options: true },
          },
        },
      });

      const itemMap = new Map(dbFoodItems.map((item) => [item.id, item]));
      const validatedItems = [];
      const errors: string[] = [];
      let subtotal = 0;

      // 3. Process items and variations
      for (const cartItem of input.items) {
        const dbItem = itemMap.get(cartItem.foodItemId);
        if (!dbItem) {
          errors.push(`Item is no longer available: ${cartItem.foodItemId}`);
          continue;
        }

        if (!dbItem.isAvailable) {
          errors.push(`Item is currently out of stock: ${dbItem.name}`);
          continue;
        }

        let unitPrice = dbItem.price;
        const selectedVariationsDetails = [];

        // Validate selected variations
        for (const selectedVar of cartItem.selectedVariations) {
          const variation = dbItem.variations.find((v) => v.id === selectedVar.variationId);
          if (!variation) {
            errors.push(`Invalid variation for item ${dbItem.name}`);
            continue;
          }

          const option = variation.options.find((o) => o.id === selectedVar.optionId);
          if (!option) {
            errors.push(`Invalid variation option for ${variation.title}`);
            continue;
          }

          unitPrice += option.priceModifier;
          selectedVariationsDetails.push({
            variationId: variation.id,
            variationTitle: variation.title,
            optionId: option.id,
            optionLabel: option.label,
            priceModifier: option.priceModifier,
          });
        }

        const totalPrice = unitPrice * cartItem.quantity;
        subtotal += totalPrice;

        validatedItems.push({
          foodItemId: dbItem.id,
          name: dbItem.name,
          imageUrl: dbItem.imageUrl,
          quantity: cartItem.quantity,
          unitPrice,
          totalPrice,
          selectedVariations: selectedVariationsDetails,
        });
      }

      if (!restaurant.isOpen) {
        errors.push(`Restaurant "${restaurant.name}" is currently closed`);
      }

      if (subtotal < restaurant.minOrderAmount) {
        errors.push(
          `Subtotal is below restaurant's minimum order amount of $${restaurant.minOrderAmount.toFixed(2)}`,
        );
      }

      const deliveryFee = input.type === 'pickup' ? 0 : 3.99;
      const platformFee = subtotal * (env.PLATFORM_FEE_PERCENT / 100);
      const tax = subtotal * (env.TAX_PERCENT / 100);
      const total = subtotal + deliveryFee + platformFee + tax;

      return {
        isValid: errors.length === 0,
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          isOpen: restaurant.isOpen,
          minOrderAmount: restaurant.minOrderAmount,
        },
        items: validatedItems,
        subtotal,
        deliveryFee,
        platformFee,
        tax,
        total,
        errors,
      };
    }),
});
