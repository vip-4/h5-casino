export const QUALITIES = {
  common: { name: '普通', color: '#9CA3AF', multiplier: 1.0 },
  rare: { name: '稀有', color: '#3B82F6', multiplier: 1.5 },
  epic: { name: '极品', color: '#A855F7', multiplier: 2.5 },
  legendary: { name: '神品', color: '#F59E0B', multiplier: 5.0 },
  mythic: { name: '超神品', color: '#EF4444', multiplier: 10.0 }
};

export const SLOTS = ['weapon', 'armor', 'helmet', 'accessory', 'ring'];

export function randomQuality(): string {
  const rand = Math.random();
  if (rand < 0.01) return 'mythic';
  if (rand < 0.05) return 'legendary';
  if (rand < 0.15) return 'epic';
  if (rand < 0.40) return 'rare';
  return 'common';
}

export function generateItemName(quality: string, slot: string): string {
  const qualityNames = {
    common: '普通',
    rare: '稀有',
    epic: '极品',
    legendary: '神品',
    mythic: '超神品'
  };
  
  const slotNames = {
    weapon: '剑',
    armor: '甲',
    helmet: '盔',
    accessory: '饰品',
    ring: '戒指'
  };
  
  return `${qualityNames[quality as keyof typeof qualityNames]}${slotNames[slot as keyof typeof slotNames]}`;
}

export function generateItemStats(quality: string, slot: string, level: number): Record<string, number> {
  const baseStats = {
    weapon: { attack: 10 },
    armor: { defense: 8 },
    helmet: { hp: 50 },
    accessory: { crit_rate: 0.05 },
    ring: { hp: 20, attack: 2 }
  };
  
  const qualityMultiplier = QUALITIES[quality as keyof typeof QUALITIES].multiplier;
  const stats: Record<string, number> = {};
  
  const slotStats = baseStats[slot as keyof typeof baseStats];
  for (const [stat, value] of Object.entries(slotStats)) {
    stats[stat] = Math.floor(value * qualityMultiplier * (1 + level * 0.1));
  }
  
  return stats;
}