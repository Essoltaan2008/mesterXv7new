import { router, protectedProcedure, adminProcedure } from '../trpc.js';
import { z } from 'zod';
import { db } from '../db.js';
import { employees } from '../schema.js';
import { eq, and, ilike } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const employeeRouter = router({
  list: protectedProcedure
    .input(z.object({
      companyId: z.number(),
      department: z.string().optional(),
      status: z.enum(['active', 'inactive', 'on_leave']).optional(),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'platform_admin' && ctx.user.companyId !== input.companyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied.' });
      }

      return await db.select().from(employees).where(
        and(
          eq(employees.companyId, input.companyId),
          input.status ? eq(employees.status, input.status) : undefined,
          input.department ? eq(employees.department, input.department) : undefined,
          input.search
            ? ilike(employees.firstName, `%${input.search}%`)
            : undefined,
        )
      ).orderBy(employees.createdAt);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.number(), companyId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'platform_admin' && ctx.user.companyId !== input.companyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied.' });
      }

      const [employee] = await db.select().from(employees).where(
        and(eq(employees.id, input.id), eq(employees.companyId, input.companyId))
      ).limit(1);

      if (!employee) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Employee not found.' });
      }

      return employee;
    }),

  create: adminProcedure
    .input(z.object({
      companyId: z.number(),
      branchId: z.number().optional(),
      userId: z.number().optional(),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional(),
      position: z.string().optional(),
      department: z.string().optional(),
      salary: z.string().optional(),
      hireDate: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'platform_admin' && ctx.user.companyId !== input.companyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied.' });
      }

      const { hireDate, ...rest } = input;
      const [employee] = await db.insert(employees).values({
        ...rest,
        hireDate: hireDate ? new Date(hireDate) : undefined,
      }).returning();

      return employee;
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      companyId: z.number(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      position: z.string().optional(),
      department: z.string().optional(),
      salary: z.string().optional(),
      status: z.enum(['active', 'inactive', 'on_leave']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'platform_admin' && ctx.user.companyId !== input.companyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied.' });
      }

      const { id, companyId, ...data } = input;
      const [updated] = await db.update(employees)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(employees.id, id), eq(employees.companyId, companyId)))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Employee not found.' });
      }

      return updated;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number(), companyId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'platform_admin' && ctx.user.companyId !== input.companyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied.' });
      }

      await db.delete(employees).where(
        and(eq(employees.id, input.id), eq(employees.companyId, input.companyId))
      );

      return { success: true };
    }),
});
