import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Fetch all feed sources
export async function GET() {
  try {
    const sources = await prisma.feedSource.findMany({
      orderBy: { createdAt: 'asc' }
    });
    return NextResponse.json(sources);
  } catch (error: any) {
    console.error('GET /api/external-feed/sources failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Add or find an existing feed source (upsert by URL — prevents duplicates)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, url, frequency, category } = body;

    if (!name || !type || !url || !frequency || !category) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const normalizedUrl = url.trim().replace(/\/+$/, '');

    // Check if URL already exists
    const existing = await prisma.feedSource.findUnique({
      where: { url: normalizedUrl }
    });

    if (existing) {
      // Return existing source with flag so the UI can show "already registered"
      return NextResponse.json({ ...existing, alreadyExists: true });
    }

    const newSource = await prisma.feedSource.create({
      data: {
        name,
        type,
        url: normalizedUrl,
        frequency,
        category,
        enabled: true
      }
    });

    return NextResponse.json(newSource);
  } catch (error: any) {
    console.error('POST /api/external-feed/sources failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Toggle enabled status or update other fields
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, enabled, name, frequency, category } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing required field: id' }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (typeof enabled === 'boolean') updateData.enabled = enabled;
    if (name) updateData.name = name;
    if (frequency) updateData.frequency = frequency;
    if (category) updateData.category = category;

    const updatedSource = await prisma.feedSource.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(updatedSource);
  } catch (error: any) {
    console.error('PUT /api/external-feed/sources failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete a feed source
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing feed source id' }, { status: 400 });
    }

    await prisma.feedSource.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Feed source deleted' });
  } catch (error: any) {
    console.error('DELETE /api/external-feed/sources failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
