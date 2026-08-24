import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    if (!date) {
      // Return all saved drafts as a key-value record
      const allConfig = await prisma.systemConfig.findMany({
        where: {
          key: { startsWith: 'session_email_' }
        }
      });
      const drafts: Record<string, string> = {};
      for (const item of allConfig) {
        const d = item.key.replace('session_email_', '');
        drafts[d] = item.value;
      }
      return NextResponse.json(drafts);
    }

    const key = `session_email_${date}`;
    const config = await prisma.systemConfig.findUnique({
      where: { key }
    });

    return NextResponse.json({ emailText: config ? config.value : '' });
  } catch (error: any) {
    console.error('GET /api/session-email failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, emailText } = body;

    if (!date) {
      return NextResponse.json({ error: 'Missing date parameter' }, { status: 400 });
    }

    const key = `session_email_${date}`;
    const value = emailText || '';

    await prisma.systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });

    return NextResponse.json({ success: true, date, emailText: value });
  } catch (error: any) {
    console.error('POST /api/session-email failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
