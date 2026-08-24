import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { chatCompletion, embedText } from '@/lib/llm';
import { validateUrlForSSRF } from '@/lib/ssrf';
import { Prisma } from '@prisma/client';

function extractJSON(text: string): any {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(text.substring(start, end + 1));
    }
    return JSON.parse(text);
  } catch (e) {
    console.error('Failed to extract JSON from text:', text);
    return null;
  }
}

// Scrapes web page content
async function scrapeUrlContent(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch URL. HTTP status ${res.status}`);
  }

  const html = await res.text();
  // Strip tags
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function POST(request: Request) {
  try {
    let content = '';
    let fileName = 'Direct Link';
    let urlToScrape = '';

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }

      // Enforce 10MB size limit
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
      }
      
      fileName = file.name;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (file.name.toLowerCase().endsWith('.pdf')) {
        const pdfParse = require('pdf-parse');
        const pdfData = await pdfParse(buffer);
        content = pdfData.text || '';
      } else {
        content = buffer.toString('utf-8');
      }
    } else {
      const body = await request.json();
      content = body.content || body.text || '';
      fileName = body.fileName || 'Pasted Content';
      urlToScrape = body.url || '';
    }

    // 1. Scrape URL if provided
    if (urlToScrape) {
      // Validate URL against SSRF
      const isSafe = await validateUrlForSSRF(urlToScrape);
      if (!isSafe) {
        return NextResponse.json({ error: 'Access to private or link-local networks is prohibited.' }, { status: 400 });
      }

      fileName = urlToScrape;
      try {
        content = await scrapeUrlContent(urlToScrape);
      } catch (err: any) {
        return NextResponse.json({ error: `URL Scraper failed: ${err.message}` }, { status: 400 });
      }
    }

    if (!content.trim()) {
      return NextResponse.json({ error: 'No text content available to ingest' }, { status: 400 });
    }

    // 2. Save Ingestion log
    await prisma.meetingIngestion.create({
      data: {
        fileName,
        content: content.substring(0, 5000) // snip for DB size safety
      }
    });

    // 3. Query active tech streams from database configuration
    let streamsConfig = await prisma.systemConfig.findUnique({
      where: { key: 'tech_streams' }
    });
    const activeStreams = streamsConfig
      ? streamsConfig.value.split(',').map(s => s.trim()).filter(Boolean)
      : [
          'Frontier Model Capabilities',
          'Model-on-Chip Advancements',
          'Agentic Architectures',
          'Ways of Working',
          'Development Frameworks'
        ];
    const streamsListString = activeStreams.join(', ');

    // 4. Coordinate LLM parsing to extract structured developments
    const ingestPrompt = `You are the Editorial Ingestion Agent.
Analyze the following text content extracted from a newsletter document or webpage:
=== TEXT CONTENT ===
${content.substring(0, 16000)}

Extract up to 3 distinct AI technology updates, research announcements, or news developments discussed in the text.
For each extracted topic, write a professional title, a short summary (2-3 sentences), identify the author (or default to "Staff Writer"), classify the concept into one of the target technology streams (${streamsListString}), and generate the following forecast commentary:
1. Consultant Implication: How this trend impacts consulting delivery models, tool architectures, or developer productivity.
2. Enterprise Practitioner Takeaway: How client enterprises should adopt this trend, covering cost/latency tradeoffs or deployment strategies.
3. Trajectory Prediction: Growth forecast (e.g. "Accelerating", "Stable", "Disrupted").
4. Predictions Timeline: A JSON object containing three keys: "shortTerm" (<6m), "mediumTerm" (6m-2y), and "longTerm" (>2y) projections.
5. Prediction Confidence: An integer between 50 and 100.

You MUST respond with a valid JSON object. Do not include markdown code block formatting or backticks.
The response must conform EXACTLY to this JSON schema:
{
  "topics": [
    {
      "title": "Topic Title",
      "summary": "Description of the development and bottleneck being addressed",
      "author": "Author Name",
      "stream": "Frontier Model Capabilities",
      "consultantImplication": "What this means for consultants...",
      "practitionerImplication": "What this means for client practitioners...",
      "trajectoryPrediction": "Accelerating",
      "predictionsTimeline": {
        "shortTerm": "Short-term projection",
        "mediumTerm": "Medium-term projection",
        "longTerm": "Long-term projection"
      },
      "predictionConfidence": 92,
      "functionalDomains": ["General AI"],
      "sourceUrl": "URL path or article link"
    }
  ]
}
`;

    const llmOutput = await chatCompletion([
      { role: 'system', content: ingestPrompt },
      { role: 'user', content: 'Parse content and extract AI topics.' }
    ], 0.2);

    const parsed = extractJSON(llmOutput);
    if (!parsed || !Array.isArray(parsed.topics) || parsed.topics.length === 0) {
      return NextResponse.json({ error: 'LLM failed to extract structured topics. Verify document format.' }, { status: 422 });
    }

    const weightsConfig = await prisma.systemConfig.findUnique({ where: { key: 'weights' } });
    const w = weightsConfig && weightsConfig.value.split(',').length === 3
      ? weightsConfig.value.split(',').map(Number)
      : [0.40, 0.30, 0.30];

    const ingestedTopics = [];

    // 4. Save to DB and create embeddings
    for (const t of parsed.topics) {
      // Validate stream
      let validatedStream = activeStreams[0];
      if (t.stream) {
        const matchingStream = activeStreams.find(s => s.toLowerCase() === t.stream.toLowerCase());
        if (matchingStream) {
          validatedStream = matchingStream;
        }
      }

      // Validate trajectory prediction
      let validatedTrajectory = 'Accelerating';
      const allowedTrajectories = ['Accelerating', 'Stable', 'Disrupted'];
      if (t.trajectoryPrediction) {
        const matchingTrajectory = allowedTrajectories.find(tr => tr.toLowerCase() === t.trajectoryPrediction.toLowerCase());
        if (matchingTrajectory) {
          validatedTrajectory = matchingTrajectory;
        }
      }

      // Setup scores
      const impactWorkingScore = 75.0;
      const impactDevelopmentScore = 70.0;
      const feasibilityScore = 80.0;
      const relevancyScore = impactWorkingScore * w[0] + impactDevelopmentScore * w[1] + feasibilityScore * w[2];

      // Auto-profile/retrieve author
      let authorExpertId = null;
      if (t.author && t.author.toLowerCase() !== 'staff writer') {
        let expert = await prisma.expert.findFirst({
          where: { name: { equals: t.author, mode: 'insensitive' } }
        });

        if (!expert) {
          // Generate new expert profile
          const expertPrompt = `You are a professional biographer. The author "${t.author}" wrote about "${t.title}".
Write a professional biography (1-2 sentences), outline 3 competencies, and suggest an avatar icon name (like "avatar-1" to "avatar-9").
Do not include markdown or backticks. Format EXACTLY as:
{
  "bio": "Expert Biography...",
  "competencies": ["Competency 1", "Competency 2"],
  "avatarUrl": "avatar-3"
}`;

          try {
            const expertOut = await chatCompletion([{ role: 'system', content: expertPrompt }], 0.2);
            const expertJson = extractJSON(expertOut);
            if (expertJson) {
              expert = await prisma.expert.create({
                data: {
                  name: t.author,
                  title: 'Specialist Contributor',
                  organization: 'External AI Analyst',
                  email: `${t.author.toLowerCase().replace(/\s+/g, '.')}@ai-analyst.com`,
                  teamsId: `${t.author.toLowerCase().replace(/\s+/g, '')}.ad`,
                  bio: expertJson.bio || '',
                  competencies: expertJson.competencies || ['AI Research'],
                  avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(expertJson.avatarUrl || 'avatar-1')}`,
                  availability: 'Available'
                }
              });
              
              // Generate embedding for expert
              const embedTextStr = `${expert.name} ${expert.title} ${expert.organization} ${expert.bio} ${(expert.competencies || []).join(' ')}`;
              const embedding = await embedText(embedTextStr);
              const embeddingStr = `[${embedding.join(',')}]`;
              await prisma.$executeRaw(Prisma.sql`
                INSERT INTO "ExpertEmbedding" ("id", "expertId", "embedding", "createdAt")
                VALUES (gen_random_uuid(), ${expert.id}, ${embeddingStr}::vector, NOW())
              `);
            }
          } catch (expertErr) {
            console.error('Failed to auto-profile expert:', expertErr);
          }
        }
        
        if (expert) {
          authorExpertId = expert.id;
        }
      }

      // Create commentary Project record
      const newCommentary = await prisma.project.create({
        data: {
          title: t.title,
          problemStatement: t.summary,
          integrations: t.functionalDomains || [],
          budgetStatus: 'Approved',
          stakeholderStatus: 'Aligned',
          opportunityCost: 'Organization falls behind frontier AI research.',
          businessCase: t.consultantImplication || '',
          financialRoi: 0,
          budgetRequiredVal: 0,
          execSponsor: 'TBD',
          productOwner: 'TBD',
          deploymentGateway: '',
          phase: 'Harvested', // triage backlog initial state
          therapeuticAreas: [validatedStream],
          budgetAvailabilityScore: 80.0,
          dataAvailabilityScore: 75.0,
          stakeholderReadinessScore: 80.0,
          impactOfNotDoingScore: 85.0,
          financialBusinessCaseScore: 80.0,
          budgetRequiredScore: 80.0,
          readinessScore: 80.0,
          functionalDomains: [validatedStream],
          ideaScore: relevancyScore,
          checkerInsight: 'Parsed successfully via Document Ingestion Hub.',
          brainstormerInsight: t.consultantImplication,
          validatorInsight: t.practitionerImplication,
          businessCaseInsight: validatedTrajectory,
          criticInsight: '',
          submittedBy: 'Document Ingestion',
          
          // Trajectory Commentary fields
          consultantImplication: t.consultantImplication || '',
          practitionerImplication: t.practitionerImplication || '',
          trajectoryPrediction: validatedTrajectory,
          predictionsTimeline: JSON.stringify(t.predictionsTimeline || {}),
          predictionConfidence: Number(t.predictionConfidence) || 85.0,
          author: t.author || 'Staff Writer',
          authorId: authorExpertId,
          source: urlToScrape ? 'Web Link' : fileName,
          sourceUrl: urlToScrape || t.sourceUrl || '',
          publishDate: new Date()
        }
      });

      // Embed Commentary
      const embedTextStr = `${newCommentary.title} ${newCommentary.problemStatement} ${(newCommentary.functionalDomains || []).join(' ')} ${newCommentary.consultantImplication} ${newCommentary.practitionerImplication}`;
      const embedding = await embedText(embedTextStr);
      const embeddingStr = `[${embedding.join(',')}]`;

      await prisma.$executeRaw(Prisma.sql`
        INSERT INTO "ProjectEmbedding" ("id", "projectId", "embedding", "createdAt")
        VALUES (gen_random_uuid(), ${newCommentary.id}, ${embeddingStr}::vector, NOW())
      `);

      ingestedTopics.push(newCommentary);
    }

    return NextResponse.json({
      success: true,
      message: `Parsed and successfully ingested ${ingestedTopics.length} AI developments.`,
      topics: ingestedTopics
    });

  } catch (error: any) {
    console.error('API Ingest POST failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
