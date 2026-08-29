import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const leaders = await sql`
      SELECT u.email, u.balance, u.total_wagered, u.total_spins
      FROM users u
      ORDER BY u.balance DESC
      LIMIT ${limit}
    `;

    return NextResponse.json(leaders);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}