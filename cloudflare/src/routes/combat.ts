import { Hono } from 'hono';
import { authMiddleware } from './auth';

export const combatRoutes = new Hono();

combatRoutes.post('/start', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const { map_id, monster_name } = await c.req.json<{ map_id: number; monster_name: string }>();
  
  const user = await (c as any).env.DB.prepare(
    'SELECT level, hp, max_hp, attack, defense, gold FROM users WHERE id = ?'
  ).bind(userId).first<{ level: number; hp: number; max_hp: number; attack: number; defense: number; gold: number }>();
  
  const playerDamage = Math.floor(user!.attack * (0.8 + Math.random() * 0.4));
  const monsterDamage = Math.floor(10 * (0.8 + Math.random() * 0.4) * (1 + map_id * 0.2));
  
  const playerHp = user!.hp - monsterDamage;
  const monsterHp = 100 * (1 + map_id * 0.5) - playerDamage;
  
  const isWin = playerHp > 0 && monsterHp <= 0;
  
  if (isWin) {
    const goldReward = Math.floor(50 * (1 + map_id * 0.3));
    const expReward = Math.floor(20 * (1 + map_id * 0.2));
    
    await (c as any).env.DB.prepare(
      'UPDATE users SET hp = ?, gold = gold + ?, exp = exp + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(user!.max_hp, goldReward, expReward, userId).run();
    
    await (c as any).env.DB.prepare(
      'INSERT INTO combat_logs (user_id, monster_name, is_win, damage_dealt, damage_taken, reward) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(userId, monster_name, 1, playerDamage, monsterDamage, JSON.stringify({ gold: goldReward, exp: expReward })).run();
    
    return c.json({
      success: true,
      is_win: true,
      damage_dealt: playerDamage,
      damage_taken: monsterDamage,
      reward: { gold: goldReward, exp: expReward }
    });
  } else {
    await (c as any).env.DB.prepare(
      'UPDATE users SET hp = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(userId).run();
    
    await (c as any).env.DB.prepare(
      'INSERT INTO combat_logs (user_id, monster_name, is_win, damage_dealt, damage_taken, reward) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(userId, monster_name, 0, playerDamage, monsterDamage, JSON.stringify({})).run();
    
    return c.json({
      success: true,
      is_win: false,
      damage_dealt: playerDamage,
      damage_taken: monsterDamage,
      reward: null
    });
  }
});

combatRoutes.post('/auto', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const { map_id, count = 10 } = await c.req.json<{ map_id: number; count?: number }>();
  
  let totalGold = 0;
  let totalExp = 0;
  let wins = 0;
  
  for (let i = 0; i < count; i++) {
    const user = await (c as any).env.DB.prepare(
      'SELECT level, hp, max_hp, attack, defense FROM users WHERE id = ?'
    ).bind(userId).first<{ level: number; hp: number; max_hp: number; attack: number; defense: number }>();
    
    if (!user) break;
    
    const playerDamage = Math.floor(user.attack * (0.8 + Math.random() * 0.4));
    const monsterDamage = Math.floor(10 * (0.8 + Math.random() * 0.4) * (1 + map_id * 0.2));
    
    if (user.hp > monsterDamage) {
      const goldReward = Math.floor(50 * (1 + map_id * 0.3));
      const expReward = Math.floor(20 * (1 + map_id * 0.2));
      
      totalGold += goldReward;
      totalExp += expReward;
      wins++;
    }
  }
  
  await (c as any).env.DB.prepare(
    'UPDATE users SET gold = gold + ?, exp = exp + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(totalGold, totalExp, userId).run();
  
  return c.json({
    total_battles: count,
    wins,
    total_gold: totalGold,
    total_exp: totalExp
  });
});