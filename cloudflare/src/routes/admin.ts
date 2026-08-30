import { Hono } from 'hono';
import { authMiddleware } from './auth';

export const adminRoutes = new Hono();

adminRoutes.get('/users', authMiddleware, async (c) => {
  const userId = c.get('userId');
  
  const user = await (c as any).env.DB.prepare(
    'SELECT is_admin FROM users WHERE id = ?'
  ).bind(userId).first<{ is_admin: number }>();
  
  if (!user?.is_admin) {
    return c.json({ error: 'Forbidden' }, 403);
  }
  
  const users = await (c as any).env.DB.prepare(
    'SELECT id, username, level, gold, rebirth_count, created_at FROM users ORDER BY created_at DESC LIMIT 100'
  ).bind().all<{ id: number; username: string; level: number; gold: number; rebirth_count: number; created_at: string }>();
  
  return c.json({ users: users.results || [] });
});

adminRoutes.get('/logs', authMiddleware, async (c) => {
  const userId = c.get('userId');
  
  const user = await (c as any).env.DB.prepare(
    'SELECT is_admin FROM users WHERE id = ?'
  ).bind(userId).first<{ is_admin: number }>();
  
  if (!user?.is_admin) {
    return c.json({ error: 'Forbidden' }, 403);
  }
  
  const logs = await (c as any).env.DB.prepare(
    'SELECT cl.*, u.username FROM combat_logs cl JOIN users u ON cl.user_id = u.id ORDER BY cl.created_at DESC LIMIT 100'
  ).bind().all<{ id: number; user_id: number; monster_name: string; is_win: number; damage_dealt: number; damage_taken: number; reward: string; created_at: string; username: string }>();
  
  return c.json({ logs: logs.results || [] });
});

adminRoutes.post('/maps', authMiddleware, async (c) => {
  const userId = c.get('userId');
  
  const user = await (c as any).env.DB.prepare(
    'SELECT is_admin FROM users WHERE id = ?'
  ).bind(userId).first<{ is_admin: number }>();
  
  if (!user?.is_admin) {
    return c.json({ error: 'Forbidden' }, 403);
  }
  
  const { name, min_level, monsters, reward_multiplier } = await c.req.json<{ name: string; min_level: number; monsters: string[]; reward_multiplier: number }>();
  
  const result = await (c as any).env.DB.prepare(
    'INSERT INTO maps (name, min_level, monsters, reward_multiplier) VALUES (?, ?, ?, ?) RETURNING id'
  ).bind(name, min_level, JSON.stringify(monsters), reward_multiplier).first<{ id: number }>();
  
  return c.json({ success: true, map: result });
});

adminRoutes.post('/items', authMiddleware, async (c) => {
  const userId = c.get('userId');
  
  const user = await (c as any).env.DB.prepare(
    'SELECT is_admin FROM users WHERE id = ?'
  ).bind(userId).first<{ is_admin: number }>();
  
  if (!user?.is_admin) {
    return c.json({ error: 'Forbidden' }, 403);
  }
  
  const { name, item_type, price, effect } = await c.req.json<{ name: string; item_type: string; price: number; effect: Record<string, any> }>();
  
  const result = await (c as any).env.DB.prepare(
    'INSERT INTO shop_items (name, item_type, price, effect) VALUES (?, ?, ?, ?) RETURNING id'
  ).bind(name, item_type, price, JSON.stringify(effect)).first<{ id: number }>();
  
  return c.json({ success: true, item: result });
});