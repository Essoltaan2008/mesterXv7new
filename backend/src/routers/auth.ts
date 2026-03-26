import { router, publicProcedure, protectedProcedure } from '../trpc.js';
import { z } from 'zod';
import { db } from '../db.js';
import { users, companies } from '../schema.js';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { TRPCError } from '@trpc/server';

const JWT_SECRET = process.env.JWT_SECRET || 'mesterx-secret-key';
const JWT_EXPIRES_IN = '7d';

export const authRouter = router({
  register: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8, 'Password must be at least 8 characters'),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      companyName: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      // Create company first
      const [company] = await db.insert(companies).values({
        name: input.companyName,
        email: input.email,
      }).returning();

      const hashedPassword = await bcrypt.hash(input.password, 12);

      const [user] = await db.insert(users).values({
        email: input.email,
        password: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        companyId: company.id,
        role: 'company_admin',
      }).returning();

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, companyId: user.companyId },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          companyId: user.companyId,
        },
      };
    }),

  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ input }) => {
      const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invalid email or password.' });
      }

      if (user.status === 'inactive') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Account is inactive. Contact your administrator.' });
      }

      const isValid = await bcrypt.compare(input.password, user.password);
      if (!isValid) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid email or password.' });
      }

      // Update last login
      await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, user.id));

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, companyId: user.companyId },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          companyId: user.companyId,
        },
      };
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      companyId: users.companyId,
      branchId: users.branchId,
      status: users.status,
      lastLogin: users.lastLogin,
    }).from(users).where(eq(users.id, ctx.user.id)).limit(1);

    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found.' });
    }

    return user;
  }),

  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(8),
    }))
    .mutation(async ({ ctx, input }) => {
      const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found.' });
      }

      const isValid = await bcrypt.compare(input.currentPassword, user.password);
      if (!isValid) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Current password is incorrect.' });
      }

      const hashedPassword = await bcrypt.hash(input.newPassword, 12);
      await db.update(users).set({ password: hashedPassword }).where(eq(users.id, user.id));

      return { success: true };
    }),
});
