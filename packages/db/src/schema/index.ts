import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  boolean,
  integer,
  doublePrecision,
  jsonb,
  uuid,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// ============================================================
// Enums
// ============================================================

export const userRoleEnum = pgEnum('user_role', [
  'customer',
  'rider',
  'vendor',
  'admin',
  'super_admin',
]);

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'accepted',
  'preparing',
  'ready_for_pickup',
  'rider_assigned',
  'picked_up',
  'delivered',
  'cancelled',
  'refunded',
]);

export const orderTypeEnum = pgEnum('order_type', ['delivery', 'pickup']);

export const paymentMethodEnum = pgEnum('payment_method', [
  'cod',
  'stripe',
  'paypal',
  'wallet',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'paid',
  'refunded',
]);

export const variationTypeEnum = pgEnum('variation_type', ['radio', 'checkbox']);

export const couponTypeEnum = pgEnum('coupon_type', ['flat', 'percent']);

export const walletTxTypeEnum = pgEnum('wallet_tx_type', ['credit', 'debit']);

export const notificationTypeEnum = pgEnum('notification_type', [
  'order_placed',
  'order_accepted',
  'order_preparing',
  'order_ready',
  'order_picked_up',
  'order_delivered',
  'order_cancelled',
  'promo',
  'system',
]);

// ============================================================
// Users
// ============================================================

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').unique(),
    phone: text('phone').unique(),
    name: text('name').notNull(),
    avatarUrl: text('avatar_url'),
    role: userRoleEnum('role').notNull().default('customer'),
    isActive: boolean('is_active').notNull().default(true),
    emailVerified: boolean('email_verified').notNull().default(false),
    phoneVerified: boolean('phone_verified').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index('users_role_idx').on(t.role),
    index('users_email_idx').on(t.email),
    index('users_phone_idx').on(t.phone),
  ],
);

// ============================================================
// Better-Auth managed tables
// ============================================================

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const verifications = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// ============================================================
// Restaurants
// ============================================================

export const restaurants = pgTable(
  'restaurants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    logoUrl: text('logo_url'),
    coverUrl: text('cover_url'),
    cuisineType: text('cuisine_type').array().notNull().default(sql`'{}'::text[]`),
    address: text('address').notNull(),
    city: text('city').notNull(),
    lat: doublePrecision('lat').notNull(),
    lng: doublePrecision('lng').notNull(),
    isOpen: boolean('is_open').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    isApproved: boolean('is_approved').notNull().default(false),
    minOrderAmount: doublePrecision('min_order_amount').notNull().default(0),
    avgDeliveryTime: integer('avg_delivery_time').notNull().default(30),
    deliveryRadiusKm: doublePrecision('delivery_radius_km').notNull().default(10),
    ratingAvg: doublePrecision('rating_avg').notNull().default(0),
    ratingCount: integer('rating_count').notNull().default(0),
    openingHours: jsonb('opening_hours').notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index('restaurants_owner_idx').on(t.ownerId),
    index('restaurants_city_idx').on(t.city),
    index('restaurants_approved_active_idx').on(t.isApproved, t.isActive),
    // Geospatial: lat/lng index for bounding box queries
    index('restaurants_latlong_idx').on(t.lat, t.lng),
  ],
);

// ============================================================
// Categories
// ============================================================

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    restaurantId: uuid('restaurant_id')
      .notNull()
      .references(() => restaurants.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    imageUrl: text('image_url'),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index('categories_restaurant_idx').on(t.restaurantId),
    index('categories_sort_idx').on(t.restaurantId, t.sortOrder),
  ],
);

// ============================================================
// Food Items
// ============================================================

export const foodItems = pgTable(
  'food_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    restaurantId: uuid('restaurant_id')
      .notNull()
      .references(() => restaurants.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    description: text('description'),
    imageUrl: text('image_url'),
    price: doublePrecision('price').notNull(),
    isAvailable: boolean('is_available').notNull().default(true),
    isFeatured: boolean('is_featured').notNull().default(false),
    nutritionInfo: jsonb('nutrition_info'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index('food_items_restaurant_idx').on(t.restaurantId),
    index('food_items_category_idx').on(t.categoryId),
    index('food_items_featured_idx').on(t.restaurantId, t.isFeatured),
  ],
);

// ============================================================
// Item Variations
// ============================================================

export const itemVariations = pgTable(
  'item_variations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    foodItemId: uuid('food_item_id')
      .notNull()
      .references(() => foodItems.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    type: variationTypeEnum('type').notNull(),
    isRequired: boolean('is_required').notNull().default(false),
    minSelect: integer('min_select').notNull().default(0),
    maxSelect: integer('max_select').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index('item_variations_food_item_idx').on(t.foodItemId)],
);

export const itemVariationOptions = pgTable(
  'item_variation_options',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    variationId: uuid('variation_id')
      .notNull()
      .references(() => itemVariations.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    priceModifier: doublePrecision('price_modifier').notNull().default(0),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index('item_variation_options_variation_idx').on(t.variationId)],
);

// ============================================================
// Addresses
// ============================================================

export const addresses = pgTable(
  'addresses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    addressLine: text('address_line').notNull(),
    city: text('city').notNull(),
    lat: doublePrecision('lat').notNull(),
    lng: doublePrecision('lng').notNull(),
    isDefault: boolean('is_default').notNull().default(false),
    deliveryInstructions: text('delivery_instructions'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index('addresses_user_idx').on(t.userId)],
);

// ============================================================
// Orders
// ============================================================

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderNumber: text('order_number').notNull().unique(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    restaurantId: uuid('restaurant_id')
      .notNull()
      .references(() => restaurants.id, { onDelete: 'restrict' }),
    riderId: uuid('rider_id').references(() => users.id, { onDelete: 'set null' }),
    deliveryAddressId: uuid('delivery_address_id').references(() => addresses.id, {
      onDelete: 'set null',
    }),
    status: orderStatusEnum('status').notNull().default('pending'),
    type: orderTypeEnum('type').notNull().default('delivery'),
    items: jsonb('items').notNull().default(sql`'[]'::jsonb`),
    subtotal: doublePrecision('subtotal').notNull(),
    deliveryFee: doublePrecision('delivery_fee').notNull().default(0),
    platformFee: doublePrecision('platform_fee').notNull().default(0),
    tax: doublePrecision('tax').notNull().default(0),
    discount: doublePrecision('discount').notNull().default(0),
    total: doublePrecision('total').notNull(),
    paymentMethod: paymentMethodEnum('payment_method').notNull(),
    paymentStatus: paymentStatusEnum('payment_status').notNull().default('pending'),
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    specialInstructions: text('special_instructions'),
    estimatedDeliveryAt: timestamp('estimated_delivery_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancellationReason: text('cancellation_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index('orders_customer_idx').on(t.customerId),
    index('orders_restaurant_idx').on(t.restaurantId),
    index('orders_rider_idx').on(t.riderId),
    index('orders_status_idx').on(t.status),
    index('orders_created_at_idx').on(t.createdAt),
    uniqueIndex('orders_order_number_idx').on(t.orderNumber),
  ],
);

// ============================================================
// Order Items (analytics denormalization)
// ============================================================

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    foodItemId: uuid('food_item_id').references(() => foodItems.id, {
      onDelete: 'set null',
    }),
    foodItemName: text('food_item_name').notNull(),
    quantity: integer('quantity').notNull(),
    unitPrice: doublePrecision('unit_price').notNull(),
    totalPrice: doublePrecision('total_price').notNull(),
    selectedVariations: jsonb('selected_variations').notNull().default(sql`'[]'::jsonb`),
  },
  (t) => [
    index('order_items_order_idx').on(t.orderId),
    index('order_items_food_item_idx').on(t.foodItemId),
  ],
);

// ============================================================
// Rider Locations
// ============================================================

export const riderLocations = pgTable('rider_locations', {
  riderId: uuid('rider_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  lat: doublePrecision('lat').notNull(),
  lng: doublePrecision('lng').notNull(),
  heading: doublePrecision('heading'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================
// Reviews
// ============================================================

export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .unique()
      .references(() => orders.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    restaurantId: uuid('restaurant_id')
      .notNull()
      .references(() => restaurants.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(),
    comment: text('comment'),
    restaurantReply: text('restaurant_reply'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index('reviews_restaurant_idx').on(t.restaurantId),
    index('reviews_customer_idx').on(t.customerId),
  ],
);

// ============================================================
// Delivery Zones
// ============================================================

export const zones = pgTable('zones', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  polygon: jsonb('polygon').notNull(),
  baseDeliveryFee: doublePrecision('base_delivery_fee').notNull(),
  perKmFee: doublePrecision('per_km_fee').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// ============================================================
// Wallets
// ============================================================

export const wallets = pgTable('wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  balance: doublePrecision('balance').notNull().default(0),
  currency: text('currency').notNull().default('USD'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const walletTransactions = pgTable(
  'wallet_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    walletId: uuid('wallet_id')
      .notNull()
      .references(() => wallets.id, { onDelete: 'cascade' }),
    type: walletTxTypeEnum('type').notNull(),
    amount: doublePrecision('amount').notNull(),
    description: text('description').notNull(),
    referenceId: text('reference_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('wallet_tx_wallet_idx').on(t.walletId),
    index('wallet_tx_created_idx').on(t.createdAt),
  ],
);

// ============================================================
// Notifications
// ============================================================

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    body: text('body').notNull(),
    type: notificationTypeEnum('type').notNull(),
    data: jsonb('data'),
    isRead: boolean('is_read').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('notifications_user_idx').on(t.userId),
    index('notifications_unread_idx').on(t.userId, t.isRead),
  ],
);

// ============================================================
// Coupons
// ============================================================

export const coupons = pgTable(
  'coupons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: text('code').notNull().unique(),
    type: couponTypeEnum('type').notNull(),
    value: doublePrecision('value').notNull(),
    minOrderAmount: doublePrecision('min_order_amount').notNull().default(0),
    maxDiscount: doublePrecision('max_discount'),
    restaurantId: uuid('restaurant_id').references(() => restaurants.id, {
      onDelete: 'cascade',
    }),
    usageLimit: integer('usage_limit'),
    usedCount: integer('used_count').notNull().default(0),
    validFrom: timestamp('valid_from', { withTimezone: true }).notNull(),
    validUntil: timestamp('valid_until', { withTimezone: true }).notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex('coupons_code_idx').on(t.code),
    index('coupons_restaurant_idx').on(t.restaurantId),
    index('coupons_active_idx').on(t.isActive, t.validFrom, t.validUntil),
  ],
);
