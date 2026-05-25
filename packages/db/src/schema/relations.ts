import { relations } from 'drizzle-orm';
import {
  users,
  sessions,
  accounts,
  restaurants,
  categories,
  foodItems,
  itemVariations,
  itemVariationOptions,
  addresses,
  orders,
  orderItems,
  reviews,
  wallets,
  walletTransactions,
  notifications,
  coupons,
  riderLocations,
} from './index.js';

// ============================================================
// Drizzle Relations
// ============================================================

export const usersRelations = relations(users, ({ many, one }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  restaurants: many(restaurants),
  addresses: many(addresses),
  ordersAsCustomer: many(orders, { relationName: 'customer_orders' }),
  ordersAsRider: many(orders, { relationName: 'rider_orders' }),
  reviews: many(reviews),
  wallet: one(wallets, { fields: [users.id], references: [wallets.userId] }),
  notifications: many(notifications),
  riderLocation: one(riderLocations, { fields: [users.id], references: [riderLocations.riderId] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const restaurantsRelations = relations(restaurants, ({ one, many }) => ({
  owner: one(users, { fields: [restaurants.ownerId], references: [users.id] }),
  categories: many(categories),
  foodItems: many(foodItems),
  orders: many(orders),
  reviews: many(reviews),
  coupons: many(coupons),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  restaurant: one(restaurants, { fields: [categories.restaurantId], references: [restaurants.id] }),
  foodItems: many(foodItems),
}));

export const foodItemsRelations = relations(foodItems, ({ one, many }) => ({
  restaurant: one(restaurants, { fields: [foodItems.restaurantId], references: [restaurants.id] }),
  category: one(categories, { fields: [foodItems.categoryId], references: [categories.id] }),
  variations: many(itemVariations),
  orderItems: many(orderItems),
}));

export const itemVariationsRelations = relations(itemVariations, ({ one, many }) => ({
  foodItem: one(foodItems, { fields: [itemVariations.foodItemId], references: [foodItems.id] }),
  options: many(itemVariationOptions),
}));

export const itemVariationOptionsRelations = relations(itemVariationOptions, ({ one }) => ({
  variation: one(itemVariations, {
    fields: [itemVariationOptions.variationId],
    references: [itemVariations.id],
  }),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, { fields: [addresses.userId], references: [users.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(users, {
    fields: [orders.customerId],
    references: [users.id],
    relationName: 'customer_orders',
  }),
  rider: one(users, {
    fields: [orders.riderId],
    references: [users.id],
    relationName: 'rider_orders',
  }),
  restaurant: one(restaurants, { fields: [orders.restaurantId], references: [restaurants.id] }),
  deliveryAddress: one(addresses, {
    fields: [orders.deliveryAddressId],
    references: [addresses.id],
  }),
  orderItems: many(orderItems),
  review: one(reviews, { fields: [orders.id], references: [reviews.orderId] }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  foodItem: one(foodItems, { fields: [orderItems.foodItemId], references: [foodItems.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  order: one(orders, { fields: [reviews.orderId], references: [orders.id] }),
  customer: one(users, { fields: [reviews.customerId], references: [users.id] }),
  restaurant: one(restaurants, { fields: [reviews.restaurantId], references: [restaurants.id] }),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  user: one(users, { fields: [wallets.userId], references: [users.id] }),
  transactions: many(walletTransactions),
}));

export const walletTransactionsRelations = relations(walletTransactions, ({ one }) => ({
  wallet: one(wallets, { fields: [walletTransactions.walletId], references: [wallets.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const couponsRelations = relations(coupons, ({ one }) => ({
  restaurant: one(restaurants, { fields: [coupons.restaurantId], references: [restaurants.id] }),
}));

export const riderLocationsRelations = relations(riderLocations, ({ one }) => ({
  rider: one(users, { fields: [riderLocations.riderId], references: [users.id] }),
}));
