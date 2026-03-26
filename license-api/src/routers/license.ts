import { router, publicProcedure, authenticatedProcedure } from '../trpc.js';
import { z } from 'zod';
import { db } from '../db.js';
import { licenses, licenseAuditLog } from '../schema.js';
import { eq, and } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'mesterx-license-secret';

export const licenseRouter = router({
  /**
   * Validate a license key and return a signed license token.
   */
  validate: publicProcedure
    .input(z.object({
      licenseKey: z.string().min(1),
      companyId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const [license] = await db.select().from(licenses).where(
        and(
          eq(licenses.licenseKey, input.licenseKey),
          eq(licenses.companyId, input.companyId)
        )
      ).limit(1);

      if (!license) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'License key not found.' });
      }

      if (license.status === 'expired') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'License has expired.' });
      }

      if (license.status === 'suspended') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'License is suspended.' });
      }

      if (license.expiresAt && new Date() > license.expiresAt) {
        // Auto-expire
        await db.update(licenses).set({ status: 'expired' }).where(eq(licenses.id, license.id));
        throw new TRPCError({ code: 'FORBIDDEN', message: 'License has expired.' });
      }

      // Log validation
      await db.insert(licenseAuditLog).values({
        licenseId: license.id,
        companyId: license.companyId,
        action: 'validate',
        details: `License validated for tier: ${license.tier}`,
        ipAddress: ctx.req.ip,
      });

      const token = jwt.sign(
        { companyId: license.companyId, licenseKey: license.licenseKey, tier: license.tier },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return {
        valid: true,
        tier: license.tier,
        status: license.status,
        maxUsers: license.maxUsers,
        maxBranches: license.maxBranches,
        expiresAt: license.expiresAt,
        token,
      };
    }),

  /**
   * Issue a new license for a company (internal/admin use).
   */
  issue: publicProcedure
    .input(z.object({
      companyId: z.number(),
      tier: z.enum(['starter', 'professional', 'enterprise', 'unlimited']).default('starter'),
      maxUsers: z.number().default(5),
      maxBranches: z.number().default(1),
      expiresAt: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const licenseKey = `MX-${uuidv4().toUpperCase().replace(/-/g, '').slice(0, 16)}`;

      const [license] = await db.insert(licenses).values({
        companyId: input.companyId,
        licenseKey,
        tier: input.tier,
        status: 'active',
        maxUsers: input.maxUsers,
        maxBranches: input.maxBranches,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
        activatedAt: new Date(),
        notes: input.notes,
      }).returning();

      return {
        licenseKey: license.licenseKey,
        tier: license.tier,
        status: license.status,
        expiresAt: license.expiresAt,
      };
    }),

  /**
   * Get license info for a company.
   */
  getByCompany: publicProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      const [license] = await db.select({
        id: licenses.id,
        tier: licenses.tier,
        status: licenses.status,
        maxUsers: licenses.maxUsers,
        maxBranches: licenses.maxBranches,
        issuedAt: licenses.issuedAt,
        expiresAt: licenses.expiresAt,
        activatedAt: licenses.activatedAt,
      }).from(licenses).where(
        and(
          eq(licenses.companyId, input.companyId),
          eq(licenses.status, 'active')
        )
      ).limit(1);

      return license ?? null;
    }),

  /**
   * Get audit log for a license.
   */
  auditLog: authenticatedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }))
    .query(async ({ ctx, input }) => {
      return await db.select().from(licenseAuditLog)
        .where(eq(licenseAuditLog.companyId, ctx.payload.companyId))
        .limit(input.limit);
    }),
});
