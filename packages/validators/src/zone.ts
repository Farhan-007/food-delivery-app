import { z } from 'zod';

// ============================================================
// Delivery Zone Validators
// ============================================================

const geoJsonPolygonSchema = z.object({
  type: z.literal('Polygon'),
  coordinates: z
    .array(z.array(z.tuple([z.number(), z.number()])).min(4))
    .min(1),
});

export const createZoneSchema = z.object({
  name: z.string().min(1).max(100),
  polygon: geoJsonPolygonSchema,
  baseDeliveryFee: z.number().min(0),
  perKmFee: z.number().min(0),
  isActive: z.boolean().default(true),
});

export const updateZoneSchema = createZoneSchema.partial().extend({
  id: z.string().uuid(),
});

export type CreateZoneInput = z.infer<typeof createZoneSchema>;
export type UpdateZoneInput = z.infer<typeof updateZoneSchema>;
