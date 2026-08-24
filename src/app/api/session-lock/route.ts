import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const allConfig = await prisma.systemConfig.findMany();
    const locks: Record<string, boolean> = {};
    for (const item of allConfig) {
      if (item.key.startsWith('session_lock_')) {
        const date = item.key.replace('session_lock_', '');
        locks[date] = item.value === 'true';
      }
    }
    return NextResponse.json(locks);
  } catch (error: any) {
    console.error('GET /api/session-lock failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, locked } = body;

    if (!date) {
      return NextResponse.json({ error: 'Missing date parameter' }, { status: 400 });
    }

    const key = `session_lock_${date}`;
    const value = String(locked);

    await prisma.systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });

    return NextResponse.json({ success: true, date, locked });
  } catch (error: any) {
    console.error('POST /api/session-lock failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
