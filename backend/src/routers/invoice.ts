import { router, protectedProcedure, adminProcedure } from '../trpc.js';
import { z } from 'zod';
import { db } from '../db.js';
import { invoices } from '../schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const invoiceRouter = router({
  list: protectedProcedure
    .input(z.object({
      companyId: z.number(),
      status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'platform_admin' && ctx.user.companyId !== input.companyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied.' });
      }

      return await db.select().from(invoices).where(
        and(
          eq(invoices.companyId, input.companyId),
          input.status ? eq(invoices.status, input.status) : undefined,
        )
      ).orderBy(desc(invoices.createdAt)).limit(input.limit);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number(), companyId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'platform_admin' && ctx.user.companyId !== input.companyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied.' });
      }

      const [invoice] = await db.select().from(invoices).where(
        and(eq(invoices.id, input.id), eq(invoices.companyId, input.companyId))
      ).limit(1);

      if (!invoice) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invoice not found.' });
      }

      return invoice;
    }),

  create: adminProcedure
    .input(z.object({
      companyId: z.number(),
      branchId: z.number().optional(),
      invoiceNumber: z.string().min(1),
      customerId: z.number().optional(),
      amount: z.string(),
      dueDate: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'platform_admin' && ctx.user.companyId !== input.companyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied.' });
      }

      const { dueDate, ...rest } = input;
      const [invoice] = await db.insert(invoices).values({
        ...rest,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      }).returning();

      return invoice;
    }),

  updateStatus: adminProcedure
    .input(z.object({
      id: z.number(),
      companyId: z.number(),
      status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'platform_admin' && ctx.user.companyId !== input.companyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied.' });
      }

      const [updated] = await db.update(invoices)
        .set({ status: input.status, updatedAt: new Date() })
        .where(and(eq(invoices.id, input.id), eq(invoices.companyId, input.companyId)))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invoice not found.' });
      }

      return updated;
    }),
});
