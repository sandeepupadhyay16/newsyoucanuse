import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { chatCompletion, embedText } from '@/lib/llm';
import { searchPortfolio } from '@/lib/rag';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = body.message || body.query || '';
    const history = body.history || [];

    if (!query.trim()) {
      return NextResponse.json({ error: 'Query is empty' }, { status: 400 });
    }

    // 1. Fetch technology streams
    const streamsConfig = await prisma.systemConfig.findUnique({ where: { key: 'tech_streams' } });
    const activeStreams = streamsConfig ? streamsConfig.value.split(',').map(s => s.trim()).filter(Boolean) : ['Frontier Model Capabilities', 'Model-on-Chip Advancements', 'Agentic Architectures', 'Ways of Working', 'Development Frameworks'];

    // 2. Perform RAG (Retrieval-Augmented Generation) instead of pulling entire DB
    const queryEmbedding = await embedText(query);
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    const matchedGroups = await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT g.id, g.title, g.summary, g."trajectoryPrediction", g."predictionsTimeline", g."predictionConfidence", t.title as "themeTitle", t.stream as "themeStream",
             1 - (ge.embedding <=> ${embeddingStr}::vector) as similarity
      FROM "ArticleGroup" g
      JOIN "Theme" t ON g."themeId" = t.id
      JOIN "ArticleGroupEmbedding" ge ON ge."articleGroupId" = g.id
      ORDER BY similarity DESC
      LIMIT 4
    `);

    const portfolioResults = await searchPortfolio(query, 4);

    let ragContext = '';

    if (matchedGroups.length > 0) {
      ragContext += `\n=== RELEVANT TECHNOLOGY TRENDS & GROUPS ===\n`;
      matchedGroups.forEach((g, idx) => {
        let timelineText = 'None';
        try {
          if (g.predictionsTimeline) {
            const t = JSON.parse(g.predictionsTimeline);
            timelineText = `Short-Term: "${t.shortTerm}" | Medium-Term: "${t.mediumTerm}" | Long-Term: "${t.longTerm}"`;
          }
        } catch {}
        ragContext += `${idx + 1}. Trend: "${g.title}" (Stream: ${g.themeStream}, Theme: ${g.themeTitle})
   - Summary: "${g.summary}"
   - Trajectory: "${g.trajectoryPrediction}" (Confidence: ${g.predictionConfidence}%)
   - Projections: ${timelineText}\n\n`;
      });
    }

    if (portfolioResults.projects.length > 0) {
      ragContext += `\n=== RELEVANT BLUEPRINTS & COMMENTARIES ===\n`;
      portfolioResults.projects.forEach((p, idx) => {
        ragContext += `${idx + 1}. Project: "${p.title}" (Phase: ${p.phase})
   - Problem Statement: "${p.problemStatement}"
   - Functional Domains: ${p.functionalDomains.join(', ')}
   - Therapeutic Areas: ${p.therapeuticAreas.join(', ')}
   - Readiness Score: ${p.readinessScore}%\n\n`;
      });
    }

    if (portfolioResults.experts.length > 0) {
      ragContext += `\n=== RELEVANT EXPERTS & SPEAKERS ===\n`;
      portfolioResults.experts.forEach((e, idx) => {
        ragContext += `${idx + 1}. Expert: "${e.name}" (${e.title} at ${e.organization})
   - Availability: ${e.availability}
   - Competencies: ${e.competencies.join(', ')}\n\n`;
      });
    }

    // 3. Prompt the LLM. In addition to answering the query, we ask the LLM to output a trigger block if the query is about a missing topic.
    const systemPrompt = `You are the Oracle & AI Ingestion Advisor.
Your role is to answer user queries about AI technology trends, commentaries, and trajectory roadmaps in our database.

=== SYSTEM TECHNOLOGY STREAMS ===
${activeStreams.join(', ')}

=== SEMANTICALLY RELEVANT DATABASE CONTEXT ===
${ragContext || 'No matching trends, projects, or experts found.'}


=== DYNAMIC DISCOVERY DETECTION ===
If the user's message is asking about a technology stream or theme that is NOT in the Semantically Relevant Database Context above (or is a completely new topic like "quantum computing", "fusion energy", or a stream not listed), you MUST end your response with a JSON action block to allow triggering the discovery crawler.
Format the trigger exactly as:
[TRIGGER_DISCOVERY: "Name of the missing stream or theme"]

=== GENERAL INSTRUCTIONS ===
1. Answer the user's questions clearly, accurately, and concisely based on the database context.
2. Formulate outlook predictions, timelines, and implications using the available group forecasts.
3. Keep answers readable and formatted in premium Markdown.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history
        .filter((m: any) => m.id !== 'welcome' && m.role !== 'system')
        .map((m: any) => ({ role: m.role, content: m.content }))
    ];

    const answer = await chatCompletion(messages, 0.2);

    // Parse out discovery trigger if present
    let offerDiscovery = false;
    let discoveryStream = '';
    const triggerMatch = /\[TRIGGER_DISCOVERY:\s*["']([^"']+)["']\]/i.exec(answer);
    if (triggerMatch) {
      offerDiscovery = true;
      discoveryStream = triggerMatch[1];
    }

    // Clean the trigger text block from user-facing answer text
    const cleanAnswer = answer.replace(/\[TRIGGER_DISCOVERY:[\s\S]*?\]/gi, '').trim();

    return NextResponse.json({
      answer: cleanAnswer,
      offerDiscovery,
      discoveryStream
    });

  } catch (error: any) {
    console.error('API Chat failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
