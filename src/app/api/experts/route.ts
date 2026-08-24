import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { embedText } from '@/lib/llm';

export async function GET() {
  try {
    const experts = await prisma.expert.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(experts);
  } catch (error: any) {
    console.error('API GET experts failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = body.query || '';

    if (!query.trim()) {
      return NextResponse.json({ error: 'Query is empty' }, { status: 400 });
    }

    const embedding = await embedText(query);
    const embeddingStr = `[${embedding.join(',')}]`;

    // Query similar experts using pgvector cosine distance
    const matchedExperts = await prisma.$queryRawUnsafe(`
      SELECT e.id, e.name, e.title, e.organization, e.availability, e.competencies, e.email, e.teamsId,
             1 - (ee.embedding <=> $1::vector) as similarity
      FROM "Expert" e
      JOIN "ExpertEmbedding" ee ON ee."expertId" = e.id
      ORDER BY similarity DESC
      LIMIT 10
    `, embeddingStr) as any[];

    const formatted = matchedExperts.map(e => ({
      id: e.id,
      name: e.name,
      title: e.title,
      organization: e.organization,
      availability: e.availability,
      competencies: Array.isArray(e.competencies) ? e.competencies : [],
      email: e.email,
      teamsId: e.teamsId,
      similarity: Number(e.similarity)
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('API POST experts search failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, title, organization, availability, email, teamsId, competencies } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'Missing expert ID or name' }, { status: 400 });
    }

    const updated = await prisma.expert.update({
      where: { id },
      data: {
        name,
        title: title || '',
        organization: organization || '',
        availability: availability || 'Available',
        email: email || null,
        teamsId: teamsId || null,
        competencies: Array.isArray(competencies) ? competencies : []
      }
    });

    // Re-generate embedding for semantic search mapping
    try {
      const competenciesStr = Array.isArray(competencies) ? competencies.join(' ') : '';
      const embedTextStr = `${updated.name} ${updated.title} ${updated.organization} ${updated.availability} ${competenciesStr}`;
      const embedding = await embedText(embedTextStr);
      const embeddingStr = `[${embedding.join(',')}]`;

      await prisma.$executeRaw`
        INSERT INTO "ExpertEmbedding" ("id", "expertId", "embedding", "createdAt")
        VALUES (gen_random_uuid(), ${updated.id}, ${embeddingStr}::vector, NOW())
        ON CONFLICT ("expertId") DO UPDATE
        SET "embedding" = ${embeddingStr}::vector, "createdAt" = NOW()
      `;
    } catch (embedError) {
      console.error('Failed to update expert embedding during edit:', embedError);
      // Don't fail the request if embedding fails
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('API PUT expert update failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
