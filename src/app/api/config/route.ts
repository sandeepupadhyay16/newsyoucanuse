import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_STREAMS = [
  'Frontier Model Capabilities',
  'Model-on-Chip Advancements',
  'Agentic Architectures',
  'Ways of Working',
  'Development Frameworks'
];

export async function GET() {
  try {
    const hasGoogleCreds = !!process.env.GOOGLE_CLIENT_ID;
    const hasAppleCreds = !!process.env.APPLE_CLIENT_ID;

    // 1. Fetch weights
    const weightsConfig = await prisma.systemConfig.findUnique({
      where: { key: 'weights' }
    });
    const weights = weightsConfig
      ? weightsConfig.value.split(',').map(Number)
      : [0.40, 0.30, 0.30];

    // 2. Fetch tech streams
    let streamsConfig = await prisma.systemConfig.findUnique({
      where: { key: 'tech_streams' }
    });
    
    if (!streamsConfig) {
      streamsConfig = await prisma.systemConfig.create({
        data: {
          key: 'tech_streams',
          value: DEFAULT_STREAMS.join(',')
        }
      });
    }

    const techStreams = streamsConfig.value.split(',').map(s => s.trim()).filter(Boolean);

    // 3. Fetch discovery queries JSON
    const queriesConfig = await prisma.systemConfig.findUnique({
      where: { key: 'discovery_queries_json' }
    });
    let discoveryQueries: Record<string, string> = {};
    if (queriesConfig) {
      try {
        discoveryQueries = JSON.parse(queriesConfig.value);
      } catch {}
    }

    return NextResponse.json({
      weights,
      techStreams,
      discoveryQueries,
      hasGoogleCreds,
      hasAppleCreds
    });
  } catch (error: any) {
    console.error('API GET config failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { weights, techStreams, discoveryQueries, role } = body;

    // Check authorization (only Admin can configure system settings)
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Only the Admin can configure system settings.' }, { status: 403 });
    }

    let responsePayload: any = { success: true };

    // 1. Handle weights update
    if (weights) {
      if (!Array.isArray(weights) || weights.length !== 3) {
        return NextResponse.json({ error: 'Invalid weights. Must be an array of 3 numbers.' }, { status: 400 });
      }

      const sum = weights.reduce((a, b) => a + b, 0);
      if (Math.abs(sum - 1.0) > 0.02) {
        return NextResponse.json({ error: 'Weights must sum to 100% (1.0). Current sum: ' + (sum * 100).toFixed(0) + '%' }, { status: 400 });
      }

      const value = weights.join(',');
      const updatedConfig = await prisma.systemConfig.upsert({
        where: { key: 'weights' },
        update: { value },
        create: { key: 'weights', value }
      });
      
      responsePayload.weights = updatedConfig.value.split(',').map(Number);
    }

    // 2. Handle tech streams update
    if (techStreams) {
      if (!Array.isArray(techStreams) || techStreams.length === 0) {
        return NextResponse.json({ error: 'Invalid tech streams. Must be a non-empty array of strings.' }, { status: 400 });
      }

      const cleanedStreams = techStreams.map((s: string) => s.trim()).filter(Boolean);
      if (cleanedStreams.length === 0) {
        return NextResponse.json({ error: 'Tech streams cannot be empty.' }, { status: 400 });
      }

      const value = cleanedStreams.join(',');
      const updatedConfig = await prisma.systemConfig.upsert({
        where: { key: 'tech_streams' },
        update: { value },
        create: { key: 'tech_streams', value }
      });

      responsePayload.techStreams = updatedConfig.value.split(',').map((s: string) => s.trim());
    }

    // 3. Handle discovery queries JSON update
    if (discoveryQueries) {
      if (typeof discoveryQueries !== 'object') {
        return NextResponse.json({ error: 'Invalid discovery queries. Must be a key-value object.' }, { status: 400 });
      }

      const value = JSON.stringify(discoveryQueries);
      const updatedConfig = await prisma.systemConfig.upsert({
        where: { key: 'discovery_queries_json' },
        update: { value },
        create: { key: 'discovery_queries_json', value }
      });

      responsePayload.discoveryQueries = JSON.parse(updatedConfig.value);
    }

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    console.error('API POST config failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
