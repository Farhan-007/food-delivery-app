import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { migrationClient } from './client.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigrations(): Promise<void> {
  console.log('🗄️  Running database migrations...');

  const db = drizzle(migrationClient);

  await migrate(db, {
    migrationsFolder: path.join(__dirname, 'migrations'),
  });

  console.log('✅ Migrations completed successfully!');
  await migrationClient.end();
  process.exit(0);
}

runMigrations().catch((err: unknown) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
