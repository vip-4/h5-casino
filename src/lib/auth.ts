import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

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

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}