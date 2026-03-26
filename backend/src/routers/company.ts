import { router, protectedProcedure, adminProcedure, platformAdminProcedure } from '../trpc.js';
import { z } from 'zod';
import { db } from '../db.js';
import { companies, branches, featureFlags } from '../schema.js';
import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const companyRouter = router({
  list: platformAdminProcedure.query(async () => {
    return await db.select().from(companies).orderBy(companies.createdAt);
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      // Non-platform admins can only view their own company
      if (ctx.user.role !== 'platform_admin' && ctx.user.companyId !== input.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied.' });
      }

      const [company] = await db.select().from(companies).where(eq(companies.id, input.id)).limit(1);

      if (!company) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Company not found.' });
      }

      return company;
    }),

  getMyCompany: protectedProcedure.query(async ({ ctx }) => {
    const [company] = await db.select().from(companies)
      .where(eq(companies.id, ctx.user.companyId))
      .limit(1);

    if (!company) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Company not found.' });
    }

    return company;
  }),

  create: platformAdminProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const [company] = await db.insert(companies).values(input).returning();
      return company;
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Non-platform admins can only update their own company
      if (ctx.user.role !== 'platform_admin' && ctx.user.companyId !== id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied.' });
      }

      const [updated] = await db.update(companies)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(companies.id, id))
        .returning();

      return updated;
    }),

  // Branch management
  listBranches: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'platform_admin' && ctx.user.companyId !== input.companyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied.' });
      }
      return await db.select().from(branches).where(eq(branches.companyId, input.companyId));
    }),

  createBranch: adminProcedure
    .input(z.object({
      companyId: z.number(),
      name: z.string().min(1),
      address: z.string().optional(),
      city: z.string().optional(),
      phone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'platform_admin' && ctx.user.companyId !== input.companyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied.' });
      }
      const [branch] = await db.insert(branches).values(input).returning();
      return branch;
    }),
});
