import { z } from 'zod';

// ============================================================
// Order Validators
// ============================================================

const selectedVariationSchema = z.object({
  variationId: z.string().uuid(),
  variationTitle: z.string(),
  optionId: z.string().uuid(),
  optionLabel: z.string(),
  priceModifier: z.number(),
});

const cartItemSchema = z.object({
  foodItemId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
  selectedVariations: z.array(selectedVariationSchema).default([]),
});

export const placeOrderSchema = z.object({
  restaurantId: z.string().uuid(),
  items: z.array(cartItemSchema).min(1, 'At least one item required'),
  type: z.enum(['delivery', 'pickup']),
  deliveryAddressId: z.string().uuid().optional(),
  paymentMethod: z.enum(['cod', 'stripe', 'paypal', 'wallet']),
  couponCode: z.string().max(50).optional().nullable(),
  specialInstructions: z.string().max(500).optional().nullable(),
}).refine(
  (d) => d.type === 'pickup' || (d.type === 'delivery' && d.deliveryAddressId !== undefined),
  { message: 'Delivery address is required for delivery orders', path: ['deliveryAddressId'] },
);

export const orderListSchema = z.object({
  status: z
    .array(
      z.enum([
        'pending',
        'accepted',
        'preparing',
        'ready_for_pickup',
        'rider_assigned',
        'picked_up',
        'delivered',
        'cancelled',
        'refunded',
      ]),
    )
    .optional(),
  restaurantId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  riderId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export const updateOrderStatusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum([
    'accepted',
    'preparing',
    'ready_for_pickup',
    'rider_assigned',
    'picked_up',
    'delivered',
    'cancelled',
    'refunded',
  ]),
  reason: z.string().max(500).optional(),
  estimatedMinutes: z.number().int().min(1).max(180).optional(),
});

export const cancelOrderSchema = z.object({
  orderId: z.string().uuid(),
  reason: z.string().min(5, 'Please provide a cancellation reason').max(500),
});

export const assignRiderSchema = z.object({
  orderId: z.string().uuid(),
  riderId: z.string().uuid(),
});

export const riderLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  heading: z.number().min(0).max(360).optional().nullable(),
});

export const submitReviewSchema = z.object({
  orderId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().nullable(),
});

export const replyReviewSchema = z.object({
  reviewId: z.string().uuid(),
  reply: z.string().min(1).max(1000),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
export type OrderListInput = z.infer<typeof orderListSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type AssignRiderInput = z.infer<typeof assignRiderSchema>;
export type RiderLocationInput = z.infer<typeof riderLocationSchema>;
export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
export type ReplyReviewInput = z.infer<typeof replyReviewSchema>;
