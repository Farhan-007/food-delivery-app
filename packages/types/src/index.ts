// ============================================================
// Shared TypeScript Types — @repo/types
// MIT License
// ============================================================

// ------ Enums ------

export type UserRole = 'customer' | 'rider' | 'vendor' | 'admin' | 'super_admin';

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready_for_pickup'
  | 'rider_assigned'
  | 'picked_up'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type OrderType = 'delivery' | 'pickup';

export type PaymentMethod = 'cod' | 'stripe' | 'paypal' | 'wallet';

export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export type VariationType = 'radio' | 'checkbox';

export type CouponType = 'flat' | 'percent';

export type WalletTransactionType = 'credit' | 'debit';

export type NotificationType =
  | 'order_placed'
  | 'order_accepted'
  | 'order_preparing'
  | 'order_ready'
  | 'order_picked_up'
  | 'order_delivered'
  | 'order_cancelled'
  | 'promo'
  | 'system';

// ------ Base Entity ------

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// ------ User ------

export interface User extends BaseEntity {
  email: string | null;
  phone: string | null;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
}

// ------ Address ------

export interface Address extends BaseEntity {
  userId: string;
  label: string;
  addressLine: string;
  city: string;
  lat: number;
  lng: number;
  isDefault: boolean;
  deliveryInstructions: string | null;
}

// ------ Restaurant ------

export interface OpeningHourSlot {
  open: string; // 'HH:MM'
  close: string;
  isClosed?: boolean;
}

export type OpeningHours = {
  mon: OpeningHourSlot;
  tue: OpeningHourSlot;
  wed: OpeningHourSlot;
  thu: OpeningHourSlot;
  fri: OpeningHourSlot;
  sat: OpeningHourSlot;
  sun: OpeningHourSlot;
};

export interface Restaurant extends BaseEntity {
  ownerId: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  cuisineType: string[];
  address: string;
  city: string;
  lat: number;
  lng: number;
  isOpen: boolean;
  isActive: boolean;
  isApproved: boolean;
  minOrderAmount: number;
  avgDeliveryTime: number;
  deliveryRadiusKm: number;
  ratingAvg: number;
  ratingCount: number;
  openingHours: OpeningHours;
}

// ------ Category ------

export interface Category extends BaseEntity {
  restaurantId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

// ------ Food Item ------

export interface NutritionInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
}

export interface FoodItem extends BaseEntity {
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  isAvailable: boolean;
  isFeatured: boolean;
  nutritionInfo: NutritionInfo | null;
}

// ------ Variations ------

export interface ItemVariationOption extends BaseEntity {
  variationId: string;
  label: string;
  priceModifier: number;
  isDefault: boolean;
}

export interface ItemVariation extends BaseEntity {
  foodItemId: string;
  title: string;
  type: VariationType;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  options: ItemVariationOption[];
}

// ------ Cart ------

export interface CartItemSelectedVariation {
  variationId: string;
  variationTitle: string;
  optionId: string;
  optionLabel: string;
  priceModifier: number;
}

export interface CartItem {
  foodItemId: string;
  name: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  selectedVariations: CartItemSelectedVariation[];
  totalPrice: number;
}

// ------ Order Items Snapshot ------

export interface OrderItemSnapshot {
  foodItemId: string;
  foodItemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  selectedVariations: CartItemSelectedVariation[];
}

// ------ Order ------

export interface Order extends BaseEntity {
  orderNumber: string;
  customerId: string;
  restaurantId: string;
  riderId: string | null;
  deliveryAddressId: string | null;
  status: OrderStatus;
  type: OrderType;
  items: OrderItemSnapshot[];
  subtotal: number;
  deliveryFee: number;
  platformFee: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  stripePaymentIntentId: string | null;
  specialInstructions: string | null;
  estimatedDeliveryAt: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
}

// ------ Rider Location ------

export interface RiderLocation {
  riderId: string;
  lat: number;
  lng: number;
  heading: number | null;
  updatedAt: Date;
}

// ------ Review ------

export interface Review extends BaseEntity {
  orderId: string;
  customerId: string;
  restaurantId: string;
  rating: number;
  comment: string | null;
  restaurantReply: string | null;
}

// ------ Zone ------

export interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface Zone extends BaseEntity {
  name: string;
  polygon: GeoJsonPolygon;
  baseDeliveryFee: number;
  perKmFee: number;
  isActive: boolean;
}

// ------ Wallet ------

export interface Wallet extends BaseEntity {
  userId: string;
  balance: number;
  currency: string;
}

export interface WalletTransaction extends BaseEntity {
  walletId: string;
  type: WalletTransactionType;
  amount: number;
  description: string;
  referenceId: string | null;
}

// ------ Notification ------

export interface Notification extends BaseEntity {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  data: Record<string, unknown> | null;
  isRead: boolean;
}

// ------ Coupon ------

export interface Coupon extends BaseEntity {
  code: string;
  type: CouponType;
  value: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  restaurantId: string | null;
  usageLimit: number | null;
  usedCount: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
}

// ------ Pagination ------

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ------ API Response ------

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ------ Real-time Events ------

export interface OrderStatusEvent {
  orderId: string;
  orderNumber: string;
  status: OrderStatus;
  riderId?: string;
  estimatedDeliveryAt?: Date;
}

export interface RiderLocationEvent {
  riderId: string;
  lat: number;
  lng: number;
  heading: number | null;
}

export interface NewOrderEvent {
  orderId: string;
  orderNumber: string;
  restaurantId: string;
  customerName: string;
  total: number;
  type: OrderType;
}
