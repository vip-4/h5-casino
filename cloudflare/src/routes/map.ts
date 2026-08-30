import { Hono } from 'hono';
import { authMiddleware } from './auth';

export const mapRoutes = new Hono();

const MAPS = [
  { id: 1, name: '新手村', min_level: 1, monsters: ['史莱姆', '蝙蝠'], reward_multiplier: 1.0 },
  { id: 2, name: '幽暗森林', min_level: 5, monsters: ['狼人', '树精', '哥布林'], reward_multiplier: 1.5 },
  { id: 3, name: '废弃矿洞', min_level: 10, monsters: ['矿工幽灵', '石像鬼'], reward_multiplier: 2.0 },
  { id: 4, name: '火焰山', min_level: 15, monsters: ['火元素', '炎魔'], reward_multiplier: 2.5 },
  { id: 5, name: '冰封王座', min_level: 20, monsters: ['冰霜巨人', '冰龙'], reward_multiplier: 3.0 }
];

mapRoutes.get('/list', authMiddleware, async (c) => {
  const userId = c.get('userId');
  
  const user = await (c as any).env.DB.prepare(
    'SELECT level FROM users WHERE id = ?'
  ).bind(userId).first<{ level: number }>();
  
  const availableMaps = MAPS.filter(map => map.min_level <= user!.level);
  
  return c.json({ maps: availableMaps });
});

mapRoutes.get('/:id/monsters', authMiddleware, async (c) => {
  const mapId = parseInt(c.req.param('id') || '0');
  const map = MAPS.find(m => m.id === mapId);
  
  if (!map) {
    return c.json({ error: 'Map not found' }, 404);
  }
  
  return c.json({ monsters: map.monsters, reward_multiplier: map.reward_multiplier });
});