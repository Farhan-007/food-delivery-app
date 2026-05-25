'use client';

import { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/utils/trpc';
import { Navbar } from '@/components/navbar';
import { useLocationStore } from '@/store/location';
import { CUISINE_TYPES } from '@repo/config';
import {
  Search,
  SlidersHorizontal,
  Star,
  Clock,
  DollarSign,
  ChevronRight,
  TrendingUp,
  Award,
  Compass,
  UtensilsCrossed
} from 'lucide-react';

const MOCK_RESTAURANTS = [
  {
    id: '1',
    name: 'Gourmet Burger Kitchen',
    slug: 'gourmet-burger-kitchen',
    description: 'Voted best artisanal burgers in town. Crafted using premium ingredients.',
    coverUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=60',
    logoUrl: null,
    ratingAvg: 4.8,
    ratingCount: 120,
    cuisineType: ['Burgers', 'American'],
    avgDeliveryTime: 25,
    minOrderAmount: 12,
    isOpen: true,
  },
  {
    id: '2',
    name: 'Pizzeria Bella Italia',
    slug: 'pizzeria-bella-italia',
    description: 'Neapolitan stone-baked woodfire pizzas with pure fresh mozzarella.',
    coverUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=60',
    logoUrl: null,
    ratingAvg: 4.7,
    ratingCount: 340,
    cuisineType: ['Pizza', 'Italian'],
    avgDeliveryTime: 20,
    minOrderAmount: 15,
    isOpen: true,
  },
  {
    id: '3',
    name: 'Taj Mahal Indian Bistro',
    slug: 'taj-mahal-indian-bistro',
    description: 'Authentic Indian tandoori, delicious curries, and warm garlic naan bread.',
    coverUrl: 'https://images.unsplash.com/photo-1585938338392-50a59970d2ee?w=600&auto=format&fit=crop&q=60',
    logoUrl: null,
    ratingAvg: 4.6,
    ratingCount: 88,
    cuisineType: ['Indian', 'Vegetarian'],
    avgDeliveryTime: 35,
    minOrderAmount: 10,
    isOpen: true,
  },
  {
    id: '4',
    name: 'Sakura Sushi Bar',
    slug: 'sakura-sushi-bar',
    description: 'Fresh sushi, sashimi platters, and authentic Japanese ramen.',
    coverUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format&fit=crop&q=60',
    logoUrl: null,
    ratingAvg: 4.9,
    ratingCount: 205,
    cuisineType: ['Sushi', 'Japanese', 'Seafood'],
    avgDeliveryTime: 30,
    minOrderAmount: 20,
    isOpen: true,
  },
  {
    id: '5',
    name: 'Tacos El Caporal',
    slug: 'tacos-el-caporal',
    description: 'Street-style tacos, quesadillas, and homemade spicy salsa.',
    coverUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&auto=format&fit=crop&q=60',
    logoUrl: null,
    ratingAvg: 4.5,
    ratingCount: 150,
    cuisineType: ['Mexican', 'Fast Food'],
    avgDeliveryTime: 15,
    minOrderAmount: 8,
    isOpen: true,
  },
  {
    id: '6',
    name: 'The Sweet Spot Desserts',
    slug: 'the-sweet-spot-desserts',
    description: 'Decadent cheesecakes, freshly baked waffles, and organic ice cream.',
    coverUrl: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&auto=format&fit=crop&q=60',
    logoUrl: null,
    ratingAvg: 4.8,
    ratingCount: 95,
    cuisineType: ['Desserts', 'Bakery'],
    avgDeliveryTime: 20,
    minOrderAmount: 5,
    isOpen: false,
  }
];

const CUISINES_WITH_EMOJIS: { name: string; emoji: string }[] = [
  { name: 'All', emoji: '🍽️' },
  { name: 'Pizza', emoji: '🍕' },
  { name: 'Burgers', emoji: '🍔' },
  { name: 'Sushi', emoji: '🍣' },
  { name: 'Indian', emoji: '🍛' },
  { name: 'Mexican', emoji: '🌮' },
  { name: 'Fast Food', emoji: '🍟' },
  { name: 'Desserts', emoji: '🍰' },
  { name: 'Asian', emoji: '🍜' },
  { name: 'Vegetarian', emoji: '🥗' },
  { name: 'Bakery', emoji: '🥐' },
  { name: 'Seafood', emoji: '🍤' },
];

export default function Home() {
  const { lat, lng } = useLocationStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [sortBy, setSortBy] = useState<'rating' | 'delivery_time' | 'created_at' | 'distance'>('rating');
  const [maxDeliveryTime, setMaxDeliveryTime] = useState<number | undefined>(undefined);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Fetch real data from tRPC backend
  const { data: dbData, isLoading } = trpc.restaurant.search.useQuery({
    q: searchTerm || undefined,
    lat: lat || undefined,
    lng: lng || undefined,
    minRating: minRating || undefined,
    maxDeliveryTime: maxDeliveryTime || undefined,
    sortBy,
  });

  const activeRestaurants = dbData?.data && dbData.data.length > 0 ? dbData.data : [];

  // If DB query is empty/loading, we can fallback to mock restaurants to showcase beautiful UI
  const displayRestaurants = activeRestaurants.length > 0 
    ? activeRestaurants 
    : MOCK_RESTAURANTS.filter((r) => {
        // Search term filter
        if (searchTerm && !r.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        // Cuisine type filter
        if (selectedCuisine !== 'All' && !r.cuisineType.includes(selectedCuisine)) return false;
        // Rating filter
        if (minRating && r.ratingAvg < minRating) return false;
        // Delivery time filter
        if (maxDeliveryTime && r.avgDeliveryTime > maxDeliveryTime) return false;
        return true;
      });

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50/50 dark:bg-black">
      <Navbar />

      {/* Hero Banner Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-950 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-zinc-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(249,115,22,0.18),rgba(255,255,255,0))] pointer-events-none" />
        <div className="mx-auto max-w-4xl text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-4 py-1.5 text-xs font-semibold text-orange-400 border border-orange-500/20">
            <TrendingUp className="h-3.5 w-3.5 animate-pulse" />
            Voted India's Favourite Food App
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            Delicious food, delivered <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">super fast</span>
          </h1>
          <p className="max-w-xl mx-auto text-sm sm:text-base text-zinc-400 font-medium">
            Find the finest artisanal burgers, stone-baked pizzas, and exotic curries near you in just a couple of clicks.
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto pt-4">
            <div className="relative flex items-center bg-white rounded-3xl p-1.5 shadow-xl text-zinc-800 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus-within:border-orange-500 transition-all">
              <Search className="h-5 w-5 text-zinc-400 ml-4 shrink-0" />
              <input
                type="text"
                placeholder="Search menus, cuisines, or restaurants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent px-3 py-2 text-sm outline-none text-zinc-800 dark:text-zinc-100 placeholder-zinc-400"
              />
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-1.5 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 px-4 py-2.5 text-xs font-bold text-zinc-600 dark:text-zinc-300 transition-all shrink-0"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </button>
            </div>

            {/* Expandable filters */}
            {isFilterOpen && (
              <div className="mt-4 p-4 rounded-3xl bg-zinc-900/90 border border-zinc-800 text-left grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Sort By</label>
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full bg-zinc-800 text-white rounded-xl border border-zinc-700 px-3 py-2 outline-none"
                  >
                    <option value="rating">Highest Rated ⭐</option>
                    <option value="delivery_time">Quickest Delivery ⚡</option>
                    <option value="created_at">Newly Opened 🌱</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Max Delivery Time</label>
                  <select 
                    value={maxDeliveryTime || ''} 
                    onChange={(e) => setMaxDeliveryTime(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full bg-zinc-800 text-white rounded-xl border border-zinc-700 px-3 py-2 outline-none"
                  >
                    <option value="">Any time</option>
                    <option value="20">Under 20 mins</option>
                    <option value="30">Under 30 mins</option>
                    <option value="45">Under 45 mins</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Min Rating</label>
                  <select 
                    value={minRating || ''} 
                    onChange={(e) => setMinRating(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full bg-zinc-800 text-white rounded-xl border border-zinc-700 px-3 py-2 outline-none"
                  >
                    <option value="">Any rating</option>
                    <option value="4.5">4.5+ ⭐ (Excellent)</option>
                    <option value="4.0">4.0+ ⭐ (Very Good)</option>
                    <option value="3.5">3.5+ ⭐ (Good)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Cuisines slider section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-zinc-800 uppercase tracking-wider dark:text-zinc-200 flex items-center gap-1.5">
            <Compass className="h-4 w-4 text-orange-500" />
            Explore Cuisines
          </h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory">
          {CUISINES_WITH_EMOJIS.map((c) => (
            <button
              key={c.name}
              onClick={() => setSelectedCuisine(c.name)}
              className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-all shrink-0 snap-align-start border ${
                selectedCuisine === c.name
                  ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/10 scale-102'
                  : 'bg-white hover:bg-zinc-50 border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 dark:hover:bg-zinc-900 dark:text-zinc-300'
              }`}
            >
              <span className="text-lg">{c.emoji}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Restaurants grid section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 w-full flex-1">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-6 dark:border-zinc-900">
          <div>
            <h3 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100">
              {searchTerm || selectedCuisine !== 'All' ? 'Filtered Restaurants' : 'Restaurants Near You'}
            </h3>
            <p className="text-xs text-zinc-400 mt-1 font-medium">
              Showing {displayRestaurants.length} premium food venues
            </p>
          </div>
          {activeRestaurants.length === 0 && (
            <div className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-500 border border-amber-500/10">
              <Award className="h-3.5 w-3.5" />
              Showing Demo Catalog
            </div>
          )}
        </div>

        {displayRestaurants.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center gap-4 py-20 bg-white rounded-3xl border border-zinc-100 dark:bg-zinc-950 dark:border-zinc-900">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-50 dark:bg-zinc-900">
              <UtensilsCrossed className="h-8 w-8 text-zinc-300" />
            </div>
            <div>
              <h4 className="text-base font-bold text-zinc-700 dark:text-zinc-200">No restaurants match your filters</h4>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                Try searching for something else, clearing your filters, or broadening your location boundary.
              </p>
            </div>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCuisine('All');
                setMinRating(undefined);
                setMaxDeliveryTime(undefined);
              }}
              className="rounded-full bg-orange-500 px-6 py-2 text-xs font-semibold text-white hover:bg-orange-600 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayRestaurants.map((res) => (
              <Link
                href={`/restaurant/${res.slug}`}
                key={res.id}
                className="group flex flex-col overflow-hidden rounded-3xl bg-white border border-zinc-100 hover:border-zinc-200 shadow-xs hover:shadow-lg transition-all dark:bg-zinc-950 dark:border-zinc-900 dark:hover:border-zinc-800"
              >
                {/* Cover Photo */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900 shrink-0">
                  {res.coverUrl ? (
                    <img
                      src={res.coverUrl}
                      alt={res.name}
                      className="h-full w-full object-cover group-hover:scale-103 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-orange-50 text-orange-500 font-bold dark:bg-orange-950/20">
                      🍛 FoodHub Venue
                    </div>
                  )}

                  {/* Status overlay */}
                  {!res.isOpen && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                      <span className="rounded-full bg-red-600 px-4 py-1 text-xs font-bold text-white shadow-md">
                        Closed for Orders
                      </span>
                    </div>
                  )}

                  {/* Rating badge */}
                  {res.ratingAvg > 0 && (
                    <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-zinc-900 shadow-md">
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
                      <span>{res.ratingAvg.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {/* Content Details */}
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-extrabold text-zinc-800 dark:text-zinc-200 group-hover:text-orange-500 transition-colors text-base truncate">
                      {res.name}
                    </h4>
                    <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:translate-x-1 transition-transform shrink-0 mt-1" />
                  </div>

                  <p className="mt-1 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {res.description || 'Welcome to our restaurant menu. Click to explore delicious items and order.'}
                  </p>

                  {/* Cuisine types */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {res.cuisineType.slice(0, 3).map((c) => (
                      <span
                        key={c}
                        className="rounded-lg bg-zinc-50 border border-zinc-100 dark:border-zinc-900 px-2 py-0.5 text-[10px] font-semibold text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-400"
                      >
                        {c}
                      </span>
                    ))}
                  </div>

                  {/* Pricing and time summary */}
                  <div className="mt-auto border-t border-zinc-50 pt-4 mt-4 flex items-center justify-between text-[11px] font-bold text-zinc-500 dark:border-zinc-900 dark:text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <span>{res.avgDeliveryTime} mins</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <span>Min: ${res.minOrderAmount}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
