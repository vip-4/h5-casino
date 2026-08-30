import { Hono } from 'hono';
import { authMiddleware } from './auth';

export const enhanceRoutes = new Hono();

enhanceRoutes.post('/start', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const { equipment_id } = await c.req.json<{ equipment_id: number }>();
  
  const item = await (c as any).env.DB.prepare(
    'SELECT * FROM equipment WHERE id = ? AND user_id = ?'
  ).bind(equipment_id, userId).first<{ id: number; slot: string; quality: string; level: number; stats: string; name: string }>();
  
  if (!item) {
    return c.json({ error: 'Equipment not found' }, 404);
  }
  
  const user = await (c as any).env.DB.prepare(
    'SELECT gold FROM users WHERE id = ?'
  ).bind(userId).first<{ gold: number }>();
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  const cost = item.level * 100;
  
  if (user.gold < cost) {
    return c.json({ error: 'Insufficient gold' }, 400);
  }
  
  const successChance = Math.max(0.1, 1 - item.level * 0.1);
  const isSuccess = Math.random() < successChance;
  
  if (isSuccess) {
    const stats = JSON.parse(item.stats) as Record<string, number>;
    for (const [stat, value] of Object.entries(stats)) {
      stats[stat] = Math.floor(value * 1.2);
    }
    
    await (c as any).env.DB.prepare(
      'UPDATE equipment SET level = level + 1, stats = ? WHERE id = ?'
    ).bind(JSON.stringify(stats), equipment_id).run();
    
    await (c as any).env.DB.prepare(
      'UPDATE users SET gold = gold - ? WHERE id = ?'
    ).bind(cost, userId).run();
    
    return c.json({ success: true, new_level: item.level + 1, stats });
  } else {
    await (c as any).env.DB.prepare(
      'UPDATE users SET gold = gold - ? WHERE id = ?'
    ).bind(cost, userId).run();
    
    return c.json({ success: false, message: 'Enhancement failed' });
  }
});