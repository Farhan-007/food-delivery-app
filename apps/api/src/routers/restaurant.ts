import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eq, desc, and, ilike, gte, lte, sql, or } from 'drizzle-orm';
import { router, publicProcedure, protectedProcedure, vendorProcedure, adminProcedure } from '../trpc.js';
import { restaurants } from '@repo/db';
import {
  createRestaurantSchema,
  updateRestaurantSchema,
  restaurantSearchSchema,
  approveRestaurantSchema,
} from '@repo/validators/restaurant';

// ============================================================
// Restaurant Router
// ============================================================

export const restaurantRouter = router({
  // Public: search & list restaurants
  search: publicProcedure
    .input(restaurantSearchSchema)
    .query(async ({ ctx, input }) => {
      const { q, minRating, maxDeliveryTime, isOpen, page, pageSize, sortBy, sortOrder } = input;

      const conditions = [
        eq(restaurants.isActive, true),
        eq(restaurants.isApproved, true),
      ];

      if (q) {
        conditions.push(
          or(
            ilike(restaurants.name, `%${q}%`),
            ilike(restaurants.description, `%${q}%`),
          )!,
        );
      }
      if (isOpen !== undefined) conditions.push(eq(restaurants.isOpen, isOpen));
      if (minRating) conditions.push(gte(restaurants.ratingAvg, minRating));
      if (maxDeliveryTime) conditions.push(lte(restaurants.avgDeliveryTime, maxDeliveryTime));

      const offset = (page - 1) * pageSize;

      // Build ORDER BY clause
      const orderMap = {
        rating: restaurants.ratingAvg,
        delivery_time: restaurants.avgDeliveryTime,
        created_at: restaurants.createdAt,
        // distance: handled separately with PostGIS in production
        distance: restaurants.ratingAvg, // fallback
      };

      const [data, countResult] = await Promise.all([
        ctx.db.query.restaurants.findMany({
          where: and(...conditions),
          limit: pageSize,
          offset,
          orderBy: [
            sortOrder === 'asc'
              ? sql`${orderMap[sortBy]} ASC`
              : sql`${orderMap[sortBy]} DESC`,
          ],
          columns: {
            id: true,
            name: true,
            slug: true,
            description: true,
            logoUrl: true,
            coverUrl: true,
            cuisineType: true,
            address: true,
            city: true,
            lat: true,
            lng: true,
            isOpen: true,
            minOrderAmount: true,
            avgDeliveryTime: true,
            deliveryRadiusKm: true,
            ratingAvg: true,
            ratingCount: true,
            openingHours: true,
          },
        }),
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(restaurants)
          .where(and(...conditions)),
      ]);

      const total = countResult[0]?.count ?? 0;

      return {
        data,
        total,
        page,
        pageSize,
        hasNextPage: offset + pageSize < total,
        hasPrevPage: page > 1,
      };
    }),

  // Public: get restaurant by slug
  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const restaurant = await ctx.db.query.restaurants.findFirst({
        where: and(
          eq(restaurants.slug, input.slug),
          eq(restaurants.isActive, true),
          eq(restaurants.isApproved, true),
        ),
        with: {
          categories: {
            where: (c, { eq }) => eq(c.isActive, true),
            orderBy: (c, { asc }) => [asc(c.sortOrder)],
            with: {
              foodItems: {
                where: (fi, { eq }) => eq(fi.isAvailable, true),
                with: {
                  variations: {
                    with: { options: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!restaurant) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Restaurant not found' });
      }

      return restaurant;
    }),

  // Public: get by ID
  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const restaurant = await ctx.db.query.restaurants.findFirst({
        where: eq(restaurants.id, input.id),
      });
      if (!restaurant) throw new TRPCError({ code: 'NOT_FOUND' });
      return restaurant;
    }),

  // Vendor: create restaurant
  create: protectedProcedure
    .input(createRestaurantSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      // Generate slug from name
      const slug = input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const [restaurant] = await ctx.db
        .insert(restaurants)
        .values({
          ...input,
          slug,
          ownerId: ctx.user.id,
          openingHours: input.openingHours,
        })
        .returning();

      return restaurant;
    }),

  // Vendor: update own restaurant
  update: vendorProcedure
    .input(z.object({ id: z.string().uuid() }).merge(updateRestaurantSchema))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
      const { id, ...data } = input;

      const existing = await ctx.db.query.restaurants.findFirst({
        where: eq(restaurants.id, id),
      });

      if (!existing) throw new TRPCError({ code: 'NOT_FOUND' });
      if (existing.ownerId !== ctx.user.id && ctx.user.role === 'vendor') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not your restaurant' });
      }

      const [updated] = await ctx.db
        .update(restaurants)
        .set(data)
        .where(eq(restaurants.id, id))
        .returning();

      return updated;
    }),

  // Vendor: toggle open/closed
  toggleOpen: vendorProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const existing = await ctx.db.query.restaurants.findFirst({
        where: eq(restaurants.id, input.id),
      });

      if (!existing) throw new TRPCError({ code: 'NOT_FOUND' });
      if (existing.ownerId !== ctx.user.id && ctx.user.role === 'vendor') {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const [updated] = await ctx.db
        .update(restaurants)
        .set({ isOpen: !existing.isOpen })
        .where(eq(restaurants.id, input.id))
        .returning({ isOpen: restaurants.isOpen });

      return updated;
    }),

  // Admin: approve/reject restaurant
  approve: adminProcedure
    .input(approveRestaurantSchema)
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(restaurants)
        .set({ isApproved: input.isApproved })
        .where(eq(restaurants.id, input.restaurantId))
        .returning();

      if (!updated) throw new TRPCError({ code: 'NOT_FOUND' });
      return updated;
    }),

  // Admin: list all restaurants
  adminList: adminProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
        isApproved: z.boolean().optional(),
        city: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, isApproved, city } = input;
      const conditions = [];

      if (isApproved !== undefined) conditions.push(eq(restaurants.isApproved, isApproved));
      if (city) conditions.push(ilike(restaurants.city, `%${city}%`));

      const offset = (page - 1) * pageSize;

      const [data, countResult] = await Promise.all([
        ctx.db.query.restaurants.findMany({
          where: conditions.length > 0 ? and(...conditions) : undefined,
          limit: pageSize,
          offset,
          orderBy: [desc(restaurants.createdAt)],
          with: { owner: { columns: { id: true, name: true, email: true } } },
        }),
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(restaurants)
          .where(conditions.length > 0 ? and(...conditions) : undefined),
      ]);

      return {
        data,
        total: countResult[0]?.count ?? 0,
        page,
        pageSize,
        hasNextPage: offset + pageSize < (countResult[0]?.count ?? 0),
        hasPrevPage: page > 1,
      };
    }),
});
