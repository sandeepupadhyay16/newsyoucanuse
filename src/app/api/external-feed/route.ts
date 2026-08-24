import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dismissed = searchParams.get('dismissed') === 'true';

    // Fetch themes including their article groups and raw articles
    const themes = await prisma.theme.findMany({
      include: {
        groups: {
          where: {
            downvotes: dismissed ? { gt: 0 } : 0
          },
          include: {
            articles: {
              include: {
                assets: true,
                authorExpert: true
              }
            }
          },
          orderBy: [
            { lastCoverageDate: 'desc' },
            { predictionConfidence: 'desc' }
          ]
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get last scan time across all sources
    const sources = await prisma.feedSource.findMany({
      where: { enabled: true },
      select: { lastScannedAt: true }
    });
    const lastScannedAt = sources
      .map((s: any) => s.lastScannedAt)
      .filter(Boolean)
      .sort((a: any, b: any) => b - a)[0] ?? null;

    // Compute next scheduled refresh
    const now = new Date();
    const nextRefresh = new Date();
    nextRefresh.setUTCHours(14, 0, 0, 0);
    if (nextRefresh <= now) nextRefresh.setUTCDate(nextRefresh.getUTCDate() + 1);

    // Format for the newsletter page. The top-level cards represent Themes.
    const formatted = themes.map((theme: any) => {
      // Find all functional tags across child groups
      const allFunctional = Array.from(
        new Set(theme.groups.flatMap((g: any) => g.articles.flatMap((a: any) => a.url ? [g.title] : [])))
      ) as string[];

      // Count unique sources
      const allSources = Array.from(new Set(theme.groups.flatMap((g: any) => g.articles.map((a: any) => a.sourceName)))) as string[];

      // Last coverage date across underlying article groups
      const lastCoverage = theme.groups.reduce((max: Date, g: any) => {
        const d = new Date(g.lastCoverageDate);
        return d > max ? d : max;
      }, new Date(theme.createdAt));

      return {
        id: theme.id,
        title: theme.title,
        summary: theme.summary,
        stream: theme.stream,
        createdAt: theme.createdAt.toISOString(),
        lastCoverageDate: lastCoverage.toISOString(),
        functionalDomains: allFunctional,
        sourceCount: allSources.length,
        sourceNames: allSources,
        groups: theme.groups.map((g: any) => {
          // Check if covered by multiple sources
          const groupSources = Array.from(new Set(g.articles.map((a: any) => a.sourceName))) as string[];
          return {
            id: g.id,
            title: g.title,
            summary: g.summary,
            lastCoverageDate: g.lastCoverageDate.toISOString(),
            trajectoryPrediction: g.trajectoryPrediction,
            predictionsTimeline: g.predictionsTimeline,
            predictionConfidence: g.predictionConfidence,
            upvotes: g.upvotes,
            downvotes: g.downvotes,
            sourceCount: groupSources.length,
            sourceNames: groupSources,
            articles: g.articles.map((a: any) => ({
              id: a.id,
              title: a.title,
              content: a.content,
              url: a.url,
              sourceName: a.sourceName,
              publishDate: a.publishDate?.toISOString() || null,
              author: a.author,
              authorExpert: a.authorExpert ? {
                id: a.authorExpert.id,
                name: a.authorExpert.name,
                title: a.authorExpert.title,
                organization: a.authorExpert.organization,
                bio: a.authorExpert.bio,
                avatarUrl: a.authorExpert.avatarUrl
              } : null,
              assets: a.assets.map((asset: any) => ({
                id: asset.id,
                type: asset.type,
                url: asset.url,
                title: asset.title
              }))
            }))
          };
        })
      };
    }).filter(t => t.groups.length > 0); // only show themes with active groups

    return NextResponse.json({
      items: formatted,
      lastScannedAt: lastScannedAt?.toISOString() ?? null,
      nextRefreshAt: nextRefresh.toISOString()
    });
  } catch (error: any) {
    console.error('API GET external-feed failed:', error);
    return NextResponse.json({ error: error.message }, { status: 555 });
  }
}

// Handle voting (upvote / downvote / restore) on ArticleGroup
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { feedItemId, voteType, reason } = body; // feedItemId represents Group ID here

    if (!feedItemId || !voteType) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    if (voteType === 'upvote') {
      const updated = await prisma.articleGroup.update({
        where: { id: feedItemId },
        data: {
          upvotes: { increment: 1 }
        }
      });
      return NextResponse.json({ success: true, item: updated });
    } else if (voteType === 'downvote') {
      const updated = await prisma.articleGroup.update({
        where: { id: feedItemId },
        data: {
          downvotes: { increment: 1 }
        }
      });
      return NextResponse.json({ success: true, item: updated });
    } else if (voteType === 'restore') {
      const updated = await prisma.articleGroup.update({
        where: { id: feedItemId },
        data: {
          downvotes: 0
        }
      });
      return NextResponse.json({ success: true, item: updated });
    } else {
      return NextResponse.json({ error: 'Invalid voteType' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('API POST external-feed failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete an ArticleGroup
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing group id' }, { status: 400 });
    }

    const deleted = await prisma.articleGroup.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, deleted });
  } catch (error: any) {
    console.error('API DELETE external-feed failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
