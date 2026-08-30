import { neon } from '@neondatabase/serverless';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

async function runMigrations() {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const sql = neon(DATABASE_URL, {
    arrayMode: false,
    fullResults: false
  });

  const migrationsDir = join(process.cwd(), 'db', 'migrations');
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Running ${files.length} migrations...`);

  for (const file of files) {
    console.log(`Running: ${file}`);
    const migration = readFileSync(join(migrationsDir, file), 'utf-8');
    
    try {
      await sql.unsafe(migration);
      console.log(`  ✓ ${file}`);
    } catch (error) {
      console.error(`  ✗ ${file}:`, error);
      process.exit(1);
    }
  }

  console.log('All migrations completed successfully!');
}

runMigrations().catch(console.error);