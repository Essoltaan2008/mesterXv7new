import { router, protectedProcedure, adminProcedure } from '../trpc.js';
import { z } from 'zod';
import { db } from '../db.js';
import { inventory, products } from '../schema.js';
import { eq, and, lte } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const inventoryRouter = router({
  list: protectedProcedure
    .input(z.object({
      companyId: z.number(),
      branchId: z.number().optional(),
      lowStock: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'platform_admin' && ctx.user.companyId !== input.companyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied.' });
      }

      return await db.select({
        id: inventory.id,
        companyId: inventory.companyId,
        branchId: inventory.branchId,
        productId: inventory.productId,
        quantity: inventory.quantity,
        reorderLevel: inventory.reorderLevel,
        lastRestockDate: inventory.lastRestockDate,
        productName: products.name,
        productSku: products.sku,
        productCategory: products.category,
      })
        .from(inventory)
        .leftJoin(products, eq(inventory.productId, products.id))
        .where(
          and(
            eq(inventory.companyId, input.companyId),
            input.branchId ? eq(inventory.branchId, input.branchId) : undefined,
          )
        );
    }),

  upsert: adminProcedure
    .input(z.object({
      companyId: z.number(),
      branchId: z.number().optional(),
      productId: z.number(),
      quantity: z.number().min(0),
      reorderLevel: z.number().min(0).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'platform_admin' && ctx.user.companyId !== input.companyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied.' });
      }

      const [existing] = await db.select().from(inventory).where(
        and(
          eq(inventory.companyId, input.companyId),
          eq(inventory.productId, input.productId),
          input.branchId ? eq(inventory.branchId, input.branchId) : undefined,
        )
      ).limit(1);

      if (existing) {
        const [updated] = await db.update(inventory)
          .set({
            quantity: input.quantity,
            reorderLevel: input.reorderLevel ?? existing.reorderLevel,
            lastRestockDate: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(inventory.id, existing.id))
          .returning();
        return updated;
      } else {
        const [created] = await db.insert(inventory).values({
          ...input,
          lastRestockDate: new Date(),
        }).returning();
        return created;
      }
    }),

  adjust: adminProcedure
    .input(z.object({
      companyId: z.number(),
      productId: z.number(),
      branchId: z.number().optional(),
      adjustment: z.number(), // positive = add, negative = subtract
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'platform_admin' && ctx.user.companyId !== input.companyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied.' });
      }

      const [existing] = await db.select().from(inventory).where(
        and(
          eq(inventory.companyId, input.companyId),
          eq(inventory.productId, input.productId),
        )
      ).limit(1);

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Inventory record not found.' });
      }

      const newQuantity = existing.quantity + input.adjustment;
      if (newQuantity < 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Insufficient stock.' });
      }

      const [updated] = await db.update(inventory)
        .set({ quantity: newQuantity, updatedAt: new Date() })
        .where(eq(inventory.id, existing.id))
        .returning();

      return updated;
    }),
});
