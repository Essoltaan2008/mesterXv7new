import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './context.js';

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const authenticatedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.payload) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Valid license token required.' });
  }
  return next({ ctx: { ...ctx, payload: ctx.payload } });
});
