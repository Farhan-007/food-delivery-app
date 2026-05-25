import { z } from 'zod';

// ============================================================
// Environment Variable Schema & Validation
// ============================================================

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),

  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // MinIO
  MINIO_ENDPOINT: z.string().default('localhost:9000'),
  MINIO_ACCESS_KEY: z.string().min(1),
  MINIO_SECRET_KEY: z.string().min(1),
  MINIO_BUCKET: z.string().default('food-delivery'),
  MINIO_USE_SSL: z.coerce.boolean().default(false),

  // Auth
  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 chars'),
  API_URL: z.string().url().default('http://localhost:3001'),

  // OAuth (optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Payments (optional)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Email (optional)
  RESEND_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('noreply@foodhub.dev'),

  // Push Notifications
  EXPO_ACCESS_TOKEN: z.string().optional(),

  // Platform config
  PLATFORM_FEE_PERCENT: z.coerce.number().min(0).max(100).default(5),
  TAX_PERCENT: z.coerce.number().min(0).max(100).default(8),
  DEFAULT_CURRENCY: z.string().default('USD'),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let _serverEnv: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (_serverEnv) return _serverEnv;

  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.errors
      .map((e) => `  ${e.path.join('.')}: ${e.message}`)
      .join('\n');
    throw new Error(`❌ Invalid environment variables:\n${formatted}`);
  }

  _serverEnv = result.data;
  return _serverEnv;
}

// ------ Public env (safe to expose to client) ------

export const APP_NAME = 'FoodHub';
export const APP_VERSION = '0.1.0';

export const ORDER_STATUS_LABELS = {
  pending: 'Order Placed',
  accepted: 'Accepted by Restaurant',
  preparing: 'Being Prepared',
  ready_for_pickup: 'Ready for Pickup',
  rider_assigned: 'Rider Assigned',
  picked_up: 'On the Way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
} as const;

export const CUISINE_TYPES = [
  'Italian',
  'Chinese',
  'American',
  'Indian',
  'Mexican',
  'Japanese',
  'Thai',
  'Mediterranean',
  'French',
  'Korean',
  'Pizza',
  'Burgers',
  'Sushi',
  'Vegan',
  'Vegetarian',
  'Seafood',
  'Bakery',
  'Desserts',
  'Fast Food',
  'Asian',
  'Noodles',
  'Pasta',
] as const;

export type CuisineType = (typeof CUISINE_TYPES)[number];
