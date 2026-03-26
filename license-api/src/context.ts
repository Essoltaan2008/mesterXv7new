import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import jwt from 'jsonwebtoken';

export interface LicenseJwtPayload {
  companyId: number;
  licenseKey: string;
  tier: string;
}

export async function createContext({ req, res }: CreateExpressContextOptions) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  let payload: LicenseJwtPayload | null = null;

  if (token) {
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET || 'mesterx-license-secret') as LicenseJwtPayload;
    } catch {
      // Invalid token
    }
  }

  return { payload, req, res };
}

export type Context = inferAsyncReturnType<typeof createContext>;
