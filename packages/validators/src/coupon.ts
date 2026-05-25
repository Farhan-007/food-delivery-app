import { z } from 'zod';

// ============================================================
// Coupon Validators
// ============================================================

export const createCouponSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[A-Z0-9_-]+$/, 'Code must be uppercase alphanumeric, dashes, underscores'),
  type: z.enum(['flat', 'percent']),
  value: z.number().positive(),
  minOrderAmount: z.number().min(0).default(0),
  maxDiscount: z.number().positive().optional().nullable(),
  restaurantId: z.string().uuid().optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
  isActive: z.boolean().default(true),
}).refine((d) => new Date(d.validFrom) < new Date(d.validUntil), {
  message: 'validFrom must be before validUntil',
  path: ['validUntil'],
});

export const updateCouponSchema = createCouponSchema.partial().extend({
  id: z.string().uuid(),
});

export const validateCouponSchema = z.object({
  code: z.string().min(1),
  restaurantId: z.string().uuid(),
  orderAmount: z.number().positive(),
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;
