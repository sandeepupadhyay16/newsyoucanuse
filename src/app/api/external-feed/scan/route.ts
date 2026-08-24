import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { chatCompletion, chatCompletionWithUsage, embedText } from '@/lib/llm';
import { activeTasks, ScanTask } from '@/lib/scanTasks';
import { validateUrlForSSRF } from '@/lib/ssrf';
import { Prisma } from '@prisma/client';

// Browser headers to prevent 403 Forbidden from Cloudflare and bot filters
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'sec-fetch-dest': 'document',
  'sec-fetch-mode': 'navigate',
  'sec-fetch-site': 'none',
  'sec-fetch-user': '?1',
  'upgrade-insecure-requests': '1'
};

// Helper to strip script, style, and HTML tags
function cleanHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract physical images matching visual keywords
function extractAssetsFromHtml(html: string, baseUrl: string): Array<{ type: string, url: string, title: string }> {
  const assets: Array<{ type: string, url: string, title: string }> = [];
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const altRegex = /alt=["']([^"']+)["']/i;
  
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    let imgSrc = match[1];
    if (!imgSrc.startsWith('http')) {
      try {
        imgSrc = new URL(imgSrc, baseUrl).toString();
      } catch {}
    }
    
    const fullTag = match[0];
    const altMatch = altRegex.exec(fullTag);
    const altText = altMatch ? altMatch[1] : '';
    
    const isVisual = /chart|graph|figure|diagram|plot|map|dashboard/i.test(altText) || 
                     /chart|graph|figure|diagram|plot/i.test(imgSrc);
                     
    if (isVisual && assets.length < 3) {
      assets.push({
        type: 'chart',
        url: imgSrc,
        title: altText || 'Extracted data visual'
      });
    }
  }
  return assets;
}

function normalizeUrl(urlStr: string | undefined | null): string {
  if (!urlStr) return '';
  try {
    const url = new URL(urlStr);
    url.search = '';
    url.hash = '';
    return url.toString().toLowerCase().replace(/\/$/, '').trim();
  } catch (e) {
    return urlStr.toLowerCase().replace(/\/$/, '').trim();
  }
}

async function isAlreadyProcessed(title: string, url: string): Promise<boolean> {
  const normUrl = normalizeUrl(url);

  // Check ProcessedArticle
  const processed = await prisma.processedArticle.findFirst({
    where: {
      OR: [
        { url: normUrl },
        { title: { equals: title, mode: 'insensitive' } }
      ]
    }
  });
  if (processed) return true;

  // Check Article
  const existingArticle = await prisma.article.findFirst({
    where: {
      OR: [
        { url },
        { url: normUrl },
        { title: { equals: title, mode: 'insensitive' } }
      ]
    }
  });
  if (existingArticle) return true;

  return false;
}

function extractTagContent(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, 'i');
  const match = regex.exec(xml);
  if (match) {
    return match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
  }
  return '';
}

function parseRss(xmlText: string): Array<{ title: string; link: string; description: string; author: string; publishDate?: string }> {
  const items: any[] = [];
  const regex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = regex.exec(xmlText)) !== null) {
    const itemXml = match[1];
    const title = extractTagContent(itemXml, 'title') || 'Untitled';
    const link = extractTagContent(itemXml, 'link');
    const description = extractTagContent(itemXml, 'description');
    const author = extractTagContent(itemXml, 'dc:creator') || extractTagContent(itemXml, 'author') || '';
    const pubDate = extractTagContent(itemXml, 'pubDate');
    items.push({ title, link, description, author, publishDate: pubDate });
  }
  return items;
}

function extractArticleCandidatesFromHtml(html: string, baseUrl: string): Array<{ title: string; link: string; description: string; author: string }> {
  const candidates: any[] = [];
  const aTagRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  const seenLinks = new Set<string>();

  while ((match = aTagRegex.exec(html)) !== null) {
    const rawHref = match[1];
    const text = match[2].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    if (text.length < 20 || rawHref.startsWith('#') || rawHref.startsWith('javascript:')) {
      continue;
    }

    let resolvedUrl = rawHref;
    if (!rawHref.startsWith('http')) {
      try {
        resolvedUrl = new URL(rawHref, baseUrl).toString();
      } catch {
        continue;
      }
    }

    if (
      resolvedUrl.includes('twitter.com') ||
      resolvedUrl.includes('linkedin.com') ||
      resolvedUrl.includes('facebook.com') ||
      resolvedUrl.includes('github.com')
    ) {
      continue;
    }

    const lowerText = text.toLowerCase();
    if (
      lowerText === 'read more' || 
      lowerText === 'subscribe' || 
      lowerText === 'learn more' || 
      lowerText === 'sign in'
    ) {
      continue;
    }

    if (seenLinks.has(resolvedUrl)) {
      continue;
    }
    seenLinks.add(resolvedUrl);

    candidates.push({
      title: text,
      link: resolvedUrl,
      description: `Article discovered from ${baseUrl}.`,
      author: ''
    });

    if (candidates.length >= 10) {
      break;
    }
  }
  return candidates;
}

// Fallback items in case fetches fail or during local development
const FALLBACK_FEED_DATA: Record<string, Array<{title: string, summary: string, author: string, sourceUrl: string}>> = {
  "OpenAI Blog": [
    {
      title: "GPT-4o Voice and Multimodal Ingestion Release",
      summary: "OpenAI officially rolls out direct voice and screen-sharing agents to standard developer accounts, reducing latency to under 300ms.",
      author: "Sam Altman",
      sourceUrl: "https://openai.com/news/gpt-4o-multimodal-voice-release"
    }
  ],
  "Anthropic Research": [
    {
      title: "Claude 3.7 Sonnet State-Space Agent Architectures",
      summary: "Anthropic details stateful loops and recursive code editing capabilities of their new models deployed directly in cloud containers.",
      author: "Dario Amodei",
      sourceUrl: "https://www.anthropic.com/research/claude-3-7-agent-architectures"
    }
  ]
};

// Logging helper to update both memory activeTasks and database ScanRun records
async function logToTask(task: ScanTask, message: string) {
  task.logs.push(message);
  try {
    await prisma.scanRun.update({
      where: { id: task.id },
      data: {
        logs: JSON.stringify(task.logs),
        addedCount: task.addedCount,
        status: task.status
      }
    });
  } catch (err) {
    console.error("Failed to write logs to ScanRun DB:", err);
  }
}

function extractJSON(text: string): any {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(text.substring(start, end + 1));
    }
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

// Coordinated Ingestion + Clustering + Forecasting Pipeline for a Single Raw Article
async function processArticleIngestion(
  candidate: { title: string; link?: string; description?: string; author?: string; publishDate?: string; summary?: string; sourceUrl?: string },
  sourceName: string,
  fullTextContent: string,
  extractedAssets: Array<{ type: string, url: string, title: string }>,
  task: ScanTask
): Promise<{ success: boolean; promptTokens: number; completionTokens: number }> {
  
  let promptTokens = 0;
  let completionTokens = 0;

  // 1. Generate pgvector embedding for the article content
  const cleanTitleStr = candidate.title.replace(/&amp;/g, '&').replace(/\d{2}\.\d{2}\.\d{2}/g, '').trim();
  const textToEmbed = `${cleanTitleStr}\n${fullTextContent.substring(0, 8000)}`;
  const embedding = await embedText(textToEmbed);
  const embeddingStr = `[${embedding.join(',')}]`;

  // 2. Perform Cosine Similarity vector search to find nearest cluster
  let closestGroupId: string | null = null;
  try {
    const searchResults: any[] = await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT "articleGroupId", (1 - (embedding <=> ${embeddingStr}::vector)) as similarity
      FROM "ArticleGroupEmbedding"
      ORDER BY embedding <=> ${embeddingStr}::vector ASC
      LIMIT 1
    `);

    if (searchResults.length > 0 && searchResults[0].similarity > 0.86) {
      closestGroupId = searchResults[0].articleGroupId;
      await logToTask(task, `[Vector Search] Found semantically similar ArticleGroup: ${closestGroupId} (Similarity: ${Math.round(searchResults[0].similarity * 100)}%)`);
    }
  } catch (e: any) {
    console.error("Vector search failed, creating new group:", e.message);
  }

  // Fetch all streams for classification
  const streamsConfig = await prisma.systemConfig.findUnique({ where: { key: 'tech_streams' } });
  const activeStreams = streamsConfig ? streamsConfig.value.split(',').map(s => s.trim()).filter(Boolean) : ['Frontier Model Capabilities', 'Model-on-Chip Advancements', 'Agentic Architectures', 'Ways of Working', 'Development Frameworks'];

  const pipelinePrompt = `Analyze the technology news article:
Title: ${cleanTitleStr}
Content Summary: ${fullTextContent.substring(0, 6000)}

Please output a JSON response containing:
1. stream: Classify into one of these streams: ${activeStreams.join(', ')}
2. functionalDomains: Tag with 1-2 developer functional domains (e.g. "RAG", "Fine-Tuning", "GPU Compiler").
3. consultantImplication: Takeaway for tech developers/consultants (2-3 sentences).
4. practitionerImplication: Takeaway for enterprise business leaders (2-3 sentences).
5. trajectory: Out of "Accelerating", "Stable", "Disrupted"
6. timeline: Projections for shortTerm (<6m), mediumTerm (6m-2y), and longTerm (>2y)
7. confidence: confidence score integer (50-100)
8. signalTitle: A concise 5-10 word signal headline that captures the KEY technological insight or development from this article — NOT the article title. Write it as an analyst would label a trend (e.g. "Local LLM Inference Hits Consumer Grade Performance", "Multi-Agent Loops Reach Production Stability"). Avoid brand names as the primary subject unless they represent a broader shift.

Format EXACTLY as:
{
  "stream": "Frontier Model Capabilities",
  "functionalDomains": ["RAG"],
  "consultantImplication": "...",
  "practitionerImplication": "...",
  "trajectory": "Accelerating",
  "timeline": {
    "shortTerm": "...",
    "mediumTerm": "...",
    "longTerm": "..."
  },
  "confidence": 85,
  "signalTitle": "..."
}`;

  const analysisRes = await chatCompletionWithUsage([
    { role: 'system', content: 'You are the Lead AI Ingestion Agent. Parse the article and return structured analysis.' },
    { role: 'user', content: pipelinePrompt }
  ]);
  
  if (analysisRes.usage) {
    promptTokens += (analysisRes.usage.prompt_tokens || 0);
    completionTokens += (analysisRes.usage.completion_tokens || 0);
  }

  const analysis = extractJSON(analysisRes.content) || {
    stream: activeStreams[0],
    functionalDomains: ['General AI'],
    consultantImplication: 'Developers should monitor local models and deploy quantizations.',
    practitionerImplication: 'Assess cost vs latency before building custom models.',
    trajectory: 'Stable',
    timeline: { shortTerm: 'Tool adoption increases.', mediumTerm: 'Standard libraries emerge.', longTerm: 'Complete replacements of legacy.' },
    confidence: 75,
    signalTitle: cleanTitleStr
  };

  // Use LLM-derived signal title, fall back to clean article title
  const groupTitle = (analysis.signalTitle && typeof analysis.signalTitle === 'string' && analysis.signalTitle.trim().length > 5)
    ? analysis.signalTitle.trim()
    : cleanTitleStr;

  // Validate stream
  let validatedStream = activeStreams[0];
  if (analysis.stream && typeof analysis.stream === 'string') {
    const matchingStream = activeStreams.find(s => s.toLowerCase() === analysis.stream.toLowerCase());
    if (matchingStream) {
      validatedStream = matchingStream;
    }
  }

  // Validate trajectory
  const allowedTrajectories = ['Accelerating', 'Stable', 'Disrupted'];
  const validatedTrajectory = allowedTrajectories.includes(analysis.trajectory) ? analysis.trajectory : 'Stable';

  // 3. Save raw Article in DB
  const article = await prisma.article.create({
    data: {
      title: cleanTitleStr,
      content: fullTextContent,
      url: candidate.link || candidate.sourceUrl || '',
      sourceName,
      publishDate: candidate.publishDate ? new Date(candidate.publishDate) : new Date(),
      stream: validatedStream,
      author: candidate.author || 'AI Analyst',
      assets: {
        create: extractedAssets.map(a => ({
          type: a.type,
          url: a.url,
          title: a.title
        }))
      }
    }
  });

  // Save Article embedding
  try {
    const artEmbedding = await embedText(`${cleanTitleStr}\n${fullTextContent.substring(0, 4000)}`);
    const artEmbeddingStr = `[${artEmbedding.join(',')}]`;
    const uuid = crypto.randomUUID();
    await prisma.$executeRaw`
      INSERT INTO "ArticleEmbedding" ("id", "articleId", "embedding", "createdAt")
      VALUES (${uuid}, ${article.id}, ${artEmbeddingStr}::vector, NOW())
    `;
  } catch (e: any) {
    console.error("Article embedding creation failed:", e.message);
  }

  // 4. Determine final target group ID (Merge into closestGroupId if found, else create new)
  let finalGroupId = closestGroupId;
  if (!finalGroupId) {
    // 5. Create parent Theme (if needed) or fetch existing
    let theme = await prisma.theme.findFirst({
      where: {
        stream: validatedStream,
        title: { equals: groupTitle, mode: 'insensitive' }
      }
    });

    if (!theme) {
      theme = await prisma.theme.create({
        data: {
          title: groupTitle,
          summary: analysis.consultantImplication || 'Strategic implications of this technological vector.',
          stream: validatedStream
        }
      });
    }

    // Create a new ArticleGroup (Theme Card)
    const newGroup = await prisma.articleGroup.create({
      data: {
        themeId: theme.id,
        title: groupTitle,
        summary: analysis.practitionerImplication || 'Practical implications of this technological vector.',
        trajectoryPrediction: validatedTrajectory,
        predictionsTimeline: JSON.stringify({
          shortTerm: analysis.timeline?.shortTerm || 'Increased adoption.',
          mediumTerm: analysis.timeline?.mediumTerm || 'Development framework standardization.',
          longTerm: analysis.timeline?.longTerm || 'Mainstream production replacements.',
          trajectory: validatedTrajectory
        }),
        predictionConfidence: Number(analysis.confidence) || 75.0
      }
    });
    finalGroupId = newGroup.id;

    // Save ArticleGroup embedding
    try {
      const uuid = crypto.randomUUID();
      await prisma.$executeRaw`
        INSERT INTO "ArticleGroupEmbedding" ("id", "articleGroupId", "embedding", "createdAt")
        VALUES (${uuid}, ${finalGroupId}, ${embeddingStr}::vector, NOW())
      `;
    } catch (e: any) {
      console.error("ArticleGroup embedding insertion failed:", e.message);
    }
  }

  // Link Article to Group
  await prisma.article.update({
    where: { id: article.id },
    data: { articleGroupId: finalGroupId }
  });

  // 6. Oracle Refresh Auto-Rolldown: Re-generate timelines for the affected Group
  try {
    const siblings = await prisma.article.findMany({
      where: { articleGroupId: finalGroupId },
      orderBy: { publishDate: 'desc' },
      take: 5
    });
    const siblingTexts = siblings.map((s, idx) => `Article #${idx+1}: "${s.title}"\n${s.content.substring(0, 1500)}`).join('\n\n');

    const oraclePrompt = `You are the Oracle Agent. Analyze the consolidated news group:
${siblingTexts}

Generate the roadmap timeline forecast projections AND a refined signal title.
trajectory: "Accelerating", "Stable", "Disrupted"
shortTerm: Projections (<6m)
mediumTerm: Projections (6m-2y)
longTerm: Projections (>2y)
confidence: confidence score integer (50-100)
signalTitle: A concise 5-10 word analyst signal headline that captures the KEY technological trend across ALL articles in this group. Write it as a trend label, not a news headline. Avoid repeating a single article title.

Output valid JSON EXACTLY as:
{
  "trajectory": "Accelerating",
  "shortTerm": "...",
  "mediumTerm": "...",
  "longTerm": "...",
  "confidence": 90,
  "signalTitle": "..."
}`;
    const oracleRes = await chatCompletionWithUsage([
      { role: 'system', content: 'You are the Lead Oracle Ball Roadmap Forecaster.' },
      { role: 'user', content: oraclePrompt }
    ]);
    if (oracleRes.usage) {
      promptTokens += (oracleRes.usage.prompt_tokens || 0);
      completionTokens += (oracleRes.usage.completion_tokens || 0);
    }
    const forecast = extractJSON(oracleRes.content);
    if (forecast) {
      await prisma.articleGroup.update({
        where: { id: finalGroupId },
        data: {
          lastCoverageDate: new Date(),
          ...(forecast.signalTitle && typeof forecast.signalTitle === 'string' && forecast.signalTitle.trim().length > 5
            ? { title: forecast.signalTitle.trim() }
            : {}),
          trajectoryPrediction: forecast.trajectory || 'Accelerating',
          predictionsTimeline: JSON.stringify({
            shortTerm: forecast.shortTerm,
            mediumTerm: forecast.mediumTerm,
            longTerm: forecast.longTerm,
            trajectory: forecast.trajectory
          }),
          predictionConfidence: Number(forecast.confidence) || 80.0
        }
      });
    }
  } catch (err: any) {
    console.error('Oracle timeline auto-refresh failed:', err.message);
  }

  return { success: true, promptTokens, completionTokens };
}

// Background scan runner
async function runBackgroundScan(task: ScanTask) {
  const startedAt = Date.now();
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  
  let totalParsed = 0;
  let totalIngested = 0;
  let totalRejected = 0;
  let totalFailed = 0;

  const sourceStats: Record<string, {
    sourceName: string;
    durationMs: number;
    tokensUsed: number;
    articlesParsed: number;
    articlesIngested: number;
    articlesRejected: number;
    articlesFailed: number;
  }> = {};

  try {
    let activeSources = [];
    if (task.sourceId) {
      const source = await prisma.feedSource.findUnique({ where: { id: task.sourceId } });
      if (source) activeSources.push(source);
    } else {
      activeSources = await prisma.feedSource.findMany({ where: { enabled: true } });
    }

    if (activeSources.length === 0) {
      task.status = 'completed';
      await logToTask(task, 'No active feed sources found to scan.');
      return;
    }

    const sourceNames = activeSources.map((s: any) => `"${s.name}"`).join(', ');
    await logToTask(task, `[Queue Status] Ingestion queue initialized with ${activeSources.length} sources: [ ${sourceNames} ]`);

    for (let idx = 0; idx < activeSources.length; idx++) {
      const sourceStart = Date.now();
      let ingestedForThisSource = 0;
      let parsedForThisSource = 0;
      let rejectedForThisSource = 0;
      let failedForThisSource = 0;
      let sourcePromptTokens = 0;
      let sourceCompletionTokens = 0;

      if ((task.status as string) === 'aborted') {
        await logToTask(task, '[WARNING] Scan aborted by user.');
        await prisma.scanRun.update({
          where: { id: task.id },
          data: {
            completedAt: new Date(),
            status: 'aborted',
            addedCount: totalIngested,
            durationMs: Date.now() - startedAt,
            tokensUsed: totalPromptTokens + totalCompletionTokens,
            sourceStatsJson: JSON.stringify(sourceStats),
            parsedCount: totalParsed,
            ingestedCount: totalIngested,
            rejectedCount: totalRejected,
            failedCount: totalFailed
          }
        });
        return;
      }

      const source = activeSources[idx];
      
      await logToTask(task, `[Source ${idx + 1} of ${activeSources.length}] Ingesting "${source.name}" from "${source.url}"...`);
      
      let articleCandidates: any[] = [];
      let rawHtml = '';

      try {
        const isSafe = await validateUrlForSSRF(source.url);
        if (!isSafe) {
          await logToTask(task, `[WARNING] SSRF Blocked URL: ${source.url} (Private or invalid address).`);
          await prisma.ingestionAlert.create({
            data: {
              sourceId: source.id,
              sourceName: source.name,
              error: "SSRF Blocked: Private or invalid address"
            }
          });
          failedForThisSource++;
          totalFailed++;
          continue;
        }

        const response = await fetch(source.url, {
          headers: BROWSER_HEADERS,
          signal: task.abortController?.signal
        });

        if (!response.ok) {
          throw new Error(`HTTP status ${response.status}`);
        }
        
        rawHtml = await response.text();

        if (source.type === 'RSS Feed') {
          articleCandidates = parseRss(rawHtml).slice(0, 5);
        } else {
          articleCandidates = extractArticleCandidatesFromHtml(rawHtml, source.url).slice(0, 5);
        }

        parsedForThisSource = articleCandidates.length;
        totalParsed += parsedForThisSource;

      } catch (err: any) {
        if (err.name === 'AbortError') {
          task.status = 'aborted';
        }
        await logToTask(task, `[WARNING] Connection to "${source.name}" failed: ${err.message}. Skipping source.`);
        await prisma.ingestionAlert.create({
          data: {
            sourceId: source.id,
            sourceName: source.name,
            error: `Connection failed: ${err.message}`
          }
        });
        failedForThisSource++;
        totalFailed++;
        continue;
      }

      for (const candidate of articleCandidates) {
        if ((task.status as string) === 'aborted') {
          await logToTask(task, '[WARNING] Scan aborted by user.');
          await prisma.scanRun.update({
            where: { id: task.id },
            data: {
              completedAt: new Date(),
              status: 'aborted',
              addedCount: totalIngested,
              durationMs: Date.now() - startedAt,
              tokensUsed: totalPromptTokens + totalCompletionTokens,
              sourceStatsJson: JSON.stringify(sourceStats),
              parsedCount: totalParsed,
              ingestedCount: totalIngested,
              rejectedCount: totalRejected,
              failedCount: totalFailed
            }
          });
          return;
        }

        if (await isAlreadyProcessed(candidate.title, candidate.link || candidate.sourceUrl)) {
          rejectedForThisSource++;
          totalRejected++;
          continue;
        }

        let articleText = candidate.description || candidate.summary || '';
        let assets: any[] = [];
        if (candidate.link) {
          const isLinkSafe = await validateUrlForSSRF(candidate.link);
          if (!isLinkSafe) {
            await logToTask(task, `[WARNING] SSRF Blocked link: ${candidate.link} (Private or link-local network).`);
            failedForThisSource++;
            totalFailed++;
            continue;
          }
          try {
            const articleRes = await fetch(candidate.link, {
              headers: BROWSER_HEADERS,
              signal: task.abortController?.signal
            });
            if (articleRes.ok) {
              const fullHtml = await articleRes.text();
              const cleaned = cleanHtml(fullHtml);
              if (cleaned.length > 50) {
                articleText = cleaned;
              }
              assets = extractAssetsFromHtml(fullHtml, candidate.link);
            } else {
              await logToTask(task, `[INFO] Webpage fetch for "${candidate.title}" returned HTTP ${articleRes.status}. Using RSS summary.`);
            }
          } catch (e: any) {
            if (e.name === 'AbortError') {
              task.status = 'aborted';
            }
            await logToTask(task, `[INFO] Webpage fetch for "${candidate.title}" encountered error (${e.message}). Using RSS summary.`);
          }
        }

        if (!articleText.trim()) {
          articleText = candidate.description || candidate.summary || '';
        }

        if (!articleText.trim()) {
          const errMsg = `Failed to ingest article "${candidate.title}": No parseable text content found.`;
          await logToTask(task, `[SKIPPED] ${errMsg}`);
          failedForThisSource++;
          totalFailed++;
          continue;
        }

        try {
          const ingestResult = await processArticleIngestion(candidate, source.name, articleText, assets, task);
          if (ingestResult.success) {
            ingestedForThisSource++;
            task.addedCount++;
            sourcePromptTokens += ingestResult.promptTokens;
            sourceCompletionTokens += ingestResult.completionTokens;
            totalPromptTokens += ingestResult.promptTokens;
            totalCompletionTokens += ingestResult.completionTokens;
            totalIngested++;
          } else {
            failedForThisSource++;
            totalFailed++;
          }
        } catch (ingestErr: any) {
          await logToTask(task, `[WARNING] Ingestion processing failed for "${candidate.title}": ${ingestErr.message}`);
          failedForThisSource++;
          totalFailed++;
        }
      }

      const sourceEnd = Date.now();
      const sourceDuration = sourceEnd - sourceStart;
      const sourceTokens = sourcePromptTokens + sourceCompletionTokens;
      sourceStats[source.id] = {
        sourceName: source.name,
        durationMs: sourceDuration,
        tokensUsed: sourceTokens,
        articlesParsed: parsedForThisSource,
        articlesIngested: ingestedForThisSource,
        articlesRejected: rejectedForThisSource,
        articlesFailed: failedForThisSource
      };

      await logToTask(task, `[Ingestion Result] Ingested ${ingestedForThisSource} articles from "${source.name}".`);
      
      await prisma.feedSource.update({
        where: { id: source.id },
        data: { lastScannedAt: new Date() }
      });
    }

    if (task.status === 'processing') {
      task.status = 'completed';
      const durationMs = Date.now() - startedAt;
      const totalTokens = totalPromptTokens + totalCompletionTokens;

      await logToTask(task, `Scan completed successfully in ${(durationMs/1000).toFixed(1)}s.`);
      
      await prisma.scanRun.update({
        where: { id: task.id },
        data: {
          completedAt: new Date(),
          status: 'completed',
          addedCount: task.addedCount,
          durationMs,
          tokensUsed: totalTokens,
          sourceStatsJson: JSON.stringify(sourceStats),
          parsedCount: totalParsed,
          ingestedCount: totalIngested,
          rejectedCount: totalRejected,
          failedCount: totalFailed
        }
      });
    }
  } catch (error: any) {
    console.error('Background Scan failed:', error);
    task.status = 'failed';
    await logToTask(task, `[FATAL ERROR] Scan aborted: ${error.message}`);
    await prisma.scanRun.update({
      where: { id: task.id },
      data: {
        completedAt: new Date(),
        status: 'failed',
        parsedCount: totalParsed,
        ingestedCount: totalIngested,
        rejectedCount: totalRejected,
        failedCount: totalFailed
      }
    });
  }
}

// POST: Start a new background scan task
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceId = searchParams.get('sourceId');

    const taskId = crypto.randomUUID();
    const abortController = new AbortController();

    let sourceName = 'All Feeds';
    if (sourceId) {
      const src = await prisma.feedSource.findUnique({ where: { id: sourceId } });
      if (src) sourceName = src.name;
    }

    // Persist ScanRun
    await prisma.scanRun.create({
      data: {
        id: taskId,
        status: 'processing',
        startedAt: new Date(),
        addedCount: 0,
        logs: JSON.stringify(['Initializing background ingestion scan...']),
        sourceId: sourceId || null,
        sourceName
      }
    });

    const task: ScanTask = {
      id: taskId,
      status: 'processing',
      logs: ['Initializing background ingestion scan...'],
      addedCount: 0,
      sourceId,
      startedAt: new Date().toISOString(),
      abortController
    };

    activeTasks[taskId] = task;
    runBackgroundScan(task);

    return NextResponse.json({
      success: true,
      taskId,
      status: 'processing',
      message: 'Scan execution started in the background.'
    });
  } catch (error: any) {
    console.error('POST /api/external-feed/scan failed:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// GET: Retrieve progress, logs, and status of an ingestion task
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      const runs = await prisma.scanRun.findMany({
        orderBy: { startedAt: 'desc' },
        take: 20
      });
      return NextResponse.json(runs);
    }

    const task = activeTasks[taskId];
    if (!task) {
      const dbRun = await prisma.scanRun.findUnique({ where: { id: taskId } });
      if (!dbRun) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      
      let parsedLogs = [];
      try { parsedLogs = JSON.parse(dbRun.logs); } catch { parsedLogs = [dbRun.logs]; }

      return NextResponse.json({
        success: true,
        status: dbRun.status,
        logs: parsedLogs,
        addedCount: dbRun.addedCount
      });
    }

    return NextResponse.json({
      success: true,
      status: task.status,
      logs: task.logs,
      addedCount: task.addedCount
    });
  } catch (error: any) {
    console.error('GET /api/external-feed/scan failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Abort / Stop a running ingestion task
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) return NextResponse.json({ error: 'Missing taskId' }, { status: 400 });

    const task = activeTasks[taskId];
    if (task) {
      if (task.status === 'processing') {
        task.status = 'aborted';
        task.logs.push('[WARNING] Scan execution manually aborted.');
        if (task.abortController) task.abortController.abort();
      }
      await prisma.scanRun.update({
        where: { id: taskId },
        data: {
          status: 'aborted',
          logs: JSON.stringify(task.logs),
          completedAt: new Date()
        }
      });
    } else {
      await prisma.scanRun.update({
        where: { id: taskId },
        data: { status: 'aborted', completedAt: new Date() }
      });
    }

    return NextResponse.json({ success: true, message: 'Scan execution halted.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
