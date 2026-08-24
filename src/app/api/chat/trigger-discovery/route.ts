import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { stream } = body;

    if (!stream) {
      return NextResponse.json({ error: 'Missing stream parameter' }, { status: 400 });
    }

    // 1. Add the stream dynamically to tech_streams if not present
    const streamsConfig = await prisma.systemConfig.findUnique({ where: { key: 'tech_streams' } });
    let currentStreams = streamsConfig ? streamsConfig.value.split(',').map(s => s.trim()).filter(Boolean) : [];
    if (!currentStreams.some(s => s.toLowerCase() === stream.toLowerCase())) {
      currentStreams.push(stream);
      await prisma.systemConfig.upsert({
        where: { key: 'tech_streams' },
        create: { key: 'tech_streams', value: currentStreams.join(',') },
        update: { value: currentStreams.join(',') }
      });
    }

    // 2. Call local discover-sources API flow directly to find a feed source
    let sourceUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(stream)}`;
    let sourceName = `${stream} News Feed`;

    try {
      // Find fallback or crawlers
      const query = `${stream} blog RSS feed`;
      // Check if we already have a source with this URL
      const existing = await prisma.feedSource.findUnique({ where: { url: sourceUrl } });
      if (!existing) {
        await prisma.feedSource.create({
          data: {
            name: sourceName,
            type: 'RSS Feed',
            url: sourceUrl,
            frequency: 'Daily',
            category: stream,
            enabled: true
          }
        });
      }
    } catch (e: any) {
      console.error('Failed to create feed source in trigger-discovery:', e.message);
    }

    // Get the source details
    const sourceObj = await prisma.feedSource.findUnique({ where: { url: sourceUrl } });
    if (!sourceObj) {
      return NextResponse.json({ error: 'Failed to initialize feed source.' }, { status: 500 });
    }

    // 3. Trigger a background scan for this source ID
    const baseUrl = new URL(request.url).origin;
    const scanTriggerRes = await fetch(`${baseUrl}/api/external-feed/scan?sourceId=${sourceObj.id}`, {
      method: 'POST'
    });

    const scanData = await scanTriggerRes.json();
    if (!scanTriggerRes.ok || !scanData.success) {
      return NextResponse.json({ error: scanData.error || 'Failed to start ingestion scan.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      taskId: scanData.taskId,
      message: `Started discovery and ingestion scan for "${stream}".`,
      sourceName
    });

  } catch (error: any) {
    console.error('trigger-discovery API failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
