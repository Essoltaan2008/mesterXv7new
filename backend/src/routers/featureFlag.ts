import { router, protectedProcedure, adminProcedure } from '../trpc.js';
import { z } from 'zod';
import { db } from '../db.js';
import { featureFlags } from '../schema.js';
import { eq, and } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

const moduleSchema = z.enum(['pos', 'commerce', 'inventory', 'hr', 'finance', 'crm', 'delivery', 'analytics']);

export const featureFlagRouter = router({
  list: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'platform_admin' && ctx.user.companyId !== input.companyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied.' });
      }

      return await db.select().from(featureFlags).where(eq(featureFlags.companyId, input.companyId));
    }),

  toggle: adminProcedure
    .input(z.object({
      companyId: z.number(),
      module: moduleSchema,
      isEnabled: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'platform_admin' && ctx.user.companyId !== input.companyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied.' });
      }

      const [existing] = await db.select().from(featureFlags).where(
        and(
          eq(featureFlags.companyId, input.companyId),
          eq(featureFlags.module, input.module)
        )
      ).limit(1);

      if (existing) {
        const [updated] = await db.update(featureFlags)
          .set({ isEnabled: input.isEnabled, updatedAt: new Date() })
          .where(and(
            eq(featureFlags.companyId, input.companyId),
            eq(featureFlags.module, input.module)
          ))
          .returning();
        return updated;
      } else {
        const [created] = await db.insert(featureFlags).values({
          companyId: input.companyId,
          module: input.module,
          isEnabled: input.isEnabled,
        }).returning();
        return created;
      }
    }),

  isEnabled: protectedProcedure
    .input(z.object({
      companyId: z.number(),
      module: moduleSchema,
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'platform_admin' && ctx.user.companyId !== input.companyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied.' });
      }

      const [flag] = await db.select().from(featureFlags).where(
        and(
          eq(featureFlags.companyId, input.companyId),
          eq(featureFlags.module, input.module)
        )
      ).limit(1);

      return { isEnabled: flag?.isEnabled ?? false };
    }),
});
