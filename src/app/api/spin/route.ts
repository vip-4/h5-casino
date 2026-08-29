import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { processSpin } from '@/lib/game-engine';
import { sql } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [session] = await sql`
      SELECT user_id FROM sessions WHERE token = ${sessionToken} AND expires_at > NOW()
    `;

    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { betAmount, clientSeed, nonce } = await req.json();

    const result = await processSpin(session.user_id, betAmount, clientSeed, nonce);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}