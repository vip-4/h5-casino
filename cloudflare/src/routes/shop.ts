import { Hono } from 'hono';
import { authMiddleware } from './auth';

export const shopRoutes = new Hono();

const SHOP_ITEMS = [
  { id: 'potion_hp', name: '生命药水', price: 100, effect: { hp: 50 } },
  { id: 'potion_mp', name: '魔法药水', price: 150, effect: { mp: 30 } },
  { id: 'scroll_resurrect', name: '复活卷轴', price: 500, effect: { resurrect: 1 } }
];

shopRoutes.get('/items', authMiddleware, (c) => {
  return c.json({ items: SHOP_ITEMS });
});

shopRoutes.post('/buy', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const { item_id, quantity = 1 } = await c.req.json<{ item_id: string; quantity?: number }>();
  
  const item = SHOP_ITEMS.find(i => i.id === item_id);
  if (!item) {
    return c.json({ error: 'Item not found' }, 404);
  }
  
  const user = await (c as any).env.DB.prepare(
    'SELECT gold FROM users WHERE id = ?'
  ).bind(userId).first<{ gold: number }>();
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  const totalCost = item.price * quantity;
  
  if (user.gold < totalCost) {
    return c.json({ error: 'Insufficient gold' }, 400);
  }
  
  await (c as any).env.DB.prepare(
    'UPDATE users SET gold = gold - ? WHERE id = ?'
  ).bind(totalCost, userId).run();
  
  const existing = await (c as any).env.DB.prepare(
    'SELECT id, quantity FROM inventory WHERE user_id = ? AND item_id = ?'
  ).bind(userId, item_id).first<{ id: number; quantity: number }>();
  
  if (existing) {
    await (c as any).env.DB.prepare(
      'UPDATE inventory SET quantity = quantity + ? WHERE id = ?'
    ).bind(quantity, existing.id).run();
  } else {
    await (c as any).env.DB.prepare(
      'INSERT INTO inventory (user_id, item_type, item_id, quantity, metadata) VALUES (?, ?, ?, ?, ?)'
    ).bind(userId, 'consumable', item_id, quantity, JSON.stringify(item.effect)).run();
  }
  
  return c.json({ success: true, remaining_gold: user.gold - totalCost });
});