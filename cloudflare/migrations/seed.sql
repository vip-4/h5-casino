INSERT OR IGNORE INTO shop_items (name, item_type, price, effect) VALUES
('生命药水', 'consumable', 100, '{"hp": 50}'),
('魔法药水', 'consumable', 150, '{"mp": 30}'),
('复活卷轴', 'consumable', 500, '{"resurrect": 1}');

INSERT OR IGNORE INTO maps (name, min_level, monsters, reward_multiplier) VALUES
('新手村', 1, '["史莱姆", "蝙蝠"]', 1.0),
('幽暗森林', 5, '["狼人", "树精", "哥布林"]', 1.5),
('废弃矿洞', 10, '["矿工幽灵", "石像鬼"]', 2.0),
('火焰山', 15, '["火元素", "炎魔"]', 2.5),
('冰封王座', 20, '["冰霜巨人", "冰龙"]', 3.0);