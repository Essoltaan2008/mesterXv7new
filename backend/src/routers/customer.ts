import { router, protectedProcedure, adminProcedure } from '../trpc.js';
import { z } from 'zod';
import { db } from '../db.js';
import { customers } from '../schema.js';
import { eq, and, ilike, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const customerRouter = router({
  list: protectedProcedure
    .input(z.object({
      companyId: z.number(),
      status: z.enum(['active', 'inactive']).optional(),
      search: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'platform_admin' && ctx.user.companyId !== input.companyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied.' });
      }

      return await db.select().from(customers).where(
        and(
          eq(customers.companyId, input.companyId),
          input.status ? eq(customers.status, input.status) : undefined,
          input.search ? ilike(customers.name, `%${input.search}%`) : undefined,
        )
      ).orderBy(desc(customers.createdAt)).limit(input.limit);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number(), companyId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'platform_admin' && ctx.user.companyId !== input.companyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied.' });
      }

      const [customer] = await db.select().from(customers).where(
        and(eq(customers.id, input.id), eq(customers.companyId, input.companyId))
      ).limit(1);

      if (!customer) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Customer not found.' });
      }

      return customer;
    }),

  create: protectedProcedure
    .input(z.object({
      companyId: z.number(),
      branchId: z.number().optional(),
      name: z.string().min(1),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'platform_admin' && ctx.user.companyId !== input.companyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied.' });
      }

      const [customer] = await db.insert(customers).values(input).returning();
      return customer;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      companyId: z.number(),
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      status: z.enum(['active', 'inactive']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'platform_admin' && ctx.user.companyId !== input.companyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied.' });
      }

      const { id, companyId, ...data } = input;
      const [updated] = await db.update(customers)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(customers.id, id), eq(customers.companyId, companyId)))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Customer not found.' });
      }

      return updated;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number(), companyId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'platform_admin' && ctx.user.companyId !== input.companyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied.' });
      }

      await db.delete(customers).where(
        and(eq(customers.id, input.id), eq(customers.companyId, input.companyId))
      );

      return { success: true };
    }),
});
