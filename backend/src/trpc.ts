import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './context.js';

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Protected procedure — requires a valid JWT token.
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource.',
    });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

/**
 * Admin procedure — requires company_admin or platform_admin role.
 */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'company_admin' && ctx.user.role !== 'platform_admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to perform this action.',
    });
  }
  return next();
});

/**
 * Platform admin procedure — requires platform_admin role only.
 */
export const platformAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'platform_admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'This action requires platform administrator privileges.',
    });
  }
  return next();
});
