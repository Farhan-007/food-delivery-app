import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';
import * as relations from './schema/relations.js';

// ============================================================
// Database Client
// ============================================================

const connectionString = process.env['DATABASE_URL'];
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// For migrations (single connection)
export const migrationClient = postgres(connectionString, { max: 1 });

// For queries (connection pool)
const queryClient = postgres(connectionString, {
  max: 20,
  idle_timeout: 30,
  connect_timeout: 10,
});

export const db = drizzle(queryClient, {
  schema: { ...schema, ...relations },
  logger: process.env['NODE_ENV'] !== 'production',
});

export type Database = typeof db;
export { schema };
