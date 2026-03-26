import { describe, it, expect } from 'vitest';
import { initTRPC, TRPCError } from '@trpc/server';

describe('tRPC Configuration', () => {
  describe('Procedure types', () => {
    it('should create a tRPC instance with context', () => {
      const t = initTRPC.context<{ user: null | { id: number; role: string } }>().create();
      expect(t.router).toBeDefined();
      expect(t.procedure).toBeDefined();
    });

    it('should throw UNAUTHORIZED for missing user in protected procedure', async () => {
      const t = initTRPC.context<{ user: null | { id: number; role: string } }>().create();

      const protectedProcedure = t.procedure.use(({ ctx, next }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: 'UNAUTHORIZED' });
        }
        return next();
      });

      const testRouter = t.router({
        test: protectedProcedure.query(() => 'ok'),
      });

      const caller = testRouter.createCaller({ user: null });

      await expect(caller.test()).rejects.toThrow('UNAUTHORIZED');
    });

    it('should allow access with valid user in protected procedure', async () => {
      const t = initTRPC.context<{ user: null | { id: number; role: string } }>().create();

      const protectedProcedure = t.procedure.use(({ ctx, next }) => {
        if (!ctx.user) {
          throw new TRPCError({ code: 'UNAUTHORIZED' });
        }
        return next();
      });

      const testRouter = t.router({
        test: protectedProcedure.query(() => 'ok'),
      });

      const caller = testRouter.createCaller({ user: { id: 1, role: 'employee' } });
      const result = await caller.test();
      expect(result).toBe('ok');
    });

    it('should throw FORBIDDEN for non-admin in admin procedure', async () => {
      const t = initTRPC.context<{ user: null | { id: number; role: string } }>().create();

      const adminProcedure = t.procedure.use(({ ctx, next }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        if (ctx.user.role !== 'company_admin' && ctx.user.role !== 'platform_admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return next();
      });

      const testRouter = t.router({
        adminOnly: adminProcedure.query(() => 'admin data'),
      });

      const caller = testRouter.createCaller({ user: { id: 1, role: 'employee' } });
      await expect(caller.adminOnly()).rejects.toThrow('FORBIDDEN');
    });

    it('should allow company_admin in admin procedure', async () => {
      const t = initTRPC.context<{ user: null | { id: number; role: string } }>().create();

      const adminProcedure = t.procedure.use(({ ctx, next }) => {
        if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
        if (ctx.user.role !== 'company_admin' && ctx.user.role !== 'platform_admin') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return next();
      });

      const testRouter = t.router({
        adminOnly: adminProcedure.query(() => 'admin data'),
      });

      const caller = testRouter.createCaller({ user: { id: 1, role: 'company_admin' } });
      const result = await caller.adminOnly();
      expect(result).toBe('admin data');
    });
  });

  describe('TRPCError codes', () => {
    it('should create UNAUTHORIZED error correctly', () => {
      const error = new TRPCError({ code: 'UNAUTHORIZED', message: 'Not logged in' });
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.message).toBe('Not logged in');
    });

    it('should create FORBIDDEN error correctly', () => {
      const error = new TRPCError({ code: 'FORBIDDEN', message: 'No permission' });
      expect(error.code).toBe('FORBIDDEN');
    });

    it('should create NOT_FOUND error correctly', () => {
      const error = new TRPCError({ code: 'NOT_FOUND', message: 'Resource not found' });
      expect(error.code).toBe('NOT_FOUND');
    });

    it('should create BAD_REQUEST error correctly', () => {
      const error = new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid input' });
      expect(error.code).toBe('BAD_REQUEST');
    });
  });
});
