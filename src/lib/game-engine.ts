import { sql } from '@/lib/db';
import { generateSpin } from '@/lib/rng';

export async function processSpin(userId: string, betAmount: number, clientSeed: string, nonce: number) {
  const MIN_BET = parseInt(process.env.MIN_BET || '10');
  const MAX_BET = parseInt(process.env.MAX_BET || '1000');

  if (betAmount < MIN_BET || betAmount > MAX_BET) {
    throw new Error(`Bet must be between ${MIN_BET} and ${MAX_BET}`);
  }

  const [user] = await sql`
    SELECT balance FROM users WHERE id = ${userId}
  `;

  if (!user || user.balance < betAmount) {
    throw new Error('Insufficient balance');
  }

  const serverSeed = process.env.GAME_SERVER_SEED || 'default-secret-key';
  const result = generateSpin(serverSeed, clientSeed, nonce);

  const updated = await sql`
    UPDATE users 
    SET balance = balance - ${betAmount} + ${result.payout},
        total_spins = total_spins + 1,
        total_wagered = total_wagered + ${betAmount}
    WHERE id = ${userId} AND balance >= ${betAmount}
    RETURNING *
  `;

  if (!updated[0]) {
    throw new Error('Transaction failed');
  }

  await sql`
    INSERT INTO game_logs (user_id, bet, result, payout, is_win)
    VALUES (${userId}, ${betAmount}, ${JSON.stringify(result)}, ${result.payout}, ${result.isWin})
  `;

  return {
    success: true,
    reels: result.reels,
    payout: result.payout,
    newBalance: updated[0].balance,
    isWin: result.isWin
  };
}