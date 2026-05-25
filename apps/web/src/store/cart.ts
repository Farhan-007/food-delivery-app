import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SelectedVariationOption {
  variationId: string;
  variationTitle: string;
  optionId: string;
  optionLabel: string;
  optionPrice: number;
}

export interface CartItem {
  id: string; // Composite unique key: foodItemId + sorted optionIds
  foodItemId: string;
  name: string;
  price: number; // base price + selected options modifiers
  basePrice: number;
  image_url?: string | null;
  quantity: number;
  selectedVariations: SelectedVariationOption[];
}

export interface RestaurantInfo {
  id: string;
  name: string;
  logo_url?: string | null;
  delivery_radius_km: number;
  min_order_amount: number;
}

interface CartState {
  items: CartItem[];
  restaurant: RestaurantInfo | null;
  deliveryAddressId: string | null;
  couponCode: string | null;
  couponDiscount: number; // percentage or flat amount depending on type
  couponType: 'flat' | 'percent' | null;
  couponValue: number;

  // Actions
  addItem: (item: Omit<CartItem, 'id'>, restaurant: RestaurantInfo) => { success: boolean; error?: string };
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  setDeliveryAddressId: (id: string | null) => void;
  applyCoupon: (code: string, type: 'flat' | 'percent', value: number) => void;
  removeCoupon: () => void;

  // Calculated values
  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getDeliveryFee: () => number;
  getPlatformFee: () => number;
  getTaxAmount: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      restaurant: null,
      deliveryAddressId: null,
      couponCode: null,
      couponDiscount: 0,
      couponType: null,
      couponValue: 0,

      addItem: (newItem, restaurantInfo) => {
        const { items, restaurant } = get();

        // 1. Check if restaurant is different
        if (restaurant && restaurant.id !== restaurantInfo.id) {
          return {
            success: false,
            error: 'order_different_restaurant',
          };
        }

        // 2. Generate unique composite ID for this item + its variations
        const variationIds = newItem.selectedVariations
          .map((v) => v.optionId)
          .sort()
          .join('-');
        const compositeId = `${newItem.foodItemId}-${variationIds}`;

        const existingItemIndex = items.findIndex((item) => item.id === compositeId);

        let updatedItems = [...items];

        if (existingItemIndex > -1) {
          // Update quantity
          const existingItem = updatedItems[existingItemIndex]!;
          updatedItems[existingItemIndex] = {
            ...existingItem,
            quantity: existingItem.quantity + newItem.quantity,
          };
        } else {
          // Add new item
          updatedItems.push({
            ...newItem,
            id: compositeId,
          });
        }

        set({
          items: updatedItems,
          restaurant: restaurantInfo,
        });

        return { success: true };
      },

      removeItem: (id) => {
        const { items } = get();
        const updatedItems = items.filter((item) => item.id !== id);

        if (updatedItems.length === 0) {
          set({
            items: [],
            restaurant: null,
            couponCode: null,
            couponDiscount: 0,
            couponType: null,
            couponValue: 0,
          });
        } else {
          set({ items: updatedItems });
        }
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }

        const { items } = get();
        const updatedItems = items.map((item) =>
          item.id === id ? { ...item, quantity } : item
        );

        set({ items: updatedItems });
      },

      clearCart: () => {
        set({
          items: [],
          restaurant: null,
          couponCode: null,
          couponDiscount: 0,
          couponType: null,
          couponValue: 0,
        });
      },

      setDeliveryAddressId: (id) => {
        set({ deliveryAddressId: id });
      },

      applyCoupon: (code, type, value) => {
        set({
          couponCode: code,
          couponType: type,
          couponValue: value,
        });
      },

      removeCoupon: () => {
        set({
          couponCode: null,
          couponType: null,
          couponValue: 0,
        });
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      getDiscountAmount: () => {
        const subtotal = get().getSubtotal();
        const { couponType, couponValue } = get();

        if (!couponType || couponValue <= 0) return 0;

        if (couponType === 'percent') {
          return (subtotal * couponValue) / 100;
        }

        return Math.min(couponValue, subtotal);
      },

      getDeliveryFee: () => {
        // Flat delivery fee of $2.99 if items are present
        const subtotal = get().getSubtotal();
        return subtotal > 0 ? 2.99 : 0;
      },

      getPlatformFee: () => {
        // Flat platform fee of $0.99
        const subtotal = get().getSubtotal();
        return subtotal > 0 ? 0.99 : 0;
      },

      getTaxAmount: () => {
        // 8% tax rate
        const subtotal = get().getSubtotal();
        const discount = get().getDiscountAmount();
        const taxableAmount = Math.max(0, subtotal - discount);
        return taxableAmount * 0.08;
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscountAmount();
        const delivery = get().getDeliveryFee();
        const platform = get().getPlatformFee();
        const tax = get().getTaxAmount();

        return Math.max(0, subtotal - discount + delivery + platform + tax);
      },
    }),
    {
      name: 'foodhub-cart',
    }
  )
);
