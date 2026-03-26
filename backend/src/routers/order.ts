import { router, protectedProcedure, adminProcedure } from '../trpc.js';
import { z } from 'zod';
import { db } from '../db.js';
import { orders } from '../schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const orderRouter = router({
  list: protectedProcedure
    .input(z.object({
      companyId: z.number(),
      status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']).optional(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'platform_admin' && ctx.user.companyId !== input.companyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied.' });
      }

      return await db.select().from(orders).where(
        and(
          eq(orders.companyId, input.companyId),
          input.status ? eq(orders.status, input.status) : undefined,
        )
      ).orderBy(desc(orders.createdAt)).limit(input.limit);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number(), companyId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'platform_admin' && ctx.user.companyId !== input.companyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied.' });
      }

      const [order] = await db.select().from(orders).where(
        and(eq(orders.id, input.id), eq(orders.companyId, input.companyId))
      ).limit(1);

      if (!order) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found.' });
      }

      return order;
    }),

  create: protectedProcedure
    .input(z.object({
      companyId: z.number(),
      branchId: z.number().optional(),
      customerId: z.number().optional(),
      orderNumber: z.string().min(1),
      totalAmount: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'platform_admin' && ctx.user.companyId !== input.companyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied.' });
      }

      const [order] = await db.insert(orders).values(input).returning();
      return order;
    }),

  updateStatus: adminProcedure
    .input(z.object({
      id: z.number(),
      companyId: z.number(),
      status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'platform_admin' && ctx.user.companyId !== input.companyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied.' });
      }

      const [updated] = await db.update(orders)
        .set({ status: input.status, updatedAt: new Date() })
        .where(and(eq(orders.id, input.id), eq(orders.companyId, input.companyId)))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Order not found.' });
      }

      return updated;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number(), companyId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'platform_admin' && ctx.user.companyId !== input.companyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied.' });
      }

      await db.delete(orders).where(
        and(eq(orders.id, input.id), eq(orders.companyId, input.companyId))
      );

      return { success: true };
    }),
});
