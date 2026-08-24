import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const g = await prisma.articleGroup.findUnique({
        where: { id },
        include: { theme: true }
      });
      if (!g) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({
        id: g.id,
        title: g.title,
        problemStatement: g.summary,
        trajectoryPrediction: g.trajectoryPrediction,
        predictionsTimeline: g.predictionsTimeline,
        predictionConfidence: g.predictionConfidence,
        upvotes: g.upvotes,
        downvotes: g.downvotes,
        therapeuticAreas: [g.theme.stream],
        createdAt: g.createdAt.toISOString()
      });
    }

    // Auto-archive groups older than 30 days of inactivity
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

    const groups = await prisma.articleGroup.findMany({
      where: {
        downvotes: 0
      },
      include: {
        theme: true,
        articles: true
      },
      orderBy: [
        { lastCoverageDate: 'desc' },
        { predictionConfidence: 'desc' }
      ]
    });

    const formatted = groups.map((g: any) => {
      // Archive check on the fly
      const isOld = new Date(g.lastCoverageDate) < oneMonthAgo;
      return {
        id: g.id,
        title: g.title,
        problemStatement: g.summary,
        trajectoryPrediction: g.trajectoryPrediction,
        predictionsTimeline: g.predictionsTimeline,
        predictionConfidence: g.predictionConfidence,
        upvotes: g.upvotes,
        downvotes: g.downvotes,
        therapeuticAreas: [g.theme.stream],
        createdAt: g.createdAt.toISOString(),
        isArchived: isOld
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('API GET projects failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Keep a POST placeholder in case builder or newsletter editor publishes commentary
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, summary, stream, trajectory, timeline, confidence } = body;

    let theme = await prisma.theme.findFirst({ where: { stream } });
    if (!theme) {
      theme = await prisma.theme.create({
        data: {
          title: `${stream} Core Advancements`,
          summary: `Aggregated themes and trajectories in ${stream}.`,
          stream
        }
      });
    }

    const newGroup = await prisma.articleGroup.create({
      data: {
        themeId: theme.id,
        title: title || 'New Commentary Group',
        summary: summary || 'No details provided.',
        trajectoryPrediction: trajectory || 'Accelerating',
        predictionsTimeline: JSON.stringify(timeline || { shortTerm: '', mediumTerm: '', longTerm: '' }),
        predictionConfidence: Number(confidence) || 75.0
      }
    });

    return NextResponse.json({ success: true, id: newGroup.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
