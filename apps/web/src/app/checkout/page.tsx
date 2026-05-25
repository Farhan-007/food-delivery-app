'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@repo/auth/client';
import { trpc } from '@/utils/trpc';
import { useCartStore } from '@/store/cart';
import { Navbar } from '@/components/navbar';
import {
  MapPin,
  CreditCard,
  Tag,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Plus,
  X,
  Loader2,
  Wallet,
  ShoppingBag,
  ArrowRight
} from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useSession();

  const {
    items: cartItems,
    restaurant: cartRestaurant,
    couponCode,
    couponValue,
    couponType,
    applyCoupon,
    removeCoupon,
    getSubtotal,
    getDiscountAmount,
    getDeliveryFee,
    getPlatformFee,
    getTaxAmount,
    getTotal,
    clearCart
  } = useCartStore();

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      router.push('/');
    }
  }, [cartItems, router]);

  // tRPC queries
  const { data: addresses = [], refetch: refetchAddresses } = trpc.user.listAddresses.useQuery(undefined, {
    enabled: !!session?.user,
  });

  const { data: wallet } = trpc.user.getWallet.useQuery(undefined, {
    enabled: !!session?.user,
  });

  // Mutations
  const placeOrderMutation = trpc.order.place.useMutation();
  const addAddressMutation = trpc.user.addAddress.useMutation();
  const validateCouponMutation = trpc.coupon.validate.useQuery(
    { code: couponCode || '', restaurantId: cartRestaurant?.id || '', orderAmount: getSubtotal() },
    { enabled: false } // triggered manually
  );

  const utils = trpc.useUtils();

  // Form states
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'wallet'>('cod');
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Address creation form state
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [addressLabel, setAddressLabel] = useState('Home');
  const [addressLine, setAddressLine] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [isAddressDefault, setIsAddressDefault] = useState(true);

  // Select default address if available
  useEffect(() => {
    if (addresses.length > 0) {
      const def = addresses.find((a) => a.isDefault) || addresses[0];
      if (def) setSelectedAddressId(def.id);
    }
  }, [addresses]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressLine || !addressCity) return;

    try {
      const newAddress = await addAddressMutation.mutateAsync({
        label: addressLabel,
        addressLine,
        city: addressCity,
        lat: 28.6139, // standard lat fallback
        lng: 77.2090, // standard lng fallback
        isDefault: isAddressDefault,
      });

      setSelectedAddressId(newAddress.id);
      setIsAddingAddress(false);
      // Reset form
      setAddressLine('');
      setAddressCity('');
      refetchAddresses();
    } catch (err: any) {
      alert(err.message || 'Failed to add address');
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponInput) return;
    setCouponError(null);

    try {
      // Validate coupon manually by querying our coupon endpoint
      const coupon = await utils.client.coupon.validate.query({
        code: couponInput.trim().toUpperCase(),
        restaurantId: cartRestaurant?.id || '',
        orderAmount: getSubtotal(),
      });

      if (coupon.valid && coupon.coupon) {
        applyCoupon(
          coupon.coupon.code,
          coupon.coupon.type as 'flat' | 'percent',
          Number(coupon.coupon.value)
        );
        setCouponInput('');
      } else {
        setCouponError('Invalid coupon code');
      }
    } catch (err: any) {
      setCouponError(err.message || 'Invalid coupon code');
    }
  };

  const handlePlaceOrder = async () => {
    if (!cartRestaurant) return;
    setErrorMessage(null);

    // Validate delivery address
    if (paymentMethod !== 'wallet' && !selectedAddressId && addresses.length > 0) {
      setErrorMessage('Please select a delivery address');
      return;
    }

    // Build cart items matching PlaceOrderInput
    const items = cartItems.map((item) => ({
      foodItemId: item.foodItemId,
      quantity: item.quantity,
      selectedVariations: item.selectedVariations.map((v) => ({
        variationId: v.variationId,
        variationTitle: v.variationTitle,
        optionId: v.optionId,
        optionLabel: v.optionLabel,
        priceModifier: v.optionPrice,
      })),
    }));

    try {
      const order = await placeOrderMutation.mutateAsync({
        restaurantId: cartRestaurant.id,
        items,
        type: 'delivery',
        deliveryAddressId: selectedAddressId || undefined,
        paymentMethod,
        couponCode: couponCode || undefined,
        specialInstructions: specialInstructions || undefined,
      });

      // Clear the local Zustand shopping cart
      clearCart();

      // Redirect to live order tracking page
      router.push(`/orders/${order.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to place order. Please try again.');
    }
  };

  if (isSessionPending) {
    return (
      <div className="flex h-screen flex-col bg-zinc-50 dark:bg-black">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  // Not logged in UI
  if (!session?.user) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
        <Navbar />
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl border border-zinc-100 dark:bg-zinc-950 dark:border-zinc-900 space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-950/30">
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200">Sign in to Checkout</h2>
              <p className="mt-2 text-xs text-zinc-400">
                You must be logged in to configure your delivery addresses, apply promo codes, and place orders.
              </p>
            </div>
            <Link
              href="/auth/login?redirect=/checkout"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors shadow-md shadow-orange-500/10"
            >
              Sign In to Continue
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50/50 dark:bg-black pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-8 flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Checkout Setup */}
        <div className="flex-1 space-y-6 w-full">
          {errorMessage && (
            <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-semibold text-red-700 flex items-start gap-3 dark:bg-red-950/20 dark:border-red-950/40 dark:text-red-400">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Delivery Address Section */}
          <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-xs dark:border-zinc-900 dark:bg-zinc-950 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-50 pb-3 dark:border-zinc-900">
              <h2 className="text-base font-extrabold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-orange-500" />
                Delivery Address
              </h2>
              {!isAddingAddress && (
                <button
                  onClick={() => setIsAddingAddress(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Address
                </button>
              )}
            </div>

            {/* Add Address Form */}
            {isAddingAddress && (
              <form onSubmit={handleAddAddress} className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 dark:bg-zinc-900/50 dark:border-zinc-900 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">New Address Details</h3>
                  <button
                    type="button"
                    onClick={() => setIsAddingAddress(false)}
                    className="p-1 rounded-full text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Label</label>
                    <select
                      value={addressLabel}
                      onChange={(e) => setAddressLabel(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-2.5 text-xs outline-none focus:border-orange-500"
                    >
                      <option value="Home">🏠 Home</option>
                      <option value="Work">💼 Work</option>
                      <option value="Other">📍 Other</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">City</label>
                    <input
                      type="text"
                      placeholder="e.g. New Delhi"
                      value={addressCity}
                      onChange={(e) => setAddressCity(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-2.5 text-xs outline-none focus:border-orange-500 text-zinc-800 dark:text-zinc-200"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Full Street Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Apartment, floor, block, street details"
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-2.5 text-xs outline-none focus:border-orange-500 text-zinc-800 dark:text-zinc-200"
                    required
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is-default"
                    checked={isAddressDefault}
                    onChange={(e) => setIsAddressDefault(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
                  />
                  <label htmlFor="is-default" className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    Set as default delivery address
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={addAddressMutation.isPending}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/10 disabled:opacity-50"
                >
                  {addAddressMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save and Use Address
                </button>
              </form>
            )}

            {/* List addresses */}
            {addresses.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-400 font-semibold space-y-2">
                <p>No delivery addresses found.</p>
                {!isAddingAddress && (
                  <button
                    onClick={() => setIsAddingAddress(true)}
                    className="rounded-full bg-orange-50 px-4 py-1.5 font-bold text-orange-500"
                  >
                    Create address
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {addresses.map((addr) => (
                  <button
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`w-full flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all ${
                      selectedAddressId === addr.id
                        ? 'bg-orange-50/50 border-orange-200 dark:bg-orange-950/10 dark:border-orange-500/30'
                        : 'bg-white border-zinc-100 hover:bg-zinc-50 dark:bg-zinc-950 dark:border-zinc-900 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-zinc-300 transition-all text-white bg-white selectedAddressId">
                      <span className={`h-2.5 w-2.5 rounded-full transition-all ${
                        selectedAddressId === addr.id ? 'bg-orange-500 scale-100' : 'bg-transparent scale-0'
                      }`} />
                    </span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                          {addr.label}
                        </span>
                        {addr.isDefault && (
                          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] font-bold text-zinc-400 dark:bg-zinc-900">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 line-clamp-1 leading-relaxed">
                        {addr.addressLine}, {addr.city}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Payment Method section */}
          <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-xs dark:border-zinc-900 dark:bg-zinc-950 space-y-4">
            <h2 className="text-base font-extrabold text-zinc-800 dark:text-zinc-200 flex items-center gap-2 border-b border-zinc-50 pb-3 dark:border-zinc-900">
              <CreditCard className="h-5 w-5 text-orange-500" />
              Payment Method
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* COD */}
              <button
                onClick={() => setPaymentMethod('cod')}
                className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${
                  paymentMethod === 'cod'
                    ? 'bg-orange-50/50 border-orange-200 dark:bg-orange-950/10 dark:border-orange-500/30'
                    : 'bg-white border-zinc-100 hover:bg-zinc-50 dark:bg-zinc-950 dark:border-zinc-900 dark:hover:bg-zinc-900'
                }`}
              >
                <div className="h-10 w-10 shrink-0 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 font-bold text-base dark:bg-orange-950/30">
                  💵
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Cash on Delivery</h4>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Pay in cash or UPI at your door</p>
                </div>
              </button>

              {/* Wallet */}
              <button
                onClick={() => setPaymentMethod('wallet')}
                className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${
                  paymentMethod === 'wallet'
                    ? 'bg-orange-50/50 border-orange-200 dark:bg-orange-950/10 dark:border-orange-500/30'
                    : 'bg-white border-zinc-100 hover:bg-zinc-50 dark:bg-zinc-950 dark:border-zinc-900 dark:hover:bg-zinc-900'
                }`}
              >
                <div className="h-10 w-10 shrink-0 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 font-bold text-base dark:bg-orange-950/30">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">FoodHub Wallet</h4>
                  <p className="text-[10px] text-zinc-400 mt-0.5">
                    Balance: ${wallet?.balance ? Number(wallet.balance).toFixed(2) : '0.00'}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Add Special Instructions */}
          <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-xs dark:border-zinc-900 dark:bg-zinc-950 space-y-3">
            <h2 className="text-base font-extrabold text-zinc-800 dark:text-zinc-200 flex items-center gap-2 border-b border-zinc-50 pb-2 dark:border-zinc-900">
              <MessageSquare className="h-5 w-5 text-orange-500" />
              Special Instructions
            </h2>
            <textarea
              placeholder="e.g. Leave it at the gate, please ring bell once, don't include plastic cutlery..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows={3}
              className="w-full bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 text-xs outline-none focus:bg-white focus:border-orange-500 dark:focus:bg-zinc-950 text-zinc-800 dark:text-zinc-200"
            />
          </div>
        </div>

        {/* Right order summary details sidebar */}
        <aside className="w-full lg:w-96 shrink-0 space-y-6">
          <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-md dark:border-zinc-900 dark:bg-zinc-950 space-y-6">
            <h3 className="text-base font-extrabold text-zinc-800 dark:text-zinc-200 border-b border-zinc-50 pb-3 dark:border-zinc-900 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-orange-500" />
              Your Order
            </h3>

            {/* Cart products items */}
            <div className="space-y-4 max-h-52 overflow-y-auto">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-start gap-4 text-xs">
                  <div className="space-y-0.5">
                    <h4 className="font-semibold text-zinc-700 dark:text-zinc-300">
                      {item.name} <span className="text-orange-500 font-bold ml-1">x{item.quantity}</span>
                    </h4>
                    {item.selectedVariations.length > 0 && (
                      <p className="text-[10px] text-zinc-400 line-clamp-1">
                        {item.selectedVariations.map((v) => v.optionLabel).join(', ')}
                      </p>
                    )}
                  </div>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 shrink-0">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Coupon Code Section */}
            <div className="pt-4 border-t border-zinc-50 dark:border-zinc-900 space-y-2">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Apply Coupon</h4>
              {couponCode ? (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-orange-50 border border-orange-100 dark:bg-orange-950/20 dark:border-orange-950/40">
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="font-bold text-orange-600 dark:text-orange-400 uppercase">{couponCode}</p>
                      <p className="text-[10px] text-orange-400">Coupon applied successfully</p>
                    </div>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="p-1 rounded-full text-orange-400 hover:bg-orange-100 hover:text-orange-600 dark:hover:bg-orange-950"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="ENTER CODE..."
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 pl-9 pr-4 py-3 text-xs font-bold uppercase tracking-wider outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-zinc-950 text-zinc-800 dark:text-zinc-200"
                      />
                    </div>
                    <button
                      onClick={handleApplyCoupon}
                      className="rounded-2xl bg-orange-500 hover:bg-orange-600 px-5 text-xs font-bold text-white transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-[10px] font-bold text-red-500">{couponError}</p>
                  )}
                </div>
              )}
            </div>

            {/* Price Calculations breakdown */}
            <div className="pt-4 border-t border-zinc-50 dark:border-zinc-900 space-y-2.5 text-xs">
              <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                <span>Subtotal</span>
                <span>${getSubtotal().toFixed(2)}</span>
              </div>
              {couponCode && (
                <div className="flex justify-between font-semibold text-orange-500">
                  <span>Coupon Discount</span>
                  <span>-${getDiscountAmount().toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                <span>Delivery Fee</span>
                <span>${getDeliveryFee().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                <span>Platform Fee</span>
                <span>${getPlatformFee().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                <span>Tax</span>
                <span>${getTaxAmount().toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-50 pt-4 text-sm font-black text-zinc-900 dark:border-zinc-900 dark:text-zinc-100">
                <span>Total Amount</span>
                <span className="text-orange-500 text-base">${getTotal().toFixed(2)}</span>
              </div>
            </div>

            {/* Place Order Trigger */}
            <button
              onClick={handlePlaceOrder}
              disabled={placeOrderMutation.isPending}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 py-4 text-xs font-extrabold text-white shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 hover:scale-[1.01] transition-all disabled:opacity-50"
            >
              {placeOrderMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Placing Order...
                </>
              ) : (
                <>
                  Place Order • ${getTotal().toFixed(2)}
                </>
              )}
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}
