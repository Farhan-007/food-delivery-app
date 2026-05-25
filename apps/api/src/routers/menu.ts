import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq, and, asc } from 'drizzle-orm';
import { router, vendorProcedure, publicProcedure } from '../trpc.js';
import { categories, foodItems, itemVariations, itemVariationOptions } from '@repo/db';
import {
  createCategorySchema,
  updateCategorySchema,
  reorderCategoriesSchema,
  createFoodItemSchema,
  updateFoodItemSchema,
  createVariationSchema,
  updateVariationSchema,
} from '@repo/validators/menu';

// ============================================================
// Menu Router
// ============================================================

export const menuRouter = router({
  // Public: get full menu for a restaurant
  getMenu: publicProcedure
    .input(z.object({ restaurantId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.categories.findMany({
        where: and(
          eq(categories.restaurantId, input.restaurantId),
          eq(categories.isActive, true),
        ),
        orderBy: [asc(categories.sortOrder)],
        with: {
          foodItems: {
            where: eq(foodItems.isAvailable, true),
            with: {
              variations: {
                with: { options: true },
              },
            },
          },
        },
      });
    }),

  // --- Categories ---
  createCategory: vendorProcedure
    .input(createCategorySchema)
    .mutation(async ({ ctx, input }) => {
      const [category] = await ctx.db.insert(categories).values(input).returning();
      return category;
    }),

  updateCategory: vendorProcedure
    .input(z.object({ id: z.string().uuid() }).merge(updateCategorySchema))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await ctx.db
        .update(categories)
        .set(data)
        .where(eq(categories.id, id))
        .returning();
      if (!updated) throw new TRPCError({ code: 'NOT_FOUND' });
      return updated;
    }),

  deleteCategory: vendorProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(categories).where(eq(categories.id, input.id));
      return { success: true };
    }),

  reorderCategories: vendorProcedure
    .input(reorderCategoriesSchema)
    .mutation(async ({ ctx, input }) => {
      // Update sortOrder for each category in bulk
      await Promise.all(
        input.categoryIds.map((id, index) =>
          ctx.db
            .update(categories)
            .set({ sortOrder: index })
            .where(
              and(
                eq(categories.id, id),
                eq(categories.restaurantId, input.restaurantId),
              ),
            ),
        ),
      );
      return { success: true };
    }),

  // --- Food Items ---
  createItem: vendorProcedure
    .input(createFoodItemSchema)
    .mutation(async ({ ctx, input }) => {
      const [item] = await ctx.db.insert(foodItems).values(input).returning();
      return item;
    }),

  updateItem: vendorProcedure
    .input(z.object({ id: z.string().uuid() }).merge(updateFoodItemSchema))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await ctx.db
        .update(foodItems)
        .set(data)
        .where(eq(foodItems.id, id))
        .returning();
      if (!updated) throw new TRPCError({ code: 'NOT_FOUND' });
      return updated;
    }),

  toggleAvailability: vendorProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.foodItems.findFirst({
        where: eq(foodItems.id, input.id),
      });
      if (!existing) throw new TRPCError({ code: 'NOT_FOUND' });

      const [updated] = await ctx.db
        .update(foodItems)
        .set({ isAvailable: !existing.isAvailable })
        .where(eq(foodItems.id, input.id))
        .returning({ id: foodItems.id, isAvailable: foodItems.isAvailable });

      return updated;
    }),

  deleteItem: vendorProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(foodItems).where(eq(foodItems.id, input.id));
      return { success: true };
    }),

  // --- Variations ---
  createVariation: vendorProcedure
    .input(createVariationSchema)
    .mutation(async ({ ctx, input }) => {
      const { options, ...variationData } = input;

      const [variation] = await ctx.db
        .insert(itemVariations)
        .values(variationData)
        .returning();

      if (!variation) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

      const insertedOptions = await ctx.db
        .insert(itemVariationOptions)
        .values(options.map((opt) => ({ ...opt, variationId: variation.id })))
        .returning();

      return { ...variation, options: insertedOptions };
    }),

  updateVariation: vendorProcedure
    .input(z.object({ id: z.string().uuid() }).merge(updateVariationSchema))
    .mutation(async ({ ctx, input }) => {
      const { id, options, ...data } = input;

      const [updated] = await ctx.db
        .update(itemVariations)
        .set(data)
        .where(eq(itemVariations.id, id))
        .returning();

      if (!updated) throw new TRPCError({ code: 'NOT_FOUND' });

      // Replace options if provided
      if (options && options.length > 0) {
        await ctx.db
          .delete(itemVariationOptions)
          .where(eq(itemVariationOptions.variationId, id));

        await ctx.db
          .insert(itemVariationOptions)
          .values(options.map((opt) => ({ ...opt, variationId: id })));
      }

      return ctx.db.query.itemVariations.findFirst({
        where: eq(itemVariations.id, id),
        with: { options: true },
      });
    }),

  deleteVariation: vendorProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(itemVariations).where(eq(itemVariations.id, input.id));
      return { success: true };
    }),
});
