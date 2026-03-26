import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../../../backend/src/routers/index';

export const trpc = createTRPCReact<AppRouter>();

export function getTrpcClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/trpc`,
        headers() {
          const token = localStorage.getItem('mesterx_token');
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    ],
  });
}
