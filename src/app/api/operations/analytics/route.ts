import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const [runs, articles] = await Promise.all([
      prisma.scanRun.findMany({
        orderBy: { startedAt: 'desc' },
        take: 30
      }),
      prisma.article.findMany({
        select: {
          id: true,
          sourceName: true,
          createdAt: true,
          stream: true
        }
      })
    ]);

    return NextResponse.json({
      runs,
      articles
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 555 });
  }
}
