import { z } from 'zod';

// ============================================================
// Menu Validators (Categories, Items, Variations)
// ============================================================

// --- Category ---
export const createCategorySchema = z.object({
  restaurantId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema
  .omit({ restaurantId: true })
  .partial();

export const reorderCategoriesSchema = z.object({
  restaurantId: z.string().uuid(),
  categoryIds: z.array(z.string().uuid()).min(1),
});

// --- Food Item ---
const nutritionInfoSchema = z.object({
  calories: z.number().min(0).optional(),
  protein: z.number().min(0).optional(),
  carbs: z.number().min(0).optional(),
  fat: z.number().min(0).optional(),
  fiber: z.number().min(0).optional(),
});

export const createFoodItemSchema = z.object({
  restaurantId: z.string().uuid(),
  categoryId: z.string().uuid(),
  name: z.string().min(1).max(150),
  description: z.string().max(1000).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  price: z.number().min(0, 'Price must be non-negative'),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  nutritionInfo: nutritionInfoSchema.optional().nullable(),
});

export const updateFoodItemSchema = createFoodItemSchema
  .omit({ restaurantId: true })
  .partial();

// --- Variation Options ---
const variationOptionSchema = z.object({
  label: z.string().min(1).max(100),
  priceModifier: z.number().default(0),
  isDefault: z.boolean().default(false),
});

// --- Item Variation ---
export const createVariationSchema = z.object({
  foodItemId: z.string().uuid(),
  title: z.string().min(1).max(100),
  type: z.enum(['radio', 'checkbox']),
  isRequired: z.boolean().default(false),
  minSelect: z.number().int().min(0).default(0),
  maxSelect: z.number().int().min(1).default(1),
  options: z
    .array(variationOptionSchema)
    .min(1, 'At least one option is required')
    .max(20),
});

export const updateVariationSchema = createVariationSchema
  .omit({ foodItemId: true })
  .partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ReorderCategoriesInput = z.infer<typeof reorderCategoriesSchema>;
export type CreateFoodItemInput = z.infer<typeof createFoodItemSchema>;
export type UpdateFoodItemInput = z.infer<typeof updateFoodItemSchema>;
export type CreateVariationInput = z.infer<typeof createVariationSchema>;
export type UpdateVariationInput = z.infer<typeof updateVariationSchema>;
