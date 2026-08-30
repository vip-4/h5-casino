import { Hono } from 'hono';
import { generateToken, hashPassword, verifyPassword } from '../lib/auth';

export const authRoutes = new Hono();

authRoutes.post('/register', async (c) => {
  const { username, password } = await c.req.json<{ username: string; password: string }>();
  
  if (!username || !password) {
    return c.json({ error: 'Username and password required' }, 400);
  }
  
  const existing = await (c as any).env.DB.prepare(
    'SELECT id FROM users WHERE username = ?'
  ).bind(username).first<{ id: number }>();
  
  if (existing) {
    return c.json({ error: 'Username already exists' }, 400);
  }
  
  const passwordHash = await hashPassword(password);
  
  const result = await (c as any).env.DB.prepare(
    'INSERT INTO users (username, password_hash) VALUES (?, ?) RETURNING id, username, level, hp, max_hp, attack, defense, gold, rebirth_count'
  ).bind(username, passwordHash).first<{ id: number; username: string; level: number; hp: number; max_hp: number; attack: number; defense: number; gold: number; rebirth_count: number }>();
  
  const token = generateToken();
  await (c as any).env.DB.prepare(
    'INSERT INTO sessions (token, user_id) VALUES (?, ?)'
  ).bind(token, result!.id).run();
  
  return c.json({ user: result, token });
});

authRoutes.post('/login', async (c) => {
  const { username, password } = await c.req.json<{ username: string; password: string }>();
  
  const user = await (c as any).env.DB.prepare(
    'SELECT id, username, password_hash, level, hp, max_hp, attack, defense, gold, rebirth_count FROM users WHERE username = ?'
  ).bind(username).first<{ id: number; username: string; password_hash: string; level: number; hp: number; max_hp: number; attack: number; defense: number; gold: number; rebirth_count: number }>();
  
  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }
  
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }
  
  const token = generateToken();
  await (c as any).env.DB.prepare(
    'INSERT INTO sessions (token, user_id) VALUES (?, ?)'
  ).bind(token, user.id).run();
  
  const { password_hash, ...safeUser } = user;
  return c.json({ user: safeUser, token });
});

authRoutes.post('/logout', async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  
  if (token) {
    await (c as any).env.DB.prepare(
      'DELETE FROM sessions WHERE token = ?'
    ).bind(token).run();
  }
  
  return c.json({ success: true });
});

export async function authMiddleware(c: any, next: any) {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const session = await (c as any).env.DB.prepare(
    'SELECT user_id FROM sessions WHERE token = ?'
  ).bind(token).first<{ user_id: number }>();
  
  if (!session) {
    return c.json({ error: 'Invalid token' }, 401);
  }
  
  c.set('userId', session.user_id);
  await next();
}