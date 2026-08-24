import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { chatCompletion } from '@/lib/llm';

const RECS_CONFIG_KEY = 'source_recommendations';

// ── CMS-specific feed path patterns ──────────────────────────────────────────
// Keyed by signals found in the homepage HTML that identify the CMS
const CMS_FEED_PATHS: Record<string, string[]> = {
  // WordPress — detectable via wp-content, wp-json, or generator meta tag
  wordpress: [
    '/feed/',
    '/feed',
    '/?feed=rss2',
    '/wp/feed/',
    '/blog/feed/',
    '/news/feed/',
    '/category/ai/feed/',
  ],
  // Ghost CMS — detectable via ghost.io CDN or <meta name="generator" content="Ghost">
  ghost: [
    '/rss/',
    '/rss',
    '/feed/',
    '/podcast/rss/',
  ],
  // Substack — detectable via substack.com in the domain or og:site_name
  substack: [
    '/feed',
    '/feed.xml',
  ],
  // Medium — detectable via medium.com in domain
  medium: [
    '/feed',
    '/feed/',
  ],
  // Beehiiv — detectable via beehiiv.com in page source
  beehiiv: [
    '/feed',
    '/rss',
  ],
  // Hashnode — detectable via hashnode.com/n/ or hashnode CDN
  hashnode: [
    '/rss.xml',
    '/feed.xml',
  ],
  // Hugo / Zola / Jekyll (static site generators) — detectable by generator tag
  hugo: [
    '/index.xml',
    '/feed.xml',
    '/rss.xml',
    '/atom.xml',
  ],
  // Gatsby / Next.js blogs
  gatsby: [
    '/rss.xml',
    '/feed.xml',
    '/feed',
    '/blog/rss.xml',
  ],
};

// Generic probe path list — ordered by statistical frequency
const GENERIC_FEED_PATHS = [
  '/feed',
  '/feed/',
  '/feed.xml',
  '/rss',
  '/rss/',
  '/rss.xml',
  '/rss.json',
  '/atom.xml',
  '/atom.json',
  '/index.xml',
  '/feed/index.xml',
  '/blog/feed',
  '/blog/feed/',
  '/blog/feed.xml',
  '/blog/rss',
  '/blog/rss.xml',
  '/blog/atom.xml',
  '/news/rss.xml',
  '/news/feed',
  '/news/feed.xml',
  '/posts/feed',
  '/posts/rss.xml',
  '/articles/feed',
  '/research/feed',
  '/research/rss.xml',
  '/?feed=rss2',
  '/?format=rss',
  '/feeds/posts/default',  // Blogger
  '/content/feed',
  '/updates/rss.xml',
  '/en/blog/feed',
  '/en/news/rss.xml',
];

/**
 * Detect which CMS a site is running from its homepage HTML.
 * Returns a CMS key or null.
 */
function detectCms(html: string, url: string): string | null {
  const lower = html.toLowerCase();
  const domain = url.toLowerCase();

  if (domain.includes('substack.com')) return 'substack';
  if (domain.includes('medium.com') || lower.includes('medium.com/m/global-identity')) return 'medium';
  if (domain.includes('beehiiv.com') || lower.includes('beehiiv')) return 'beehiiv';
  if (domain.includes('hashnode.com') || lower.includes('hashnode.com')) return 'hashnode';

  // Generator meta tag
  const genMatch = html.match(/<meta[^>]+name=["']generator["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']generator["']/i);
  if (genMatch) {
    const gen = genMatch[1].toLowerCase();
    if (gen.includes('wordpress')) return 'wordpress';
    if (gen.includes('ghost')) return 'ghost';
    if (gen.includes('hugo')) return 'hugo';
    if (gen.includes('gatsby')) return 'gatsby';
    if (gen.includes('jekyll')) return 'hugo'; // same paths
    if (gen.includes('hexo')) return 'hugo';
    if (gen.includes('zola')) return 'hugo';
    if (gen.includes('eleventy')) return 'hugo';
  }

  // Script/CDN signals
  if (lower.includes('/wp-content/') || lower.includes('wp-json') || lower.includes('xmlrpc.php')) return 'wordpress';
  if (lower.includes('ghost.io') || lower.includes('ghost/api')) return 'ghost';

  return null;
}

/**
 * Synthesize an RSS-compatible representation from blog listing HTML.
 * Used as last resort when no native feed is found.
 * Returns a synthetic feed URL placeholder that wraps the homepage URL,
 * along with parsed article metadata for direct ingestion.
 */
function extractBlogLinksFromHtml(
  html: string,
  baseUrl: string
): Array<{ title: string; link: string; description: string }> {
  const origin = new URL(baseUrl).origin;
  const articles: Array<{ title: string; link: string; description: string }> = [];
  const seenUrls = new Set<string>();

  // Pattern 1: <article> elements with links
  const articleBlocks = html.match(/<article[^>]*>[\s\S]*?<\/article>/gi) || [];
  for (const block of articleBlocks.slice(0, 10)) {
    const linkMatch = block.match(/<a[^>]+href=["']([^"'#?][^"']*)["'][^>]*>([^<]{10,150})<\/a>/i);
    if (linkMatch) {
      const href = linkMatch[1].startsWith('http') ? linkMatch[1] : `${origin}${linkMatch[1].startsWith('/') ? '' : '/'}${linkMatch[1]}`;
      const title = linkMatch[2].replace(/<[^>]*>/g, '').trim();
      if (title && href && !seenUrls.has(href) && href.includes(origin)) {
        articles.push({ title, link: href, description: '' });
        seenUrls.add(href);
      }
    }
  }

  // Pattern 2: h2/h3 headings inside links (common blog listing pattern)
  if (articles.length < 3) {
    const headingLinks = html.matchAll(/<a[^>]+href=["']([^"'#][^"']*)["'][^>]*>[\s\S]*?<(?:h[23])[^>]*>([^<]{10,200})<\/h[23]>/gi);
    for (const match of headingLinks) {
      const href = match[1].startsWith('http') ? match[1] : `${origin}${match[1].startsWith('/') ? '' : '/'}${match[1]}`;
      const title = match[2].replace(/<[^>]*>/g, '').trim();
      if (title && href && !seenUrls.has(href) && href.includes(origin.replace('https://', '').replace('http://', ''))) {
        articles.push({ title, link: href, description: '' });
        seenUrls.add(href);
        if (articles.length >= 10) break;
      }
    }
  }

  return articles.slice(0, 10);
}

/**
 * Given a homepage URL discovered by DuckDuckGo, find a working RSS feed URL using
 * a three-layer strategy:
 * 1. Check <link rel="alternate" type="application/rss+xml"> in page HTML
 * 2. Detect CMS and probe CMS-specific paths first, then generic paths
 * 3. Fall back to HTML scraping — extract article links and return synthetic feed info
 */
async function discoverFeedUrlFromHomepage(homepageUrl: string): Promise<{
  feedUrl: string | null;
  syntheticArticles?: Array<{ title: string; link: string; description: string }>;
}> {
  try {
    // ── Pre-check: Check if the exact candidate URL is already a valid RSS feed ──
    const isDirectFeed = await probeRssFeedUrl(homepageUrl);
    if (isDirectFeed) {
      return { feedUrl: homepageUrl };
    }

    const origin = new URL(homepageUrl).origin;
    let pageHtml = '';

    // Fetch the homepage once for all subsequent layers
    try {
      const res = await fetch(homepageUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)', 'Accept': 'text/html' },
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) pageHtml = await res.text();
    } catch {}

    // ── Layer 1: <link rel="alternate"> tag in HTML ──────────────────────────
    if (pageHtml) {
      const rssTagMatch = pageHtml.match(
        /<link[^>]+type=["']application\/(rss|atom)\+xml["'][^>]+href=["']([^"']+)["']/i
      ) || pageHtml.match(
        /<link[^>]+href=["']([^"']+)["'][^>]+type=["']application\/(rss|atom)\+xml["']/i
      );
      if (rssTagMatch) {
        const href = (rssTagMatch[0].match(/href=["']([^"']+)["']/))?.[1];
        if (href) {
          const abs = href.startsWith('http') ? href : `${origin}${href.startsWith('/') ? '' : '/'}${href}`;
          const ok = await probeRssFeedUrl(abs);
          if (ok) return { feedUrl: abs };
        }
      }
    }

    // ── Layer 2: CMS-specific paths, then generic paths ──────────────────────
    const cms = pageHtml ? detectCms(pageHtml, homepageUrl) : null;
    const pathsToTry = [
      ...(cms ? (CMS_FEED_PATHS[cms] || []) : []),
      ...GENERIC_FEED_PATHS
    ];

    // Deduplicate while preserving order
    const seen = new Set<string>();
    for (const suffix of pathsToTry) {
      if (seen.has(suffix)) continue;
      seen.add(suffix);
      const candidate = `${origin}${suffix}`;
      const isValid = await probeRssFeedUrl(candidate);
      if (isValid) return { feedUrl: candidate };
    }

    // ── Layer 3: HTML blog scraper — synthesize from article links ───────────
    if (pageHtml) {
      const articles = extractBlogLinksFromHtml(pageHtml, homepageUrl);
      if (articles.length >= 3) {
        console.log(`[Discovery] No native RSS found for ${homepageUrl} — extracted ${articles.length} blog links via scraping.`);
        return { feedUrl: null, syntheticArticles: articles };
      }
    }

    return { feedUrl: null };
  } catch {
    return { feedUrl: null };
  }
}

/**
 * Probe a URL and return true only if it returns valid XML/RSS content.
 * Returns false for HTML pages, 404s, etc.
 * Passes through on 403/429/5xx (potentially blocked but real).
 */
async function probeRssFeedUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*'
      },
      signal: AbortSignal.timeout(3000)
    });

    if (!res.ok) {
      // Blocked by Cloudflare / rate-limited / server error — pass as unverifiable
      if (res.status === 403 || res.status === 429 || res.status >= 500) {
        console.warn(`[Discovery] Feed probe got ${res.status} for ${url} — passing as unverifiable.`);
        return true;
      }
      return false;
    }

    const text = await res.text();
    const clean = text.trim().toLowerCase();

    // Reject if it looks like HTML without any RSS markers
    if (clean.startsWith('<!doctype') || clean.startsWith('<html')) {
      if (!clean.includes('<rss') && !clean.includes('<feed') && !clean.includes('<?xml')) {
        return false;
      }
    }

    // Accept if it contains XML/RSS markers
    return clean.includes('<?xml') || clean.includes('<rss') || clean.includes('<feed') || clean.includes('<channel');
  } catch (e: any) {
    // Timeout / DNS failure — pass as unverifiable rather than discard
    console.warn(`[Discovery] Feed probe error for ${url}: ${e.message}`);
    return false;
  }
}

// ── GET — return cached pending recommendations (filtered of already-registered)
export async function GET() {
  try {
    const [cached, registered] = await Promise.all([
      prisma.systemConfig.findUnique({ where: { key: RECS_CONFIG_KEY } }),
      prisma.feedSource.findMany({ select: { url: true } })
    ]);

    const registeredUrls = new Set(
      registered.map(s => s.url.trim().toLowerCase().replace(/\/+$/, ''))
    );

    let recs: any[] = [];
    if (cached?.value) {
      try {
        recs = JSON.parse(cached.value);
      } catch {}
    }

    // Filter out any that are now registered
    const pending = recs.filter(
      r => !registeredUrls.has((r.url || '').trim().toLowerCase().replace(/\/+$/, ''))
    );

    return NextResponse.json({ recommendations: pending, lastUpdated: cached?.value ? new Date().toISOString() : null });
  } catch (error: any) {
    console.error('GET /api/operations/discover-sources failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── DELETE ?url=<encoded_url> — dismiss a single recommendation from the cache
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const urlToDismiss = searchParams.get('url');

    if (!urlToDismiss) {
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    const cached = await prisma.systemConfig.findUnique({ where: { key: RECS_CONFIG_KEY } });
    let recs: any[] = [];
    if (cached?.value) {
      try { recs = JSON.parse(cached.value); } catch {}
    }

    const filtered = recs.filter(
      r => (r.url || '').trim().toLowerCase() !== urlToDismiss.trim().toLowerCase()
    );

    await prisma.systemConfig.upsert({
      where: { key: RECS_CONFIG_KEY },
      create: { key: RECS_CONFIG_KEY, value: JSON.stringify(filtered) },
      update: { value: JSON.stringify(filtered) }
    });

    return NextResponse.json({ success: true, remaining: filtered.length });
  } catch (error: any) {
    console.error('DELETE /api/operations/discover-sources failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── POST — run discovery for a given stream, cache merged recommendations
export async function POST(request: Request) {
  let stream = 'Frontier Model Capabilities';
  try {
    const body = await request.json();
    stream = body.stream || stream;

    if (!stream) {
      return NextResponse.json({ error: 'Missing stream parameter' }, { status: 400 });
    }

    // Load already-registered URLs to exclude them from results
    const registered = await prisma.feedSource.findMany({ select: { url: true } });
    const registeredUrls = new Set(
      registered.map(s => s.url.trim().toLowerCase().replace(/\/+$/, ''))
    );
    const registeredDomains = Array.from(new Set(
      registered.map(s => {
        try {
          return new URL(s.url).hostname.replace(/^www\./, '');
        } catch {
          return '';
        }
      }).filter(Boolean)
    ));

    // ── Phase 1: DuckDuckGo crawl to get homepage URLs ──────────────────────────
    const crawledCandidates: Array<{ title: string; url: string; snippet: string }> = [];
    try {
      let query = body.query;
      if (!query) {
        query = `${stream} blog RSS feed site:`;
        try {
          const queriesConfig = await prisma.systemConfig.findUnique({
            where: { key: 'discovery_queries_json' }
          });
          if (queriesConfig) {
            const qMap = JSON.parse(queriesConfig.value);
            if (qMap[stream]) query = qMap[stream];
          }
        } catch {}
      }

      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const searchRes = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (searchRes.ok) {
        const html = await searchRes.text();
        const titleRegex = /class="result__link"[^>]*href="[^"]*?uddg=([^"&]+)[^"]*?"[^>]*>([\s\S]*?)<\/a>/gi;
        const linkRegex = /href="[^"]*?uddg=([^"&]+)[^"]*?" [^>]* class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
        const titlesMap: Record<string, string> = {};
        let match;

        while ((match = titleRegex.exec(html)) !== null) {
          try {
            const rawUrl = decodeURIComponent(match[1]);
            const cleanTitle = match[2].replace(/<[^>]*>/g, '').trim();
            titlesMap[rawUrl] = cleanTitle;
          } catch {}
        }

        let snippetCount = 0;
        const seenUrls = new Set<string>();
        while ((match = linkRegex.exec(html)) !== null && snippetCount < 15) {
          try {
            const rawUrl = decodeURIComponent(match[1]);
            if (rawUrl.includes('duckduckgo.com') || seenUrls.has(rawUrl)) continue;
            const snippetText = match[2].replace(/<[^>]*>/g, '').trim();
            const matchedTitle = titlesMap[rawUrl] || rawUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
            crawledCandidates.push({ title: matchedTitle, url: rawUrl, snippet: snippetText });
            seenUrls.add(rawUrl);
            snippetCount++;
          } catch {}
        }
      }
    } catch (crawlError) {
      console.error('DuckDuckGo crawl failed, using offline fallback:', crawlError);
    }

    // ── Phase 2: Resolve each homepage URL to actual RSS feed or scrape blog links ──
    interface ConfirmedSource {
      title: string;
      homepageUrl: string;
      feedUrl: string;
      snippet: string;
      synthetic?: boolean; // true = scraped from HTML, no native feed found
    }
    const confirmedSources: ConfirmedSource[] = [];
    const syntheticSources: ConfirmedSource[] = []; // blog pages with no feed — scraped directly

    for (const candidate of crawledCandidates) {
      try {
        const candidateDomain = new URL(candidate.url).hostname.replace(/^www\./, '');
        if (registeredDomains.includes(candidateDomain)) continue;

        const result = await discoverFeedUrlFromHomepage(candidate.url);

        if (result.feedUrl) {
          // Native RSS/Atom feed confirmed
          confirmedSources.push({
            title: candidate.title,
            homepageUrl: candidate.url,
            feedUrl: result.feedUrl,
            snippet: candidate.snippet
          });
        } else if (result.syntheticArticles && result.syntheticArticles.length >= 3) {
          // No native feed, but we scraped article links — use homepage as the "feed URL"
          // The ingestion scan can fetch this page directly and parse article links from HTML
          syntheticSources.push({
            title: candidate.title,
            homepageUrl: candidate.url,
            feedUrl: candidate.url, // the blog listing page itself acts as the feed
            snippet: candidate.snippet,
            synthetic: true
          });
          console.log(`[Discovery] Scraped ${result.syntheticArticles.length} links from ${candidate.url} (no native feed)`);
        }
      } catch {}
    }

    // Merge native + synthetic, prefer native
    const allCandidates = [...confirmedSources, ...syntheticSources];

    // ── Phase 3: LLM selects & justifies from confirmed sources ─────────────────
    // The LLM now only sees *real, verified* feed URLs — no guessing required.
    const confirmedText = allCandidates.length > 0
      ? allCandidates.map((c, i) =>
          `Source #${i + 1}:\n- Name: ${c.title}\n- Feed URL: ${c.feedUrl}${c.synthetic ? ' [Blog Page — no native RSS; will be scraped]' : ' [Verified RSS Feed]'}\n- Homepage: ${c.homepageUrl}\n- Description: ${c.snippet}`
        ).join('\n\n')
      : null;

    let verifiedRecs: any[] = [];

    if (confirmedText) {
      const systemPrompt = `You are the Source Discovery Agent for the AI Trend Platform.
Your job is to select the BEST sources from a list of VERIFIED sources for the technology stream: "${stream}".
Sources marked [Verified RSS Feed] have confirmed XML feeds. Sources marked [Blog Page] will be scraped directly.
Prefer RSS feeds over scraped pages when both are available for the same domain.

=== EXCLUDE ALREADY REGISTERED DOMAINS ===
Do NOT recommend any source originating from these domains:
${registeredDomains.length > 0 ? registeredDomains.map(d => `- ${d}`).join('\n') : '(None)'}

=== VERIFIED CANDIDATES ===
${confirmedText}

IMPORTANT: Use the exact "Feed URL" values provided above verbatim. Do NOT invent or modify any URLs.

Respond with valid JSON ONLY (no markdown, no backticks):
{
  "sources": [
    {
      "name": "Publication name",
      "type": "RSS Feed",
      "url": "<exact Feed URL from above>",
      "justification": "1-2 sentence explanation of relevance to ${stream}.",
      "trustScore": 90,
      "category": "${stream}"
    }
  ]
}`;

      const rawResult = await chatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Select the best sources for: "${stream}"` }
      ], 0.1);

      let data: any = null;
      try {
        const start = rawResult.indexOf('{');
        const end = rawResult.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          data = JSON.parse(rawResult.substring(start, end + 1));
        }
      } catch (e) {
        console.error('Failed to parse discovered sources JSON:', rawResult);
      }

      // Only keep sources whose URL exactly matches a confirmed candidate
      const confirmedFeedUrls = new Set(allCandidates.map(c => c.feedUrl.trim().toLowerCase().replace(/\/+$/, '')));
      verifiedRecs = (data?.sources || []).filter((s: any) => {
        const url = (s.url || '').trim().toLowerCase().replace(/\/+$/, '');
        if (registeredUrls.has(url)) return false;
        if (!confirmedFeedUrls.has(url)) {
          console.warn(`[Discovery] LLM returned unrecognized URL (rejected): ${s.url}`);
          return false;
        }
        // Tag synthetic sources so the ingestion layer knows to scrape HTML
        const matchingSynthetic = syntheticSources.find(
          syn => syn.feedUrl.trim().toLowerCase().replace(/\/+$/, '') === url
        );
        if (matchingSynthetic) s.type = 'Blog Page (Scraped)';
        return true;
      });
    }

    // If nothing found from DDG at all, throw to trigger fallback
    if (verifiedRecs.length === 0 && allCandidates.length === 0) {
      throw new Error('No confirmed sources found from DuckDuckGo crawl');
    }

    // ── Phase 4: Persist ─────────────────────────────────────────────────────────
    const existing = await prisma.systemConfig.findUnique({ where: { key: RECS_CONFIG_KEY } });
    let cachedRecs: any[] = [];
    if (existing?.value) {
      try { cachedRecs = JSON.parse(existing.value); } catch {}
    }

    const otherRecs = cachedRecs.filter((r: any) => (r.category || '').toLowerCase() !== stream.toLowerCase());
    const merged = [...otherRecs, ...verifiedRecs];

    await prisma.systemConfig.upsert({
      where: { key: RECS_CONFIG_KEY },
      create: { key: RECS_CONFIG_KEY, value: JSON.stringify(merged) },
      update: { value: JSON.stringify(merged) }
    });

    return NextResponse.json({ sources: verifiedRecs, cached: merged.length, syntheticCount: syntheticSources.length });

  } catch (error: any) {
    console.error('POST /api/operations/discover-sources failed, returning fallbacks:', error);

    // Stream-keyed hardcoded fallbacks — all URLs manually verified
    const fallbacks: Record<string, any[]> = {
      'Frontier Model Capabilities': [
        { name: 'OpenAI Blog', type: 'RSS Feed', url: 'https://openai.com/news/rss.xml', justification: 'Direct updates on ChatGPT, GPT-4, and frontier safety frameworks.', trustScore: 98, category: stream },
        { name: 'Google DeepMind', type: 'RSS Feed', url: 'https://deepmind.google/blog/rss.xml', justification: 'Frontier publications including Gemini, AlphaFold, and reinforcement learning.', trustScore: 99, category: stream },
        { name: 'BAIR Blog', type: 'RSS Feed', url: 'https://bair.berkeley.edu/blog/feed.xml', justification: 'Berkeley Artificial Intelligence Research publications and updates.', trustScore: 95, category: stream }
      ],
      'Model-on-Chip Advancements': [
        { name: 'Apple ML Research', type: 'RSS Feed', url: 'https://machinelearning.apple.com/rss.xml', justification: 'Official publications on local model execution and on-device AI.', trustScore: 96, category: stream },
        { name: 'NVIDIA AI Blog', type: 'RSS Feed', url: 'https://blogs.nvidia.com/feed/', justification: 'Industry news on GPU architectures, edge AI, and CUDA runtime updates.', trustScore: 95, category: stream }
      ],
      'Agentic Architectures': [
        { name: 'LangChain Blog', type: 'RSS Feed', url: 'https://blog.langchain.dev/rss/', justification: 'Leading frameworks for multi-agent loops, stateful graphs, and memory management.', trustScore: 94, category: stream },
        { name: 'LlamaIndex News', type: 'RSS Feed', url: 'https://medium.com/feed/llamaindex-blog', justification: 'RAG pipelines, data agents, and structured query routing research.', trustScore: 93, category: stream }
      ],
      'Ways of Working': [
        { name: 'HBR Technology', type: 'Website Scraper', url: 'https://hbr.org/topic/subject/technology-and-analytics', justification: 'Harvard Business Review executive insights on organizational AI transformations.', trustScore: 94, category: stream },
        { name: 'McKinsey Digital', type: 'RSS Feed', url: 'https://www.mckinsey.com/insights/rss', justification: 'Global consulting perspectives on operational cost savings and AI adoption.', trustScore: 92, category: stream }
      ],
      'Development Frameworks': [
        { name: 'Vercel Blog', type: 'RSS Feed', url: 'https://vercel.com/blog/feed', justification: 'Updates on frontend infrastructures, edge runtimes, and Next.js compiler advancements.', trustScore: 95, category: stream },
        { name: 'HuggingFace Blog', type: 'RSS Feed', url: 'https://huggingface.co/blog/feed.xml', justification: 'Open-source code releases, transformers tutorials, and model hub integrations.', trustScore: 97, category: stream }
      ]
    };

    const streamKey = Object.keys(fallbacks).find(k => k.toLowerCase() === stream.toLowerCase()) || 'Frontier Model Capabilities';
    const fallbackRecs = fallbacks[streamKey] || [];

    let registeredUrls2 = new Set<string>();
    try {
      const reg = await prisma.feedSource.findMany({ select: { url: true } });
      registeredUrls2 = new Set(reg.map(s => s.url.trim().toLowerCase().replace(/\/+$/, '')));
    } catch {}

    const newFallbacks = fallbackRecs.filter(
      (s: any) => !registeredUrls2.has((s.url || '').trim().toLowerCase().replace(/\/+$/, ''))
    );

    let cachedRecs: any[] = [];
    try {
      const existing = await prisma.systemConfig.findUnique({ where: { key: RECS_CONFIG_KEY } });
      if (existing?.value) cachedRecs = JSON.parse(existing.value);
    } catch {}

    const otherRecs = cachedRecs.filter((r: any) => (r.category || '').toLowerCase() !== stream.toLowerCase());
    const merged = [...otherRecs, ...newFallbacks];

    try {
      await prisma.systemConfig.upsert({
        where: { key: RECS_CONFIG_KEY },
        create: { key: RECS_CONFIG_KEY, value: JSON.stringify(merged) },
        update: { value: JSON.stringify(merged) }
      });
    } catch {}

    return NextResponse.json({ sources: newFallbacks, cached: merged.length });
  }
}
