import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const target = searchParams.get('target');

    if (!target) {
      return NextResponse.json({ error: 'Missing target parameter' }, { status: 400 });
    }

    if (target === 'logs') {
      await prisma.scanRun.deleteMany({});
      return NextResponse.json({ success: true, message: 'Operations logs purged successfully.' });
    } 
    
    if (target === 'ideas') {
      // Purge raw feed items, project backlog, and duplicate tracking history
      await prisma.$executeRaw`DELETE FROM "ProjectEmbedding"`;
      await prisma.$executeRaw`DELETE FROM "ExpertEmbedding"`;
      await prisma.$executeRaw`DELETE FROM "ArticleGroupEmbedding"`;
      await prisma.$executeRaw`DELETE FROM "ArticleEmbedding"`;
      await prisma.project.deleteMany({});
      await prisma.expert.deleteMany({});
      await prisma.feedItem.deleteMany({});
      await prisma.processedArticle.deleteMany({});
      await prisma.newsletterEdition.deleteMany({});

      // Purge new models (Themes, ArticleGroups, Articles, ExtractedAssets)
      await prisma.extractedAsset.deleteMany({});
      await prisma.article.deleteMany({});
      await prisma.articleGroup.deleteMany({});
      await prisma.theme.deleteMany({});

      // Reset Ingestion Alerts and Scan History to reset analytics and telemetry
      await prisma.ingestionAlert.deleteMany({});
      await prisma.scanRun.deleteMany({});
      
      // Also purge session locks and invitation emails to reset session finalization
      await prisma.systemConfig.deleteMany({
        where: {
          OR: [
            { key: { startsWith: 'session_lock_' } },
            { key: { startsWith: 'session_email_' } }
          ]
        }
      });

      return NextResponse.json({ success: true, message: 'Ingested ideas, themes, signals, scan history, and alerts purged successfully.' });
    } 
    
    if (target === 'sources') {
      await prisma.feedSource.deleteMany({});
      return NextResponse.json({ success: true, message: 'Configured sources purged successfully.' });
    }

    return NextResponse.json({ error: 'Invalid target specified' }, { status: 400 });
  } catch (error: any) {
    console.error(`Purge failed for ${request.url}:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
