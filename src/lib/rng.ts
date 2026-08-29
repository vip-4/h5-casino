import { createHmac } from 'crypto';

const REELS = ['🍒', '🍋', '🍇', '💎', '7️⃣'];
const PAYOUTS: Record<string, number> = {
  '🍒🍒🍒': 5,
  '🍋🍋🍋': 10,
  '🍇🍇🍇': 20,
  '💎💎💎': 50,
  '7️⃣7️⃣7️⃣': 100
};

export function generateSpin(serverSeed: string, clientSeed: string, nonce: number) {
  const hmac = createHmac('sha256', serverSeed);
  hmac.update(`${clientSeed}:${nonce}`);
  const digest = hmac.digest('hex');

  const reels = [];
  for (let i = 0; i < 3; i++) {
    const index = parseInt(digest.slice(i * 2, i * 2 + 2), 16) % REELS.length;
    reels.push(REELS[index]);
  }

  const key = reels.join('');
  const payout = PAYOUTS[key] || 0;

  return {
    reels,
    payout,
    hash: digest,
    isWin: payout > 0
  };
}

export function calculatePayout(reels: string[], betAmount: number): number {
  const key = reels.join('');
  const multiplier = PAYOUTS[key] || 0;
  return betAmount * multiplier;
}