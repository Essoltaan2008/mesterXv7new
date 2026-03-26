import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  id: number;
  email: string;
  role: string;
  companyId: number;
}

export async function createContext({ req, res }: CreateExpressContextOptions) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  let user: JwtPayload | null = null;

  if (token) {
    try {
      user = jwt.verify(token, process.env.JWT_SECRET || 'mesterx-secret-key') as JwtPayload;
    } catch {
      // Invalid or expired token — user stays null
    }
  }

  return { user, req, res };
}

export type Context = inferAsyncReturnType<typeof createContext>;
