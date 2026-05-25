'use client';

import * as React from 'react';
import { useState, use } from 'react';
import Link from 'next/link';
import { trpc } from '@/utils/trpc';
import { Navbar } from '@/components/navbar';
import { useCartStore } from '@/store/cart';
import {
  Star,
  Clock,
  DollarSign,
  Plus,
  Minus,
  X,
  ChevronRight,
  Info,
  Check,
  ArrowLeft,
  ShoppingBag
} from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const MOCK_RESTAURANTS_DETAIL = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Gourmet Burger Kitchen',
  description: 'Voted best artisanal burgers in town. Crafted using premium organic ingredients.',
  coverUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1000&auto=format&fit=crop&q=80',
  logoUrl: null,
  ratingAvg: 4.8,
  ratingCount: 120,
  minOrderAmount: 12,
  avgDeliveryTime: 25,
  deliveryRadiusKm: 10,
  categories: [
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Artisanal Burgers',
      foodItems: [
        {
          id: '22222222-2222-2222-2222-222222222222',
          name: 'Classic Prime Beef Burger',
          description: 'A succulent grass-fed prime beef patty, cheddar cheese, crisp lettuce, tomato, and house pickle sauce on a brioche bun.',
          price: 11.99,
          imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=60',
          variations: [
            {
              id: 'a1111111-1111-1111-1111-111111111111',
              title: 'Choose size',
              type: 'radio',
              isRequired: true,
              options: [
                { id: 'b1111111-1111-1111-1111-111111111111', label: 'Single Patty (4oz)', priceModifier: 0, isDefault: true },
                { id: 'b1111111-1111-1111-1111-111111111112', label: 'Double Patty (+8oz)', priceModifier: 3.99, isDefault: false },
                { id: 'b1111111-1111-1111-1111-111111111113', label: 'Triple Monster (+12oz)', priceModifier: 6.99, isDefault: false },
              ],
            },
            {
              id: 'a2222222-2222-2222-2222-222222222222',
              title: 'Choose cheese',
              type: 'radio',
              isRequired: false,
              options: [
                { id: 'b2222222-2222-2222-2222-222222222221', label: 'Aged Cheddar', priceModifier: 0, isDefault: true },
                { id: 'b2222222-2222-2222-2222-222222222222', label: 'Swiss Cheese', priceModifier: 0.50, isDefault: false },
                { id: 'b2222222-2222-2222-2222-222222222223', label: 'Vegan Mozzarella', priceModifier: 1.00, isDefault: false },
              ],
            },
            {
              id: 'a3333333-3333-3333-3333-333333333333',
              title: 'Extra toppings',
              type: 'checkbox',
              isRequired: false,
              options: [
                { id: 'b3333333-3333-3333-3333-333333333331', label: 'Crispy Bacon', priceModifier: 1.99, isDefault: false },
                { id: 'b3333333-3333-3333-3333-333333333332', label: 'Fried Egg', priceModifier: 1.25, isDefault: false },
                { id: 'b3333333-3333-3333-3333-333333333333', label: 'Caramelized Onions', priceModifier: 0.75, isDefault: false },
                { id: 'b3333333-3333-3333-3333-333333333334', label: 'Sliced Avocado', priceModifier: 1.50, isDefault: false },
              ],
            },
          ],
        },
        {
          id: '22222222-2222-2222-2222-222222222223',
          name: 'Crispy Buttermilk Chicken',
          description: 'Deep-fried golden chicken breast, honey mustard glaze, creamy coleslaw, and spicy jalapeño mayo on a fresh sesame bun.',
          price: 10.99,
          imageUrl: 'https://images.unsplash.com/photo-1627662236973-4f8259fa2441?w=400&auto=format&fit=crop&q=60',
          variations: [],
        },
      ],
    },
    {
      id: '11111111-1111-1111-1111-111111111112',
      name: 'Sides & Sharing',
      foodItems: [
        {
          id: '33333333-3333-3333-3333-333333333333',
          name: 'Truffle Parmesan Fries',
          description: 'Thick hand-cut potato wedges tossed in truffle oil, fresh parsley, and grated aged Parmesan cheese.',
          price: 5.49,
          imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&auto=format&fit=crop&q=60',
          variations: [
            {
              id: 'a4444444-4444-4444-4444-444444444444',
              title: 'Choose Dipping Sauce',
              type: 'checkbox',
              isRequired: false,
              options: [
                { id: 'b4444444-4444-4444-4444-444444444441', label: 'Garlic Aioli', priceModifier: 0.50, isDefault: false },
                { id: 'b4444444-4444-4444-4444-444444444442', label: 'Smoky BBQ', priceModifier: 0.50, isDefault: false },
                { id: 'b4444444-4444-4444-4444-444444444443', label: 'Spicy Sriracha Mayo', priceModifier: 0.50, isDefault: false },
              ],
            },
          ],
        },
        {
          id: '33333333-3333-3333-3333-333333333334',
          name: 'Mozzarella Crunch Sticks',
          description: 'Elongated mozzarella cheese blocks rolled in garlic herb breadcrumbs, fried crisp and served with marinara sauce.',
          price: 6.25,
          imageUrl: 'https://images.unsplash.com/photo-1531749668029-2db88e4b76ce?w=400&auto=format&fit=crop&q=60',
          variations: [],
        },
      ],
    },
    {
      id: '11111111-1111-1111-1111-111111111113',
      name: 'Gourmet Shakes & Drinks',
      foodItems: [
        {
          id: '55555555-5555-5555-5555-555555555555',
          name: 'Salted Caramel Waffle Shake',
          description: 'A decadent rich milkshake blended with organic salted caramel, whipped vanilla cream, topped with miniature caramel waffles.',
          price: 5.99,
          imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&auto=format&fit=crop&q=60',
          variations: [],
        },
        {
          id: '55555555-5555-5555-5555-555555555556',
          name: 'Fresh Mint Lemonade',
          description: 'Freshly squeezed lemons, mint leaves, pure cane sugar syrup, and crushed ice.',
          price: 3.49,
          imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&auto=format&fit=crop&q=60',
          variations: [],
        },
      ],
    },
  ],
};

export default function RestaurantPage({ params }: PageProps) {
  const { slug } = use(params);

  // tRPC query to load real restaurant menu
  const { data: dbRestaurant, isLoading: isDbLoading } = trpc.restaurant.bySlug.useQuery({
    slug,
  });

  const cartItems = useCartStore((s) => s.items);
  const addCartItem = useCartStore((s) => s.addItem);

  // Active category navigation
  const [activeCategory, setActiveCategory] = useState<string>('');

  // Selected item modal state
  const [selectedFoodItem, setSelectedFoodItem] = useState<any>(null);
  const [selectedRadioOptions, setSelectedRadioOptions] = useState<Record<string, any>>({});
  const [selectedCheckboxOptions, setSelectedCheckboxOptions] = useState<Record<string, any[]>>({});
  const [itemQuantity, setItemQuantity] = useState(1);
  const [differentRestaurantError, setDifferentRestaurantError] = useState(false);

  const restaurant = dbRestaurant || MOCK_RESTAURANTS_DETAIL;

  // Initialize selected default options when modal opens
  const handleOpenItemModal = (foodItem: any) => {
    setSelectedFoodItem(foodItem);
    setItemQuantity(1);
    setDifferentRestaurantError(false);

    const radioDefaults: Record<string, any> = {};
    const checkDefaults: Record<string, any[]> = {};

    foodItem.variations?.forEach((v: any) => {
      if (v.type === 'radio') {
        const defaultOpt = v.options?.find((o: any) => o.isDefault) || v.options?.[0];
        if (defaultOpt) {
          radioDefaults[v.id] = defaultOpt;
        }
      } else {
        checkDefaults[v.id] = [];
      }
    });

    setSelectedRadioOptions(radioDefaults);
    setSelectedCheckboxOptions(checkDefaults);
  };

  const handleSelectRadio = (variationId: string, option: any) => {
    setSelectedRadioOptions((prev) => ({
      ...prev,
      [variationId]: option,
    }));
  };

  const handleToggleCheckbox = (variationId: string, option: any) => {
    setSelectedCheckboxOptions((prev) => {
      const current = prev[variationId] || [];
      const exists = current.find((o) => o.id === option.id);
      
      const updated = exists
        ? current.filter((o) => o.id !== option.id)
        : [...current, option];

      return {
        ...prev,
        [variationId]: updated,
      };
    });
  };

  // Calculate pricing for currently configured item in modal
  const calculateConfiguredItemPrice = () => {
    if (!selectedFoodItem) return 0;
    let base = Number(selectedFoodItem.price);
    
    // Add radios
    Object.values(selectedRadioOptions).forEach((opt) => {
      base += Number(opt.priceModifier || 0);
    });

    // Add checkboxes
    Object.values(selectedCheckboxOptions).forEach((opts) => {
      opts.forEach((opt) => {
        base += Number(opt.priceModifier || 0);
      });
    });

    return base;
  };

  const handleAddToBasket = () => {
    if (!selectedFoodItem) return;

    // Build the set of selected variations
    const selections: any[] = [];
    
    Object.entries(selectedRadioOptions).forEach(([varId, opt]) => {
      const variation = selectedFoodItem.variations.find((v: any) => v.id === varId);
      selections.push({
        variationId: varId,
        variationTitle: variation?.title || '',
        optionId: opt.id,
        optionLabel: opt.label,
        optionPrice: Number(opt.priceModifier || 0),
      });
    });

    Object.entries(selectedCheckboxOptions).forEach(([varId, opts]) => {
      const variation = selectedFoodItem.variations.find((v: any) => v.id === varId);
      opts.forEach((opt) => {
        selections.push({
          variationId: varId,
          variationTitle: variation?.title || '',
          optionId: opt.id,
          optionLabel: opt.label,
          optionPrice: Number(opt.priceModifier || 0),
        });
      });
    });

    const finalItemPrice = calculateConfiguredItemPrice();
    const result = addCartItem(
      {
        foodItemId: selectedFoodItem.id,
        name: selectedFoodItem.name,
        price: finalItemPrice,
        basePrice: Number(selectedFoodItem.price),
        image_url: selectedFoodItem.imageUrl || selectedFoodItem.image_url,
        quantity: itemQuantity,
        selectedVariations: selections,
      },
      {
        id: restaurant.id || 'demo-restaurant',
        name: restaurant.name,
        delivery_radius_km: restaurant.deliveryRadiusKm || 10,
        min_order_amount: restaurant.minOrderAmount || 12,
      }
    );

    if (result.success) {
      setSelectedFoodItem(null);
    } else if (result.error === 'order_different_restaurant') {
      setDifferentRestaurantError(true);
    }
  };

  if (isDbLoading) {
    return (
      <div className="flex h-screen flex-col bg-zinc-50 dark:bg-black">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
            <p className="text-sm font-semibold text-zinc-500">Loading delicious menus...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50/50 dark:bg-black pb-12">
      <Navbar />

      {/* Hero Banner Header */}
      <section className="relative w-full aspect-[4/1] md:aspect-[5/1] overflow-hidden bg-zinc-900 border-b border-zinc-100 dark:border-zinc-900">
        {restaurant.coverUrl ? (
          <img src={restaurant.coverUrl} alt={restaurant.name} className="h-full w-full object-cover opacity-70" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-orange-950/20 text-orange-500 font-bold">
            🍛 Premium Food Venue
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-6 left-4 sm:left-8 right-4 text-white z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 max-w-7xl mx-auto w-full">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md px-3 py-1.5 text-xs font-bold hover:bg-white/20 transition-all mb-4"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Link>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight drop-shadow-md">
              {restaurant.name}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-xl font-medium mt-1">
              {restaurant.description || 'Welcome to our gourmet restaurant page. Browse categories and add fresh plates to your basket.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
            {restaurant.ratingAvg > 0 && (
              <div className="flex items-center gap-1 rounded-2xl bg-white px-3.5 py-2 text-zinc-900 shadow-md">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />
                <span>{restaurant.ratingAvg.toFixed(1)}</span>
                <span className="text-zinc-400 font-normal">({restaurant.ratingCount})</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 rounded-2xl bg-orange-500 px-3.5 py-2 text-white shadow-md shadow-orange-500/10">
              <Clock className="h-4 w-4 shrink-0" />
              <span>{restaurant.avgDeliveryTime} mins</span>
            </div>

            <div className="flex items-center gap-1 rounded-2xl bg-zinc-900 border border-zinc-800 px-3.5 py-2 text-zinc-300 shadow-md">
              <DollarSign className="h-4 w-4 shrink-0" />
              <span>Min: ${restaurant.minOrderAmount}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Menu Grid / Category split */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-8 flex flex-col md:flex-row gap-8 items-start">
        {/* Sticky sidebar category navigator */}
        <aside className="w-full md:w-64 shrink-0 md:sticky md:top-24 space-y-3">
          <div className="rounded-3xl border border-zinc-100 bg-white p-4 dark:border-zinc-900 dark:bg-zinc-950">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3 px-1">Menu Sections</h3>
            <ul className="space-y-1">
              {restaurant.categories?.map((cat: any) => (
                <li key={cat.id}>
                  <a
                    href={`#cat-${cat.id}`}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
                      activeCategory === cat.id
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/10'
                        : 'text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      activeCategory === cat.id
                        ? 'bg-orange-600/50 text-white'
                        : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400'
                    }`}>
                      {cat.foodItems?.length || 0}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Categories list and products */}
        <div className="flex-1 space-y-12 w-full">
          {restaurant.categories?.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center gap-4 py-20 bg-white rounded-3xl border border-zinc-100 dark:bg-zinc-950 dark:border-zinc-900">
              <div className="h-12 w-12 rounded-full bg-zinc-50 flex items-center justify-center dark:bg-zinc-900">
                <Info className="h-6 w-6 text-zinc-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">No dishes listed yet</h4>
                <p className="text-xs text-zinc-400 max-w-xs mt-1">
                  This restaurant hasn't set up its menu catalog. Check back again later!
                </p>
              </div>
            </div>
          ) : (
            restaurant.categories?.map((cat: any) => (
              <section key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-24 space-y-4">
                <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-900">
                  <span className="h-2 w-2 rounded-full bg-orange-500" />
                  {cat.name}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {cat.foodItems?.map((food: any) => (
                    <div
                      key={food.id}
                      className="group flex flex-col sm:flex-row gap-4 p-4 rounded-3xl border border-zinc-100 hover:border-zinc-200 bg-white hover:shadow-md transition-all dark:border-zinc-900 dark:bg-zinc-950 dark:hover:border-zinc-900"
                    >
                      {/* Product details */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-extrabold text-zinc-800 dark:text-zinc-200 text-sm">
                            {food.name}
                          </h3>
                          <p className="mt-1 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                            {food.description || 'Made fresh to order with handpicked kitchen ingredients. Served delicious.'}
                          </p>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-base font-black text-orange-500">
                            ${Number(food.price).toFixed(2)}
                          </span>

                          <button
                            onClick={() => handleOpenItemModal(food)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm hover:bg-orange-600 hover:scale-105 transition-all"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Cover image */}
                      <div className="relative h-24 w-full sm:w-24 shrink-0 overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50 dark:border-zinc-900 dark:bg-zinc-900 flex items-center justify-center">
                        {food.imageUrl || food.image_url ? (
                          <img
                            src={food.imageUrl || food.image_url}
                            alt={food.name}
                            className="h-full w-full object-cover group-hover:scale-103 transition-transform duration-500"
                          />
                        ) : (
                          <span className="text-3xl">🍔</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </div>

      {/* Variation Configuration Modal */}
      {selectedFoodItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-fade-in" onClick={() => setSelectedFoodItem(null)} />
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl z-10 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-zinc-100 pb-4 dark:border-zinc-900">
              <div>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-200">
                  Configure Your Dish
                </h3>
                <h4 className="text-sm font-bold text-orange-500 mt-0.5">{selectedFoodItem.name}</h4>
              </div>
              <button
                onClick={() => setSelectedFoodItem(null)}
                className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error banner if cart has items from different restaurant */}
            {differentRestaurantError && (
              <div className="mt-3 p-3 rounded-2xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 dark:bg-red-950/20 dark:border-red-950/40 dark:text-red-400">
                You already have items in your basket from another restaurant. Please empty your basket first.
              </div>
            )}

            {/* Scrollable variation list */}
            <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1">
              {/* If no variations, present simple dialog */}
              {(!selectedFoodItem.variations || selectedFoodItem.variations.length === 0) ? (
                <div className="text-center py-6 text-zinc-400 text-xs font-semibold">
                  This dish has no custom add-ons. Simply configure quantity and add to basket!
                </div>
              ) : (
                selectedFoodItem.variations.map((v: any) => (
                  <div key={v.id} className="space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-50 pb-2 dark:border-zinc-900">
                      <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider dark:text-zinc-300">
                        {v.title}
                      </h4>
                      {v.isRequired ? (
                        <span className="rounded-md bg-orange-50 px-2 py-0.5 text-[9px] font-bold text-orange-600 dark:bg-orange-950/20 dark:text-orange-400">
                          Required
                        </span>
                      ) : (
                        <span className="rounded-md bg-zinc-50 px-2 py-0.5 text-[9px] font-bold text-zinc-400 dark:bg-zinc-900/50">
                          Optional
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      {v.options?.map((opt: any) => {
                        const isRadio = v.type === 'radio';
                        const isSelected = isRadio
                          ? selectedRadioOptions[v.id]?.id === opt.id
                          : selectedCheckboxOptions[v.id]?.find((o) => o.id === opt.id);

                        return (
                          <button
                            key={opt.id}
                            onClick={() =>
                              isRadio ? handleSelectRadio(v.id, opt) : handleToggleCheckbox(v.id, opt)
                            }
                            className={`flex w-full items-center justify-between rounded-2xl border p-3.5 text-xs font-semibold text-left transition-all ${
                              isSelected
                                ? 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/10 dark:border-orange-500/30 dark:text-orange-400'
                                : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span className={`flex h-4 w-4 shrink-0 items-center justify-center border transition-all ${
                                isRadio ? 'rounded-full' : 'rounded-md'
                              } ${
                                isSelected
                                  ? 'bg-orange-500 border-orange-500 text-white'
                                  : 'border-zinc-300 dark:border-zinc-700'
                              }`}>
                                {isSelected && <Check className="h-2.5 w-2.5 stroke-[4px]" />}
                              </span>
                              <span>{opt.label}</span>
                            </span>
                            {opt.priceModifier > 0 && (
                              <span className="text-orange-500 font-bold">
                                +${Number(opt.priceModifier).toFixed(2)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Actions */}
            <div className="border-t border-zinc-100 pt-4 dark:border-zinc-900 flex items-center justify-between gap-4">
              {/* Quantity Counter */}
              <div className="flex items-center border border-zinc-200 rounded-full px-2 py-1.5 dark:border-zinc-800 shrink-0 bg-zinc-50 dark:bg-zinc-900/50">
                <button
                  onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                  className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 font-bold text-sm text-zinc-800 dark:text-zinc-200">{itemQuantity}</span>
                <button
                  onClick={() => setItemQuantity(itemQuantity + 1)}
                  className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Add to Basket button */}
              <button
                onClick={handleAddToBasket}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 py-3.5 text-xs font-semibold text-white shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 hover:scale-[1.01] transition-all"
              >
                <ShoppingBag className="h-4 w-4" />
                Add to Basket • ${(calculateConfiguredItemPrice() * itemQuantity).toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
