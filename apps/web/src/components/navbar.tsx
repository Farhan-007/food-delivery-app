'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from '@repo/auth/client';
import { useCartStore } from '@/store/cart';
import { useLocationStore } from '@/store/location';
import {
  ShoppingBag,
  MapPin,
  User,
  LogOut,
  Minus,
  Plus,
  Trash2,
  X,
  ChevronDown,
  History,
  Wallet,
  Menu,
  Check
} from 'lucide-react';

export function Navbar() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  
  const {
    items: cartItems,
    restaurant: cartRestaurant,
    updateQuantity,
    removeItem,
    getSubtotal,
    getTotal,
    clearCart
  } = useCartStore();

  const { address, lat, lng, setLocation } = useLocationStore();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  
  // Location form state
  const [searchAddr, setSearchAddr] = useState('');
  const [searchResults, setSearchResults] = useState<{ label: string; lat: number; lng: number }[]>([]);
  const [isSearchingAddr, setIsSearchingAddr] = useState(false);

  // Sync address form when store loaded
  useEffect(() => {
    if (address) setSearchAddr(address);
  }, [address]);

  // Handle location search via OpenStreetMap Nominatim
  const handleSearchLocation = async (query: string) => {
    if (query.length < 3) return;
    setIsSearchingAddr(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();
      const results = data.map((item: any) => ({
        label: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      }));
      setSearchResults(results);
    } catch (e) {
      console.error('Error finding address:', e);
    } finally {
      setIsSearchingAddr(false);
    }
  };

  const handleSelectAddress = (res: { label: string; lat: number; lng: number }) => {
    setLocation(res.lat, res.lng, res.label);
    setSearchAddr(res.label);
    setSearchResults([]);
    setIsLocationModalOpen(false);
  };

  const handleLogout = async () => {
    await signOut();
    setIsUserMenuOpen(false);
    router.refresh();
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-100 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-black/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white font-bold text-xl shadow-md shadow-orange-500/20 group-hover:scale-105 transition-all">
                🍕
              </span>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
                FoodHub
              </span>
            </Link>

            {/* Location Selector */}
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="hidden sm:flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50 px-4 py-1.5 text-sm font-medium transition-all hover:border-zinc-300 max-w-[280px] dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:bg-zinc-900 dark:hover:border-zinc-700"
            >
              <MapPin className="h-4 w-4 text-orange-500 shrink-0" />
              <span className="truncate text-zinc-700 dark:text-zinc-300">
                {address || 'Select delivery address'}
              </span>
              <ChevronDown className="h-3 w-3 text-zinc-400 shrink-0" />
            </button>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-4">
            {/* Mobile Location Icon */}
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="flex sm:hidden items-center justify-center h-10 w-10 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
            >
              <MapPin className="h-5 w-5 text-orange-500" />
            </button>

            {/* User Session Profile Button */}
            <div className="relative">
              {isPending ? (
                <div className="h-10 w-10 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-900" />
              ) : session?.user ? (
                <>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-1.5 rounded-full border border-zinc-200 p-0.5 pr-2.5 hover:bg-zinc-50 transition-all dark:border-zinc-800 dark:hover:bg-zinc-900"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white font-bold text-sm overflow-hidden">
                      {session.user.image ? (
                        <img src={session.user.image} alt={session.user.name} className="h-full w-full object-cover" />
                      ) : (
                        session.user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 max-w-[80px] truncate hidden md:inline">
                      {session.user.name.split(' ')[0]}
                    </span>
                    <ChevronDown className="h-3 w-3 text-zinc-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setIsUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-zinc-100 bg-white p-2 shadow-xl ring-1 ring-black/5 focus:outline-none z-40 dark:border-zinc-800 dark:bg-zinc-950">
                        <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-900">
                          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{session.user.name}</p>
                          <p className="text-xs text-zinc-400 truncate mt-0.5">{session.user.email}</p>
                        </div>
                        <div className="py-1">
                          <Link
                            href="/profile"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors dark:text-zinc-300 dark:hover:bg-zinc-900"
                          >
                            <User className="h-4 w-4 text-zinc-400" />
                            My Profile & Addresses
                          </Link>
                          <Link
                            href="/profile?tab=orders"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors dark:text-zinc-300 dark:hover:bg-zinc-900"
                          >
                            <History className="h-4 w-4 text-zinc-400" />
                            Order History
                          </Link>
                          <Link
                            href="/profile?tab=wallet"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors dark:text-zinc-300 dark:hover:bg-zinc-900"
                          >
                            <Wallet className="h-4 w-4 text-zinc-400" />
                            Wallet Balance
                          </Link>
                        </div>
                        <div className="border-t border-zinc-100 py-1 dark:border-zinc-900">
                          <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors dark:hover:bg-red-950/30"
                          >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-1.5 rounded-full bg-zinc-950 hover:bg-zinc-800 px-4 py-2 text-xs font-semibold text-white transition-all shadow-sm dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
                >
                  <User className="h-3.5 w-3.5" />
                  Sign In
                </Link>
              )}
            </div>

            {/* Shopping Cart button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 transition-all dark:border-zinc-800 dark:bg-black dark:hover:bg-zinc-900"
            >
              <ShoppingBag className="h-5 w-5 text-zinc-800 dark:text-zinc-200" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
                  {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Cart Slider Overlay */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={() => setIsCartOpen(false)} />
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="pointer-events-auto w-screen max-w-md transform transition-all duration-300">
              <div className="flex h-full flex-col bg-white shadow-2xl dark:bg-zinc-950">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-6 dark:border-zinc-900 sm:px-6">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-orange-500" />
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Your Basket</h2>
                  </div>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-900 dark:hover:text-zinc-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Items list */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                  {cartItems.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center gap-4 py-12">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-950/30">
                        <ShoppingBag className="h-8 w-8 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">Your basket is empty</h3>
                        <p className="mt-1 text-sm text-zinc-400 max-w-xs">
                          Add delicious items from your favorite restaurant to start an order.
                        </p>
                      </div>
                      <button
                        onClick={() => setIsCartOpen(false)}
                        className="mt-2 rounded-full bg-orange-500 px-6 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
                      >
                        Browse Restaurants
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/50">
                        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Ordering from</p>
                        <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{cartRestaurant?.name}</h4>
                      </div>

                      <div className="flow-root">
                        <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
                          {cartItems.map((item) => (
                            <li key={item.id} className="flex py-4">
                              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-900 flex items-center justify-center">
                                {item.image_url ? (
                                  <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                                ) : (
                                  <span className="text-2xl">🍔</span>
                                )}
                              </div>

                              <div className="ml-4 flex flex-1 flex-col">
                                <div>
                                  <div className="flex justify-between text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                                    <h5 className="truncate max-w-[180px]">{item.name}</h5>
                                    <p className="ml-4 text-orange-500">${(item.price * item.quantity).toFixed(2)}</p>
                                  </div>
                                  {item.selectedVariations.length > 0 && (
                                    <p className="mt-1 text-[11px] text-zinc-400">
                                      {item.selectedVariations.map((v) => v.optionLabel).join(', ')}
                                    </p>
                                  )}
                                </div>
                                <div className="flex flex-1 items-end justify-between text-xs">
                                  <div className="flex items-center border border-zinc-200 rounded-full px-1 py-0.5 dark:border-zinc-800">
                                    <button
                                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                      className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                                    >
                                      <Minus className="h-3 w-3" />
                                    </button>
                                    <span className="px-2.5 font-bold text-zinc-800 dark:text-zinc-200">{item.quantity}</span>
                                    <button
                                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                      className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </button>
                                  </div>

                                  <button
                                    onClick={() => removeItem(item.id)}
                                    className="flex items-center gap-1 font-medium text-red-500 hover:text-red-600 transition-colors"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer and calculations */}
                {cartItems.length > 0 && (
                  <div className="border-t border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-900 dark:bg-zinc-950/50 sm:p-6">
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                        <span>Subtotal</span>
                        <span>${getSubtotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                        <span>Delivery Fee</span>
                        <span>$2.99</span>
                      </div>
                      <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                        <span>Platform Fee</span>
                        <span>$0.99</span>
                      </div>
                      <div className="flex justify-between border-t border-zinc-100 pt-3 text-base font-bold text-zinc-900 dark:border-zinc-900 dark:text-zinc-100">
                        <span>Total (est.)</span>
                        <span className="text-orange-500">${getTotal().toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-3">
                      <Link
                        href="/checkout"
                        onClick={() => setIsCartOpen(false)}
                        className="flex items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 py-3.5 text-sm font-semibold text-white shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 hover:scale-[1.01] transition-all"
                      >
                        Go to Checkout
                      </Link>
                      <button
                        onClick={clearCart}
                        className="rounded-2xl border border-zinc-200 py-3 text-xs font-semibold text-zinc-500 hover:bg-zinc-50 transition-colors dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
                      >
                        Clear Basket
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Selector Modal */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setIsLocationModalOpen(false)} />
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl z-10 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-900">
              <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-orange-500" />
                Change Delivery Address
              </h3>
              <button
                onClick={() => setIsLocationModalOpen(false)}
                className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-950"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <p className="text-xs text-zinc-400">
                We need your delivery address to show menus and restaurants near you.
              </p>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter area, street name or landmark..."
                  value={searchAddr}
                  onChange={(e) => {
                    setSearchAddr(e.target.value);
                    handleSearchLocation(e.target.value);
                  }}
                  className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none transition-all focus:border-orange-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-200 dark:focus:bg-zinc-950"
                />
                {isSearchingAddr && (
                  <div className="absolute right-4 top-3.5 flex h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                )}
              </div>

              {/* Suggestions */}
              {searchResults.length > 0 && (
                <div className="divide-y divide-zinc-50 rounded-2xl border border-zinc-100 bg-white max-h-60 overflow-y-auto dark:divide-zinc-900 dark:border-zinc-900 dark:bg-zinc-950">
                  {searchResults.map((res, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectAddress(res)}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left text-xs text-zinc-700 hover:bg-zinc-50 transition-colors dark:text-zinc-300 dark:hover:bg-zinc-900"
                    >
                      <MapPin className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
                      <span>{res.label}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-900">
                <button
                  onClick={() => {
                    // Try Geolocation API
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        async (position) => {
                          const { latitude, longitude } = position.coords;
                          try {
                            const res = await fetch(
                              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                            );
                            const data = await res.json();
                            setLocation(latitude, longitude, data.display_name);
                            setIsLocationModalOpen(false);
                          } catch (e) {
                            setLocation(latitude, longitude, `GPS coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                            setIsLocationModalOpen(false);
                          }
                        },
                        (error) => {
                          alert('Error getting location: ' + error.message);
                        }
                      );
                    } else {
                      alert('Geolocation not supported in this browser.');
                    }
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-50 py-3 text-xs font-bold text-orange-600 hover:bg-orange-100 transition-colors dark:bg-orange-950/20 dark:text-orange-400 dark:hover:bg-orange-950/40"
                >
                  <MapPin className="h-4 w-4 animate-bounce" />
                  Use Current GPS Location
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
