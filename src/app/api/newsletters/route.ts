import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const editions = await prisma.newsletterEdition.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(editions);
  } catch (error: any) {
    console.error('API GET newsletters failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, projectIds, editorial } = body;

    if (!title || !Array.isArray(projectIds) || projectIds.length === 0) {
      return NextResponse.json({ error: 'Missing title or projectIds' }, { status: 400 });
    }

    const newEdition = await prisma.newsletterEdition.create({
      data: {
        title,
        projectIds,
        editorial: editorial || ''
      }
    });

    return NextResponse.json({ success: true, edition: newEdition });
  } catch (error: any) {
    console.error('API POST newsletters failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
