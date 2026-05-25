import { db } from './client.js';
import {
  users,
  restaurants,
  categories,
  foodItems,
  itemVariations,
  itemVariationOptions,
  addresses,
  wallets,
  coupons,
  zones,
} from './schema/index.js';

// ============================================================
// Seed Script — Demo Data
// ============================================================

async function seed(): Promise<void> {
  console.log('🌱 Starting database seed...');

  // --- Users ---
  console.log('👤 Seeding users...');
  const [admin, vendor1, vendor2, customer1, customer2, rider1, rider2] = await db
    .insert(users)
    .values([
      {
        email: 'admin@foodhub.dev',
        name: 'Platform Admin',
        role: 'super_admin',
        emailVerified: true,
        isActive: true,
      },
      {
        email: 'mario@pizzapalace.dev',
        name: 'Mario Rossi',
        role: 'vendor',
        emailVerified: true,
        isActive: true,
      },
      {
        email: 'chen@dragonwok.dev',
        name: 'Li Chen',
        role: 'vendor',
        emailVerified: true,
        isActive: true,
      },
      {
        email: 'customer@example.dev',
        name: 'Alex Johnson',
        role: 'customer',
        phone: '+14155550101',
        emailVerified: true,
        phoneVerified: true,
        isActive: true,
      },
      {
        email: 'sarah@example.dev',
        name: 'Sarah Williams',
        role: 'customer',
        phone: '+14155550102',
        emailVerified: true,
        isActive: true,
      },
      {
        email: 'rider1@foodhub.dev',
        name: 'James Rivera',
        role: 'rider',
        phone: '+14155550201',
        emailVerified: true,
        phoneVerified: true,
        isActive: true,
      },
      {
        email: 'rider2@foodhub.dev',
        name: 'Priya Patel',
        role: 'rider',
        phone: '+14155550202',
        emailVerified: true,
        phoneVerified: true,
        isActive: true,
      },
    ])
    .returning();

  // --- Wallets ---
  console.log('💰 Seeding wallets...');
  await db.insert(wallets).values([
    { userId: customer1!.id, balance: 25.5, currency: 'USD' },
    { userId: customer2!.id, balance: 10.0, currency: 'USD' },
    { userId: rider1!.id, balance: 150.75, currency: 'USD' },
    { userId: rider2!.id, balance: 88.0, currency: 'USD' },
    { userId: vendor1!.id, balance: 1200.0, currency: 'USD' },
    { userId: vendor2!.id, balance: 890.5, currency: 'USD' },
  ]);

  // --- Customer Addresses ---
  console.log('📍 Seeding addresses...');
  await db.insert(addresses).values([
    {
      userId: customer1!.id,
      label: 'Home',
      addressLine: '123 Main Street, Apt 4B',
      city: 'San Francisco',
      lat: 37.7749,
      lng: -122.4194,
      isDefault: true,
      deliveryInstructions: 'Ring the doorbell twice',
    },
    {
      userId: customer1!.id,
      label: 'Work',
      addressLine: '456 Market Street, Floor 12',
      city: 'San Francisco',
      lat: 37.7895,
      lng: -122.3989,
      isDefault: false,
    },
    {
      userId: customer2!.id,
      label: 'Home',
      addressLine: '789 Castro Street',
      city: 'San Francisco',
      lat: 37.7609,
      lng: -122.435,
      isDefault: true,
    },
  ]);

  const defaultHours = {
    mon: { open: '10:00', close: '22:00' },
    tue: { open: '10:00', close: '22:00' },
    wed: { open: '10:00', close: '22:00' },
    thu: { open: '10:00', close: '22:00' },
    fri: { open: '10:00', close: '23:00' },
    sat: { open: '11:00', close: '23:00' },
    sun: { open: '11:00', close: '21:00' },
  };

  // --- Restaurants ---
  console.log('🍕 Seeding restaurants...');
  const [pizzaPalace, dragonWok, burgerjoint] = await db
    .insert(restaurants)
    .values([
      {
        ownerId: vendor1!.id,
        name: "Mario's Pizza Palace",
        slug: 'marios-pizza-palace',
        description:
          'Authentic Neapolitan pizza crafted with imported Italian ingredients. Family recipes since 1975.',
        logoUrl: 'https://placehold.co/200x200/FF6B35/ffffff?text=🍕',
        coverUrl: 'https://placehold.co/1200x400/FF6B35/ffffff?text=Pizza+Palace',
        cuisineType: ['Italian', 'Pizza', 'Pasta'],
        address: '234 Columbus Ave',
        city: 'San Francisco',
        lat: 37.7976,
        lng: -122.4073,
        isOpen: true,
        isActive: true,
        isApproved: true,
        minOrderAmount: 15,
        avgDeliveryTime: 25,
        deliveryRadiusKm: 8,
        ratingAvg: 4.7,
        ratingCount: 342,
        openingHours: defaultHours,
      },
      {
        ownerId: vendor2!.id,
        name: 'Dragon Wok Express',
        slug: 'dragon-wok-express',
        description:
          'Traditional Chinese cuisine meets modern flavors. Our wok-fried dishes are cooked at 1000°F for that authentic smoky taste.',
        logoUrl: 'https://placehold.co/200x200/2D6A4F/ffffff?text=🐉',
        coverUrl: 'https://placehold.co/1200x400/2D6A4F/ffffff?text=Dragon+Wok',
        cuisineType: ['Chinese', 'Asian', 'Noodles'],
        address: '567 Kearny Street',
        city: 'San Francisco',
        lat: 37.7942,
        lng: -122.4046,
        isOpen: true,
        isActive: true,
        isApproved: true,
        minOrderAmount: 12,
        avgDeliveryTime: 20,
        deliveryRadiusKm: 6,
        ratingAvg: 4.5,
        ratingCount: 218,
        openingHours: defaultHours,
      },
      {
        ownerId: vendor1!.id,
        name: 'The Burger Joint',
        slug: 'the-burger-joint',
        description:
          'Smash burgers made with locally sourced 100% beef. Hand-cut fries. Craft milkshakes. Simple done perfectly.',
        logoUrl: 'https://placehold.co/200x200/8B0000/ffffff?text=🍔',
        coverUrl: 'https://placehold.co/1200x400/8B0000/ffffff?text=Burger+Joint',
        cuisineType: ['American', 'Burgers', 'Fast Food'],
        address: '890 Valencia Street',
        city: 'San Francisco',
        lat: 37.7601,
        lng: -122.4213,
        isOpen: false,
        isActive: true,
        isApproved: true,
        minOrderAmount: 10,
        avgDeliveryTime: 18,
        deliveryRadiusKm: 5,
        ratingAvg: 4.8,
        ratingCount: 567,
        openingHours: defaultHours,
      },
    ])
    .returning();

  // --- Pizza Palace Menu ---
  console.log('📋 Seeding menus...');
  const [pizzaCats, wokCats] = await Promise.all([
    db
      .insert(categories)
      .values([
        {
          restaurantId: pizzaPalace!.id,
          name: 'Signature Pizzas',
          description: 'Our most beloved creations',
          sortOrder: 1,
        },
        {
          restaurantId: pizzaPalace!.id,
          name: 'Classic Pastas',
          description: 'Handmade daily',
          sortOrder: 2,
        },
        {
          restaurantId: pizzaPalace!.id,
          name: 'Starters & Sides',
          sortOrder: 3,
        },
        {
          restaurantId: pizzaPalace!.id,
          name: 'Desserts',
          sortOrder: 4,
        },
      ])
      .returning(),
    db
      .insert(categories)
      .values([
        {
          restaurantId: dragonWok!.id,
          name: 'Wok Classics',
          sortOrder: 1,
        },
        {
          restaurantId: dragonWok!.id,
          name: 'Noodles & Rice',
          sortOrder: 2,
        },
        {
          restaurantId: dragonWok!.id,
          name: 'Dim Sum',
          sortOrder: 3,
        },
        {
          restaurantId: dragonWok!.id,
          name: 'Soups',
          sortOrder: 4,
        },
      ])
      .returning(),
  ]);

  const pizzaSigCat = pizzaCats[0]!;
  const pizzaPastaCat = pizzaCats[1]!;
  const pizzaStarterCat = pizzaCats[2]!;
  const pizzaDessertCat = pizzaCats[3]!;
  const wokClassicCat = wokCats[0]!;
  const noodlesCat = wokCats[1]!;
  const dimSumCat = wokCats[2]!;

  // --- Food Items ---
  const [margherita, pepperoni, quattro, spaghetti, bruschetta, tiramisù] = await db
    .insert(foodItems)
    .values([
      {
        restaurantId: pizzaPalace!.id,
        categoryId: pizzaSigCat.id,
        name: 'Margherita Napoletana',
        description: 'San Marzano tomatoes, fresh mozzarella di bufala, basil, EVOO',
        price: 18.99,
        isAvailable: true,
        isFeatured: true,
        nutritionInfo: { calories: 720, protein: 28, carbs: 82, fat: 24 },
      },
      {
        restaurantId: pizzaPalace!.id,
        categoryId: pizzaSigCat.id,
        name: 'Diavola Pepperoni',
        description: 'Spicy Calabrian pepperoni, smoked provolone, chili flakes',
        price: 22.99,
        isAvailable: true,
        isFeatured: true,
        nutritionInfo: { calories: 890, protein: 35, carbs: 80, fat: 38 },
      },
      {
        restaurantId: pizzaPalace!.id,
        categoryId: pizzaSigCat.id,
        name: 'Quattro Formaggi',
        description: 'Mozzarella, gorgonzola, parmigiano, pecorino, truffle honey drizzle',
        price: 25.99,
        isAvailable: true,
        isFeatured: false,
        nutritionInfo: { calories: 960, protein: 38, carbs: 78, fat: 44 },
      },
      {
        restaurantId: pizzaPalace!.id,
        categoryId: pizzaPastaCat.id,
        name: 'Spaghetti Carbonara',
        description: 'Guanciale, eggs, pecorino romano, black pepper — the real Roman way',
        price: 19.99,
        isAvailable: true,
        isFeatured: false,
        nutritionInfo: { calories: 640, protein: 26, carbs: 72, fat: 26 },
      },
      {
        restaurantId: pizzaPalace!.id,
        categoryId: pizzaStarterCat.id,
        name: 'Bruschetta al Pomodoro',
        description: 'Grilled sourdough, crushed heirloom tomatoes, basil, garlic',
        price: 9.99,
        isAvailable: true,
        isFeatured: false,
        nutritionInfo: { calories: 280, protein: 8, carbs: 42, fat: 8 },
      },
      {
        restaurantId: pizzaPalace!.id,
        categoryId: pizzaDessertCat.id,
        name: 'Tiramisù della Casa',
        description: 'House-made with ladyfingers, mascarpone, espresso, cocoa',
        price: 8.99,
        isAvailable: true,
        isFeatured: false,
        nutritionInfo: { calories: 380, protein: 6, carbs: 42, fat: 18 },
      },
    ])
    .returning();

  // Dragon Wok items
  const [kungPao, dimSumPlatter, padThai, hotAndSour] = await db
    .insert(foodItems)
    .values([
      {
        restaurantId: dragonWok!.id,
        categoryId: wokClassicCat.id,
        name: 'Kung Pao Chicken',
        description:
          'Classic Sichuan-style with peanuts, dried chilies, scallions, and silky sauce',
        price: 16.99,
        isAvailable: true,
        isFeatured: true,
        nutritionInfo: { calories: 520, protein: 34, carbs: 38, fat: 22 },
      },
      {
        restaurantId: dragonWok!.id,
        categoryId: dimSumCat.id,
        name: 'Dim Sum Sampler (6pc)',
        description: 'Chef selection: har gow, siu mai, char siu bao, egg tarts',
        price: 14.99,
        isAvailable: true,
        isFeatured: true,
      },
      {
        restaurantId: dragonWok!.id,
        categoryId: noodlesCat.id,
        name: 'Pad Thai Noodles',
        description: 'Rice noodles, tamarind, bean sprouts, peanuts — shrimp or tofu',
        price: 15.99,
        isAvailable: true,
        isFeatured: false,
        nutritionInfo: { calories: 610, protein: 28, carbs: 72, fat: 18 },
      },
      {
        restaurantId: dragonWok!.id,
        categoryId: wokClassicCat.id,
        name: 'Hot & Sour Soup',
        description: 'Traditional tofu, mushroom, bamboo shoots, silky egg ribbons',
        price: 8.99,
        isAvailable: true,
        isFeatured: false,
        nutritionInfo: { calories: 180, protein: 12, carbs: 22, fat: 6 },
      },
    ])
    .returning();

  // --- Variations for Margherita ---
  console.log('🎛️  Seeding variations...');
  const [sizeVar, crustVar, extraToppings] = await db
    .insert(itemVariations)
    .values([
      {
        foodItemId: margherita!.id,
        title: 'Size',
        type: 'radio',
        isRequired: true,
        minSelect: 1,
        maxSelect: 1,
      },
      {
        foodItemId: margherita!.id,
        title: 'Crust Style',
        type: 'radio',
        isRequired: false,
        minSelect: 0,
        maxSelect: 1,
      },
      {
        foodItemId: margherita!.id,
        title: 'Extra Toppings',
        type: 'checkbox',
        isRequired: false,
        minSelect: 0,
        maxSelect: 5,
      },
    ])
    .returning();

  await db.insert(itemVariationOptions).values([
    // Size options
    { variationId: sizeVar!.id, label: '10" Personal', priceModifier: -4, isDefault: false },
    { variationId: sizeVar!.id, label: '12" Regular', priceModifier: 0, isDefault: true },
    { variationId: sizeVar!.id, label: '14" Large', priceModifier: 5, isDefault: false },
    { variationId: sizeVar!.id, label: '18" Family', priceModifier: 12, isDefault: false },
    // Crust options
    { variationId: crustVar!.id, label: 'Traditional Thin', priceModifier: 0, isDefault: true },
    { variationId: crustVar!.id, label: 'Thick Pan', priceModifier: 2, isDefault: false },
    { variationId: crustVar!.id, label: 'Stuffed Crust', priceModifier: 4, isDefault: false },
    // Toppings
    {
      variationId: extraToppings!.id,
      label: 'Extra Mozzarella',
      priceModifier: 2.5,
      isDefault: false,
    },
    { variationId: extraToppings!.id, label: 'Mushrooms', priceModifier: 1.5, isDefault: false },
    { variationId: extraToppings!.id, label: 'Black Olives', priceModifier: 1.5, isDefault: false },
    {
      variationId: extraToppings!.id,
      label: 'Roasted Garlic',
      priceModifier: 1,
      isDefault: false,
    },
    { variationId: extraToppings!.id, label: 'Jalapeños', priceModifier: 1, isDefault: false },
  ]);

  // Spice level variation for Kung Pao
  const [spiceVar] = await db
    .insert(itemVariations)
    .values([
      {
        foodItemId: kungPao!.id,
        title: 'Spice Level',
        type: 'radio',
        isRequired: true,
        minSelect: 1,
        maxSelect: 1,
      },
    ])
    .returning();

  await db.insert(itemVariationOptions).values([
    { variationId: spiceVar!.id, label: 'Mild', priceModifier: 0, isDefault: true },
    { variationId: spiceVar!.id, label: 'Medium', priceModifier: 0, isDefault: false },
    { variationId: spiceVar!.id, label: 'Hot 🌶️', priceModifier: 0, isDefault: false },
    { variationId: spiceVar!.id, label: 'Dragon Fire 🔥🔥', priceModifier: 0, isDefault: false },
  ]);

  // Protein option for Pad Thai
  const [proteinVar] = await db
    .insert(itemVariations)
    .values([
      {
        foodItemId: padThai!.id,
        title: 'Protein',
        type: 'radio',
        isRequired: true,
        minSelect: 1,
        maxSelect: 1,
      },
    ])
    .returning();

  await db.insert(itemVariationOptions).values([
    { variationId: proteinVar!.id, label: 'Shrimp', priceModifier: 2, isDefault: false },
    { variationId: proteinVar!.id, label: 'Tofu (V)', priceModifier: 0, isDefault: true },
    { variationId: proteinVar!.id, label: 'Chicken', priceModifier: 1, isDefault: false },
    { variationId: proteinVar!.id, label: 'Mixed Seafood', priceModifier: 4, isDefault: false },
  ]);

  // --- Delivery Zones ---
  console.log('🗺️  Seeding delivery zones...');
  await db.insert(zones).values([
    {
      name: 'Downtown Core',
      polygon: {
        type: 'Polygon',
        coordinates: [
          [
            [-122.43, 37.77],
            [-122.38, 37.77],
            [-122.38, 37.81],
            [-122.43, 37.81],
            [-122.43, 37.77],
          ],
        ],
      },
      baseDeliveryFee: 2.99,
      perKmFee: 0.5,
      isActive: true,
    },
    {
      name: 'Mission District',
      polygon: {
        type: 'Polygon',
        coordinates: [
          [
            [-122.44, 37.75],
            [-122.40, 37.75],
            [-122.40, 37.775],
            [-122.44, 37.775],
            [-122.44, 37.75],
          ],
        ],
      },
      baseDeliveryFee: 3.99,
      perKmFee: 0.75,
      isActive: true,
    },
    {
      name: 'Marina & Fishermans Wharf',
      polygon: {
        type: 'Polygon',
        coordinates: [
          [
            [-122.45, 37.8],
            [-122.38, 37.8],
            [-122.38, 37.83],
            [-122.45, 37.83],
            [-122.45, 37.8],
          ],
        ],
      },
      baseDeliveryFee: 4.99,
      perKmFee: 1.0,
      isActive: true,
    },
  ]);

  // --- Coupons ---
  console.log('🎟️  Seeding coupons...');
  const now = new Date();
  const nextYear = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

  await db.insert(coupons).values([
    {
      code: 'WELCOME20',
      type: 'percent',
      value: 20,
      minOrderAmount: 20,
      maxDiscount: 10,
      restaurantId: null, // platform-wide
      usageLimit: 1000,
      usedCount: 47,
      validFrom: now,
      validUntil: nextYear,
      isActive: true,
    },
    {
      code: 'PIZZA5OFF',
      type: 'flat',
      value: 5,
      minOrderAmount: 25,
      restaurantId: pizzaPalace!.id,
      usageLimit: null,
      usedCount: 123,
      validFrom: now,
      validUntil: nextYear,
      isActive: true,
    },
    {
      code: 'FREESHIP',
      type: 'flat',
      value: 0,
      minOrderAmount: 30,
      restaurantId: null,
      usageLimit: 500,
      usedCount: 12,
      validFrom: now,
      validUntil: nextYear,
      isActive: true,
    },
    {
      code: 'DRAGON10',
      type: 'percent',
      value: 10,
      minOrderAmount: 15,
      maxDiscount: 8,
      restaurantId: dragonWok!.id,
      usageLimit: 200,
      usedCount: 34,
      validFrom: now,
      validUntil: nextYear,
      isActive: true,
    },
  ]);

  console.log('');
  console.log('✅ Seed completed! Demo data summary:');
  console.log('  👤  7 users (1 admin, 2 vendors, 2 customers, 2 riders)');
  console.log('  🍕  3 restaurants (Pizza Palace, Dragon Wok, Burger Joint)');
  console.log('  📋  8 menu categories');
  console.log('  🍽️   10 food items with nutrition info');
  console.log('  🎛️   5 variation groups + 19 options');
  console.log('  🗺️   3 delivery zones');
  console.log('  🎟️   4 coupons (WELCOME20, PIZZA5OFF, FREESHIP, DRAGON10)');
  console.log('');
  console.log('🔑 Demo credentials:');
  console.log('  Admin:    admin@foodhub.dev');
  console.log('  Vendor 1: mario@pizzapalace.dev');
  console.log('  Vendor 2: chen@dragonwok.dev');
  console.log('  Customer: customer@example.dev');
  console.log('  Rider:    rider1@foodhub.dev');
  console.log('  (Passwords: set via Better-Auth after first login)');
}

seed().catch((err: unknown) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
