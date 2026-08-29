import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSql } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sql = getSql();
    const sessionResult = await sql`
      SELECT user_id FROM sessions WHERE token = ${sessionToken} AND expires_at > NOW()
    `;
    const session = (sessionResult as any[])[0];

    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const userResult = await sql`
      SELECT balance, total_spins, total_wagered FROM users WHERE id = ${session.user_id}
    `;
    const user = (userResult as any[])[0];

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      balance: user.balance,
      totalSpins: user.total_spins,
      totalWagered: user.total_wagered
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}