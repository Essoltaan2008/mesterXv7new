import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { licenseRouter } from './routers/license.js';
import { createContext } from './context.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

app.use(
  '/trpc',
  createExpressMiddleware({
    router: licenseRouter,
    createContext,
    onError({ error, path }) {
      console.error(`License API tRPC error on ${path}:`, error.message);
    },
  })
);

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'mesterx-license-api',
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`MesterX License API running on port ${PORT}`);
});
