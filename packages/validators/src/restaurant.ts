import { z } from 'zod';

// ============================================================
// Restaurant Validators
// ============================================================

const openingHourSlotSchema = z.object({
  open: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:MM)'),
  close: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Invalid time format (HH:MM)'),
  isClosed: z.boolean().optional(),
});

const openingHoursSchema = z.object({
  mon: openingHourSlotSchema,
  tue: openingHourSlotSchema,
  wed: openingHourSlotSchema,
  thu: openingHourSlotSchema,
  fri: openingHourSlotSchema,
  sat: openingHourSlotSchema,
  sun: openingHourSlotSchema,
});

export const createRestaurantSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(1000).optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  coverUrl: z.string().url().optional().nullable(),
  cuisineType: z.array(z.string().min(1)).min(1, 'At least one cuisine type required').max(10),
  address: z.string().min(5).max(255),
  city: z.string().min(1).max(100),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  minOrderAmount: z.number().min(0).default(0),
  avgDeliveryTime: z.number().int().min(5).max(180).default(30),
  deliveryRadiusKm: z.number().min(0.5).max(50).default(10),
  openingHours: openingHoursSchema,
});

export const updateRestaurantSchema = createRestaurantSchema.partial();

export const restaurantSearchSchema = z.object({
  q: z.string().max(200).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  radiusKm: z.number().min(0.5).max(100).optional(),
  cuisineType: z.array(z.string()).optional(),
  minRating: z.number().min(1).max(5).optional(),
  maxDeliveryTime: z.number().int().min(5).max(180).optional(),
  isOpen: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(20),
  sortBy: z.enum(['distance', 'rating', 'delivery_time', 'created_at']).default('rating'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const approveRestaurantSchema = z.object({
  restaurantId: z.string().uuid(),
  isApproved: z.boolean(),
  reason: z.string().max(500).optional(),
});

export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>;
export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>;
export type RestaurantSearchInput = z.infer<typeof restaurantSearchSchema>;
export type ApproveRestaurantInput = z.infer<typeof approveRestaurantSchema>;
