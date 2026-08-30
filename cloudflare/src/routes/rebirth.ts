import { Hono } from 'hono';
import { authMiddleware } from './auth';

export const rebirthRoutes = new Hono();

rebirthRoutes.post('/perform', authMiddleware, async (c) => {
  const userId = c.get('userId');
  
  const user = await (c as any).env.DB.prepare(
    'SELECT level, rebirth_count, rebirth_bonus FROM users WHERE id = ?'
  ).bind(userId).first<{ level: number; rebirth_count: number; rebirth_bonus: number }>();
  
  if (!user || user.level < 50) {
    return c.json({ error: '需要达到50级才能转生' }, 400);
  }
  
  const newRebirthCount = user.rebirth_count + 1;
  const newBonus = user.rebirth_bonus + 0.1;
  
  await (c as any).env.DB.prepare(
    'UPDATE users SET level = 1, exp = 0, rebirth_count = ?, rebirth_bonus = ?, attack = attack + 5, defense = defense + 3, max_hp = max_hp + 20, hp = max_hp + 20 WHERE id = ?'
  ).bind(newRebirthCount, newBonus, userId).run();
  
  return c.json({
    success: true,
    rebirth_count: newRebirthCount,
    rebirth_bonus: newBonus,
    bonuses: {
      attack: 5,
      defense: 3,
      max_hp: 20
    }
  });
});

rebirthRoutes.get('/info', authMiddleware, async (c) => {
  const userId = c.get('userId');
  
  const user = await (c as any).env.DB.prepare(
    'SELECT rebirth_count, rebirth_bonus FROM users WHERE id = ?'
  ).bind(userId).first<{ rebirth_count: number; rebirth_bonus: number }>();
  
  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }
  
  return c.json({
    rebirth_count: user.rebirth_count,
    rebirth_bonus: user.rebirth_bonus,
    next_bonus: user.rebirth_bonus + 0.1
  });
});