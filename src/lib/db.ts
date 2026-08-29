import { neon } from '@neondatabase/serverless';

let sql: ReturnType<typeof neon> | null = null;

export function getSql() {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required');
    }
    sql = neon(process.env.DATABASE_URL, {
      arrayMode: false,
      fullResults: false
    });
  }
  return sql;
}