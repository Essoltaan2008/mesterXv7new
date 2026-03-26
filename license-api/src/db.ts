import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'mesterx',
  password: process.env.DB_PASSWORD || 'mesterxpass123',
  database: process.env.DB_NAME || 'mesterxdb',
  max: 10,
});

export const db = drizzle(pool, { schema });
