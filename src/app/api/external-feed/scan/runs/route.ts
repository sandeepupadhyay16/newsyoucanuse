import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const runs = await prisma.scanRun.findMany({
      orderBy: {
        startedAt: 'desc'
      },
      take: 50 // Limit to last 50 runs
    });

    return NextResponse.json(runs);
  } catch (error: any) {
    console.error('API GET /api/external-feed/scan/runs failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
