import { Hono } from 'hono';
import { authMiddleware } from './auth';
import { generateItemName, generateItemStats, randomQuality } from '../lib/item';

export const equipmentRoutes = new Hono();

equipmentRoutes.get('/list', authMiddleware, async (c) => {
  const userId = c.get('userId');
  
  const items = await (c as any).env.DB.prepare(
    'SELECT id, slot, quality, level, stats, name, created_at FROM equipment WHERE user_id = ?'
  ).bind(userId).all<{ id: number; slot: string; quality: string; level: number; stats: string; name: string; created_at: string }>();
  
  return c.json({ equipment: items.results || [] });
});

equipmentRoutes.post('/equip', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const { equipment_id } = await c.req.json<{ equipment_id: number }>();
  
  const item = await (c as any).env.DB.prepare(
    'SELECT * FROM equipment WHERE id = ? AND user_id = ?'
  ).bind(equipment_id, userId).first<{ id: number; slot: string; quality: string; level: number; stats: string; name: string }>();
  
  if (!item) {
    return c.json({ error: 'Equipment not found' }, 404);
  }
  
  const existing = await (c as any).env.DB.prepare(
    'SELECT id FROM equipment WHERE user_id = ? AND slot = ? AND equipped = 1'
  ).bind(userId, item.slot).first<{ id: number }>();
  
  if (existing) {
    await (c as any).env.DB.prepare(
      'UPDATE equipment SET equipped = 0 WHERE id = ?'
    ).bind(existing.id).run();
  }
  
  await (c as any).env.DB.prepare(
    'UPDATE equipment SET equipped = 1 WHERE id = ?'
  ).bind(equipment_id).run();
  
  const stats = JSON.parse(item.stats) as Record<string, number>;
  for (const [stat, value] of Object.entries(stats)) {
    if (stat === 'attack') {
      await (c as any).env.DB.prepare('UPDATE users SET attack = attack + ? WHERE id = ?').bind(value, userId).run();
    } else if (stat === 'defense') {
      await (c as any).env.DB.prepare('UPDATE users SET defense = defense + ? WHERE id = ?').bind(value, userId).run();
    } else if (stat === 'hp' || stat === 'max_hp') {
      await (c as any).env.DB.prepare('UPDATE users SET max_hp = max_hp + ?, hp = hp + ? WHERE id = ?').bind(value, value, userId).run();
    }
  }
  
  return c.json({ success: true, equipped: item });
});

equipmentRoutes.post('/drop', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const { monster_name, map_id } = await c.req.json<{ monster_name: string; map_id: number }>();
  
  const quality = randomQuality();
  const slot = ['weapon', 'armor', 'helmet', 'accessory', 'ring'][Math.floor(Math.random() * 5)];
  const level = Math.floor(Math.random() * 10) + 1;
  const stats = generateItemStats(quality, slot, level);
  const name = generateItemName(quality, slot);
  
  const result = await (c as any).env.DB.prepare(
    'INSERT INTO equipment (user_id, slot, quality, level, stats, name) VALUES (?, ?, ?, ?, ?, ?) RETURNING id'
  ).bind(userId, slot, quality, level, JSON.stringify(stats), name).first<{ id: number }>();
  
  return c.json({ success: true, equipment: { id: result!.id, name, quality, slot, level, stats } });
});