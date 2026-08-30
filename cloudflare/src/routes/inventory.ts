import { Hono } from 'hono';
import { authMiddleware } from './auth';

export const inventoryRoutes = new Hono();

inventoryRoutes.get('/list', authMiddleware, async (c) => {
  const userId = c.get('userId');
  
  const items = await (c as any).env.DB.prepare(
    'SELECT id, item_type, item_id, quantity, metadata, created_at FROM inventory WHERE user_id = ? ORDER BY created_at DESC'
  ).bind(userId).all<{ id: number; item_type: string; item_id: string; quantity: number; metadata: string; created_at: string }>();
  
  return c.json({ items: items.results || [] });
});

inventoryRoutes.post('/use', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const { item_id } = await c.req.json<{ item_id: number }>();
  
  const item = await (c as any).env.DB.prepare(
    'SELECT * FROM inventory WHERE id = ? AND user_id = ?'
  ).bind(item_id, userId).first<{ id: number; item_type: string; item_id: string; quantity: number; metadata: string }>();
  
  if (!item) {
    return c.json({ error: 'Item not found' }, 404);
  }
  
  if (item.item_type === 'potion_hp') {
    const user = await (c as any).env.DB.prepare(
      'SELECT max_hp, hp FROM users WHERE id = ?'
    ).bind(userId).first<{ max_hp: number; hp: number }>();
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    const newHp = Math.min(user.hp + 50, user.max_hp);
    await (c as any).env.DB.prepare(
      'UPDATE users SET hp = ? WHERE id = ?'
    ).bind(newHp, userId).run();
    
    await (c as any).env.DB.prepare(
      'DELETE FROM inventory WHERE id = ?'
    ).bind(item_id).run();
    
    return c.json({ success: true, new_hp: newHp });
  }
  
  return c.json({ error: 'Cannot use this item' }, 400);
});