import { Hono } from 'hono';
import { authMiddleware } from './auth';

export const playerRoutes = new Hono();

playerRoutes.get('/info', authMiddleware, async (c) => {
  const userId = c.get('userId');
  
  const user = await (c as any).env.DB.prepare(
    'SELECT id, username, level, exp, hp, max_hp, attack, defense, gold, rebirth_count, rebirth_bonus, created_at FROM users WHERE id = ?'
  ).bind(userId).first<{ id: number; username: string; level: number; exp: number; hp: number; max_hp: number; attack: number; defense: number; gold: number; rebirth_count: number; rebirth_bonus: number; created_at: string }>();
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  return c.json({ user });
});

playerRoutes.get('/stats', authMiddleware, async (c) => {
  const userId = c.get('userId');
  
  const user = await (c as any).env.DB.prepare(
    'SELECT level, exp, hp, max_hp, attack, defense, gold, rebirth_count, rebirth_bonus FROM users WHERE id = ?'
  ).bind(userId).first<{ level: number; exp: number; hp: number; max_hp: number; attack: number; defense: number; gold: number; rebirth_count: number; rebirth_bonus: number }>();
  
  return c.json({ stats: user });
});