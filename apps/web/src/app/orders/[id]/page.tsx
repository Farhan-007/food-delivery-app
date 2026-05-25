'use client';

import * as React from 'react';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { io, Socket } from 'socket.io-client';
import { trpc } from '@/utils/trpc';
import { Navbar } from '@/components/navbar';
import {
  MapPin,
  Clock,
  CheckCircle,
  Truck,
  Utensils,
  Star,
  DollarSign,
  AlertCircle,
  Loader2,
  Calendar,
  ChevronRight,
  Sparkles,
  PartyPopper
} from 'lucide-react';

// Dynamic import for Leaflet map to prevent Next.js SSR document-not-defined issues
const LiveMap = dynamic(() => import('@/components/live-map'), { ssr: false });

interface PageProps {
  params: Promise<{ id: string }>;
}

const ORDER_STATUS_STEPS = [
  { key: 'pending', label: 'Placed', desc: 'Awaiting confirmation', icon: Calendar },
  { key: 'accepted', label: 'Accepted', desc: 'Approved by restaurant', icon: CheckCircle },
  { key: 'preparing', label: 'Preparing', desc: 'Chef is cooking', icon: Utensils },
  { key: 'rider_assigned', label: 'Assigned', desc: 'Rider on the way', icon: Truck },
  { key: 'picked_up', label: 'Out', desc: 'Delivering to you', icon: Truck },
  { key: 'delivered', label: 'Delivered', desc: 'Enjoy your food!', icon: CheckCircle },
];

export default function OrderTrackingPage({ params }: PageProps) {
  const { id: orderId } = use(params);

  // Fetch real order from tRPC
  const { data: order, isLoading, refetch } = trpc.order.byId.useQuery({
    id: orderId,
  });

  const submitReviewMutation = trpc.order.submitReview.useMutation();

  // Socket and Location States
  const [liveStatus, setLiveStatus] = useState<string>('pending');
  const [riderId, setRiderId] = useState<string | null>(null);
  const [riderCoords, setRiderCoords] = useState<{ lat: number; lng: number; heading?: number | null } | null>(null);

  // Review state
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Sync state with db loaded order
  useEffect(() => {
    if (order) {
      setLiveStatus(order.status);
      if (order.riderId) {
        setRiderId(order.riderId);
      }
    }
  }, [order]);

  // Real-time socket updates
  useEffect(() => {
    if (!orderId) return;

    // Connect to /orders namespace
    const socket: Socket = io('http://localhost:3001/orders', {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected to order namespace');
      socket.emit('subscribe:order', orderId);

      if (riderId) {
        socket.emit('subscribe:rider', riderId);
      }
    });

    // Listen for order status updates
    socket.on('order:status:update', (data: { orderId: string; status: string; riderId?: string }) => {
      if (data.orderId === orderId) {
        setLiveStatus(data.status);
        if (data.riderId) {
          setRiderId(data.riderId);
          socket.emit('subscribe:rider', data.riderId);
        }
      }
    });

    // Listen for rider live GPS coordinates
    socket.on('rider:location:update', (data: { riderId: string; lat: number; lng: number; heading?: number | null }) => {
      if (data.riderId === riderId) {
        setRiderCoords({
          lat: data.lat,
          lng: data.lng,
          heading: data.heading,
        });
      }
    });

    return () => {
      socket.emit('unsubscribe:order', orderId);
      if (riderId) {
        socket.emit('unsubscribe:rider', riderId);
      }
      socket.disconnect();
    };
  }, [orderId, riderId]);

  // Mock Delivery Simulation - move marker closer if in development without a real rider
  useEffect(() => {
    if (liveStatus === 'picked_up' && !riderCoords) {
      // Start moving rider closer to target delivery point (simulation)
      const resLat = order?.restaurant?.lat || 28.6139;
      const resLng = order?.restaurant?.lng || 77.2090;
      const custLat = order?.deliveryAddress?.lat || 28.6250;
      const custLng = order?.deliveryAddress?.lng || 77.2200;

      let fraction = 0.1;
      setRiderCoords({ lat: resLat, lng: resLng });

      const interval = setInterval(() => {
        if (fraction >= 1.0) {
          clearInterval(interval);
          setLiveStatus('delivered');
          return;
        }

        const currentLat = resLat + (custLat - resLat) * fraction;
        const currentLng = resLng + (custLng - resLng) * fraction;

        setRiderCoords({
          lat: currentLat,
          lng: currentLng,
        });
        fraction += 0.15;
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [liveStatus, order, riderCoords]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitReviewMutation.mutateAsync({
        orderId,
        rating,
        comment: comment || null,
      });
      setReviewSuccess(true);
      refetch();
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col bg-zinc-50 dark:bg-black">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
            <p className="text-sm font-semibold text-zinc-500">Connecting to GPS tracker...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex h-screen flex-col bg-zinc-50 dark:bg-black">
        <Navbar />
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl border border-zinc-100 dark:bg-zinc-950 dark:border-zinc-900 space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/20">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200">Order Not Found</h2>
              <p className="mt-2 text-xs text-zinc-400">
                The specified order code does not exist or you do not have permission to inspect this delivery.
              </p>
            </div>
            <Link
              href="/"
              className="flex w-full items-center justify-center rounded-2xl bg-orange-500 py-3.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Find index of current live status in the steps list
  const currentStepIndex = ORDER_STATUS_STEPS.findIndex((s) => s.key === liveStatus);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50/50 dark:bg-black pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: GPS Map & Progress Steps */}
        <div className="lg:col-span-8 space-y-6 w-full">
          {/* GPS Tracking Map Card */}
          <div className="aspect-[16/10] sm:aspect-[16/9] w-full bg-zinc-100 dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-xs relative">
            <LiveMap
              restaurant={{
                lat: order.restaurant?.lat || 28.6139,
                lng: order.restaurant?.lng || 77.2090,
                name: order.restaurant?.name || 'Restaurant Depot',
              }}
              delivery={{
                lat: order.deliveryAddress?.lat || 28.6250,
                lng: order.deliveryAddress?.lng || 77.2200,
                address: order.deliveryAddress?.addressLine || 'Main Street, India',
              }}
              rider={riderCoords}
            />
          </div>

          {/* Interactive Steps tracker */}
          <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-xs dark:border-zinc-900 dark:bg-zinc-950 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-50 pb-3 dark:border-zinc-900">
              <div>
                <h2 className="text-sm font-bold text-zinc-800 uppercase tracking-wider dark:text-zinc-200">
                  Delivery Status Timeline
                </h2>
                <p className="text-[10px] text-zinc-400 font-medium">Last updated just now</p>
              </div>

              {liveStatus !== 'delivered' && (
                <div className="flex items-center gap-1 text-xs font-bold text-orange-500 bg-orange-50 dark:bg-orange-950/20 px-3 py-1 rounded-full animate-pulse">
                  <span className="h-2 w-2 rounded-full bg-orange-500" />
                  Estimated: {order.restaurant?.avgDeliveryTime || 30} mins
                </div>
              )}
            </div>

            {/* Stepper list */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
              {ORDER_STATUS_STEPS.map((step, idx) => {
                const isCompleted = idx <= currentStepIndex;
                const isActive = idx === currentStepIndex;
                const StepIcon = step.icon;

                return (
                  <div key={step.key} className="flex flex-col items-center text-center gap-2">
                    <div className={`h-11 w-11 rounded-full flex items-center justify-center border transition-all ${
                      isActive
                        ? 'bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/20 scale-110'
                        : isCompleted
                        ? 'bg-orange-50 border-orange-200 text-orange-500 dark:bg-orange-950/20 dark:border-orange-500/20'
                        : 'bg-white border-zinc-100 text-zinc-300 dark:bg-zinc-950 dark:border-zinc-900 dark:text-zinc-700'
                    }`}>
                      <StepIcon className={`h-5 w-5 ${isActive ? 'animate-bounce' : ''}`} />
                    </div>
                    <div>
                      <h4 className={`text-[11px] font-bold ${
                        isCompleted ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-400'
                      }`}>
                        {step.label}
                      </h4>
                      <p className="text-[9px] text-zinc-400 leading-normal hidden sm:block">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feedback Form Card if order is completed */}
          {liveStatus === 'delivered' && (
            <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-lg dark:border-zinc-900 dark:bg-zinc-950 space-y-4">
              <div className="flex items-center gap-2 text-base font-extrabold text-zinc-800 dark:text-zinc-200">
                <Sparkles className="h-5 w-5 text-orange-500" />
                <h2>Rate Your Experience!</h2>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Your feedback helps us and the chef maintain the highest quality standards. How was your meal from <b>{order.restaurant?.name}</b>?
              </p>

              {(order.review || reviewSuccess) ? (
                <div className="flex flex-col items-center text-center gap-3 p-6 rounded-2xl bg-orange-50/50 border border-orange-100 dark:bg-orange-950/10 dark:border-orange-500/20">
                  <div className="h-10 w-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-lg animate-bounce">
                    <PartyPopper className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-orange-700 dark:text-orange-400">Review Submitted!</h4>
                    <p className="text-xs text-orange-500/80 mt-0.5">Thank you for rating. Your contribution makes food better for everyone!</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4 pt-2">
                  {/* Star selector */}
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                      >
                        <Star className={`h-7 w-7 transition-all ${
                          star <= (hoverRating ?? rating)
                            ? 'text-amber-500 fill-amber-500 scale-105'
                            : 'text-zinc-200 dark:text-zinc-800'
                        }`} />
                      </button>
                    ))}
                  </div>

                  {/* Feedback comment input */}
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                      Review details (optional)
                    </label>
                    <textarea
                      placeholder="Excellent burgers, prompt delivery, highly recommended..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 text-xs outline-none focus:bg-white focus:border-orange-500 dark:focus:bg-zinc-950 text-zinc-800 dark:text-zinc-200"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitReviewMutation.isPending}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-500/10 disabled:opacity-50"
                  >
                    {submitReviewMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Submit Feedback
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Order Summary & Info */}
        <aside className="lg:col-span-4 w-full space-y-6">
          {/* Order Details Code */}
          <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-xs dark:border-zinc-900 dark:bg-zinc-950 space-y-4 text-xs">
            <h3 className="text-sm font-black text-zinc-800 dark:text-zinc-200 border-b border-zinc-50 pb-3 dark:border-zinc-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-500" />
              Receipt details
            </h3>

            <div className="space-y-3 font-semibold text-zinc-500 dark:text-zinc-400">
              <div className="flex justify-between">
                <span>Receipt Code</span>
                <span className="font-bold text-zinc-700 dark:text-zinc-300 uppercase">{order.orderNumber}</span>
              </div>

              <div className="flex justify-between">
                <span>Restaurant</span>
                <span className="font-bold text-zinc-700 dark:text-zinc-300">{order.restaurant?.name}</span>
              </div>

              <div className="flex justify-between">
                <span>Payment Mode</span>
                <span className="font-bold text-zinc-700 dark:text-zinc-300 uppercase">{order.paymentMethod}</span>
              </div>

              <div className="flex justify-between">
                <span>Order Type</span>
                <span className="font-bold text-zinc-700 dark:text-zinc-300 uppercase">{order.type}</span>
              </div>
            </div>

            {/* Address snippet */}
            {order.deliveryAddress && (
              <div className="pt-4 border-t border-zinc-50 dark:border-zinc-900 space-y-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Delivery To</span>
                <div className="flex gap-2 items-start font-semibold text-zinc-600 dark:text-zinc-400">
                  <MapPin className="h-4 w-4 shrink-0 text-zinc-400" />
                  <div>
                    <p className="text-zinc-700 dark:text-zinc-300 font-bold">{order.deliveryAddress.label}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{order.deliveryAddress.addressLine}, {order.deliveryAddress.city}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Checkout item catalog breakdown */}
          <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-xs dark:border-zinc-900 dark:bg-zinc-950 space-y-4">
            <h3 className="text-sm font-black text-zinc-800 dark:text-zinc-200 border-b border-zinc-50 pb-3 dark:border-zinc-900">
              Items
            </h3>

            <div className="space-y-3">
              {(order.items as any[])?.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start gap-4 text-xs font-medium">
                  <div>
                    <h4 className="font-bold text-zinc-800 dark:text-zinc-200">
                      {item.foodItemName} <span className="text-orange-500 font-black ml-1">x{item.quantity}</span>
                    </h4>
                    {item.selectedVariations?.length > 0 && (
                      <p className="text-[9px] text-zinc-400 mt-0.5">
                        {item.selectedVariations.map((v: any) => v.optionLabel).join(', ')}
                      </p>
                    )}
                  </div>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 shrink-0">
                    ${Number(item.totalPrice).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations pricing list */}
            <div className="pt-4 border-t border-zinc-50 dark:border-zinc-900 space-y-2.5 text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${Number(order.subtotal).toFixed(2)}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-orange-500 font-bold">
                  <span>Coupon Discount</span>
                  <span>-${Number(order.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>${Number(order.deliveryFee).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Fee</span>
                <span>${Number(order.platformFee).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${Number(order.tax).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-50 pt-4 text-sm font-black text-zinc-900 dark:border-zinc-900 dark:text-zinc-100">
                <span>Total Amount Paid</span>
                <span className="text-orange-500 text-base">${Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
