import { router, protectedProcedure, adminProcedure } from '../trpc.js';
import { z } from 'zod';
import { db } from '../db.js';
import { products } from '../schema.js';
import { eq, and, ilike } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const productRouter = router({
  list: protectedProcedure
    .input(z.object({
      companyId: z.number(),
      category: z.string().optional(),
      search: z.string().optional(),
      status: z.enum(['active', 'inactive']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'platform_admin' && ctx.user.companyId !== input.companyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied.' });
      }

      let query = db.select().from(products).where(eq(products.companyId, input.companyId));

      return await db.select().from(products).where(
        and(
          eq(products.companyId, input.companyId),
          input.status ? eq(products.status, input.status) : undefined,
          input.category ? eq(products.category, input.category) : undefined,
          input.search ? ilike(products.name, `%${input.search}%`) : undefined,
        )
      ).orderBy(products.createdAt);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number(), companyId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'platform_admin' && ctx.user.companyId !== input.companyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied.' });
      }

      const [product] = await db.select().from(products).where(
        and(eq(products.id, input.id), eq(products.companyId, input.companyId))
      ).limit(1);

      if (!product) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found.' });
      }

      return product;
    }),

  create: adminProcedure
    .input(z.object({
      companyId: z.number(),
      branchId: z.number().optional(),
      name: z.string().min(1),
      sku: z.string().min(1),
      description: z.string().optional(),
      price: z.string(),
      cost: z.string().optional(),
      category: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'platform_admin' && ctx.user.companyId !== input.companyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied.' });
      }

      const [product] = await db.insert(products).values(input).returning();
      return product;
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      companyId: z.number(),
      name: z.string().min(1).optional(),
      sku: z.string().optional(),
      description: z.string().optional(),
      price: z.string().optional(),
      cost: z.string().optional(),
      category: z.string().optional(),
      status: z.enum(['active', 'inactive']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'platform_admin' && ctx.user.companyId !== input.companyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied.' });
      }

      const { id, companyId, ...data } = input;
      const [updated] = await db.update(products)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(products.id, id), eq(products.companyId, companyId)))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found.' });
      }

      return updated;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number(), companyId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'platform_admin' && ctx.user.companyId !== input.companyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied.' });
      }

      await db.delete(products).where(
        and(eq(products.id, input.id), eq(products.companyId, input.companyId))
      );

      return { success: true };
    }),
});
