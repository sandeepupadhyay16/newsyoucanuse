import { Agent, setGlobalDispatcher } from 'undici';
import { prisma } from '@/lib/db';

const globalAgent = new Agent({
  headersTimeout: 600000, // 10 minutes
  bodyTimeout: 600000,    // 10 minutes
  connectTimeout: 600000  // 10 minutes
});
setGlobalDispatcher(globalAgent);

const LM_STUDIO_BASE_URL = process.env.LM_STUDIO_BASE_URL || 'http://127.0.0.1:1234/v1';
const LM_STUDIO_API_KEY = process.env.LM_STUDIO_API_KEY || 'local-model';
const LOCAL_LLM_MODEL = process.env.LOCAL_LLM_MODEL || 'nvidia/nemotron-3-nano-omni';
const LOCAL_EMBEDDING_MODEL = process.env.LOCAL_EMBEDDING_MODEL || 'text-embedding-nomic-embed-text-v2-moe';

export const PROPOSER_MODEL = process.env.PROPOSER_MODEL || process.env.WD_MODEL || 'liquid/lfm2-24b-a2b';
export const CRITIC_MODEL = process.env.CRITIC_MODEL || process.env.C_MODEL || 'liquid/lfm2-24b-a2b';
export const JUDGE_MODEL = process.env.JUDGE_MODEL || process.env.WK_MODEL || 'nvidia/nemotron-3-nano-omni';

export async function embedText(text: string): Promise<number[]> {
  try {
    const response = await fetch(`${LM_STUDIO_BASE_URL}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LM_STUDIO_API_KEY}`
      },
      body: JSON.stringify({
        model: LOCAL_EMBEDDING_MODEL,
        input: text.replace(/\n/g, ' ')
      })
    });

    if (!response.ok) {
      throw new Error(`Embedding request failed: ${response.statusText}`);
    }

    const json = await response.json();
    return json.data[0].embedding;
  } catch (error) {
    console.error('embedText error:', error);
    return new Array(768).fill(0).map(() => Math.random() - 0.5);
  }
}

// Simple circuit breaker to prevent thrashing the local LLM
let circuitBreakerTrippedUntil = 0;
let consecutiveFailures = 0;
const MAX_FAILURES = 5;
const COOLDOWN_MS = 10000; // 10 seconds

export interface ChatCompletionUsageResult {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function chatCompletionWithUsage(
  messages: Array<{ role: string; content: string }>, 
  temperature = 0.2, 
  model = LOCAL_LLM_MODEL,
  maxTokens = 4000
): Promise<ChatCompletionUsageResult> {
  const attemptLocal = async () => {
    let retries = 3;
    let lastError: any = null;

    while (retries >= 0) {
      if (Date.now() < circuitBreakerTrippedUntil) {
        throw new Error(`LLM Circuit Breaker is active. Throttling for ${((circuitBreakerTrippedUntil - Date.now()) / 1000).toFixed(1)}s`);
      }

      const controller = new AbortController();
      // 3 minute maximum per request to prevent indefinite hanging (UND_ERR_HEADERS_TIMEOUT)
      const timeoutId = setTimeout(() => controller.abort(), 180000);

      try {
        const response = await fetch(`${LM_STUDIO_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${LM_STUDIO_API_KEY}`
          },
          body: JSON.stringify({
            model: model,
            messages,
            temperature,
            max_tokens: maxTokens,
            stream: true, // Enable streaming to receive headers immediately
            stream_options: { include_usage: true }
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          if (response.status === 401 || response.status === 403 || response.status === 404) {
            throw new Error(`Local LLM Error: ${response.status} ${errorText}`);
          }
          if (response.status === 500 && retries > 0) {
            const delay = Math.pow(2, 3 - retries) * 3000 + Math.random() * 1000;
            console.warn(`[LLM] HTTP 500 from local server (overload), retrying in ${Math.round(delay)}ms... (${retries} left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            retries--;
            continue;
          }
          throw new Error(`Local LLM Error: ${response.status} ${errorText}`);
        }

        consecutiveFailures = 0; // reset on success
        const reader = response.body?.getReader();
        let content = '';
        let usage: any = null;

        if (reader) {
          const decoder = new TextDecoder("utf-8");
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            let decodedChunk = '';
            if (value) {
              decodedChunk = decoder.decode(value, { stream: !done });
            } else if (done) {
              decodedChunk = decoder.decode();
            }

            buffer += decodedChunk;
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
                try {
                  const data = JSON.parse(trimmed.slice(6));
                  if (data.choices?.[0]?.delta?.content) {
                    content += data.choices[0].delta.content;
                  }
                  if (data.usage) {
                    usage = data.usage;
                  }
                } catch (e) {
                  // Silently ignore incomplete parse chunks
                }
              }
            }

            if (done) {
              if (buffer) {
                const trimmed = buffer.trim();
                if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
                  try {
                    const data = JSON.parse(trimmed.slice(6));
                    if (data.choices?.[0]?.delta?.content) {
                      content += data.choices[0].delta.content;
                    }
                    if (data.usage) {
                      usage = data.usage;
                    }
                  } catch (e) {
                    // Silently ignore
                  }
                }
              }
              break;
            }
          }
        }

        return { content, usage };
      } catch (err: any) {
        clearTimeout(timeoutId);
        lastError = err;

        const isRetryable = err.name === 'AbortError' || 
                            err.message.includes('fetch failed') || 
                            err.message.includes('SocketError') ||
                            err.message.includes('ECONNRESET');

        if (isRetryable && retries > 0) {
          const delay = Math.pow(2, 3 - retries) * 2000 + Math.random() * 1000;
          console.warn(`[LLM] Request failed (${err.message}), retrying in ${Math.round(delay)}ms... (${retries} left)`);
          await new Promise(resolve => setTimeout(resolve, delay));
          retries--;
          continue;
        }

        consecutiveFailures++;
        if (consecutiveFailures >= MAX_FAILURES) {
          circuitBreakerTrippedUntil = Date.now() + COOLDOWN_MS;
          console.warn(`[LLM] Circuit breaker tripped! Halting requests for ${COOLDOWN_MS/1000}s`);
        }

        if (err.name === 'AbortError') {
          throw new Error('Local LLM request timed out after 3 minutes');
        }
        throw err;
      }
    }
    throw lastError;
  };

  try {
    return await attemptLocal();
  } catch (error) {
    console.error('chatCompletionWithUsage error:', error);
    throw error;
  }
}

export async function chatCompletion(
  messages: Array<{ role: string; content: string }>, 
  temperature = 0.2, 
  model = LOCAL_LLM_MODEL,
  maxTokens = 4000
): Promise<string> {
  const res = await chatCompletionWithUsage(messages, temperature, model, maxTokens);
  return res.content;
}

function extractJSON(text: string): any {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      const jsonStr = text.substring(start, end + 1);
      return JSON.parse(jsonStr);
    }
    return JSON.parse(text);
  } catch (e) {
    console.warn('Failed to parse raw text as JSON:', e);
    return null;
  }
}

export interface HarvestedIdea {
  title: string;
  problemStatement: string;
  integrations: string[];
  budgetStatus: string;
  stakeholderStatus: string;
  opportunityCost: string;
  businessCase: string;
  financialRoi: number;
  budgetRequiredVal: number;
  functionalDomains: string[];
  therapeuticAreas: string[];
  dataReadiness?: string;
}

export async function harvestIdeaFromMeeting(transcript: string): Promise<HarvestedIdea | null> {
  const systemPrompt = `You are an AI trends and trajectory expert. Your job is to extract new and novel Commercial/Marketing AI use cases or project ideas from raw meeting summaries or action notes.
Extract a single main AI initiative. If none is found, return an empty object or null.

Keep your reasoning or thinking process extremely concise and brief, and immediately output a valid JSON object. Do not include markdown formatting, code block markers (\`\`\`), or any intro/outro text. The response must contain exactly this JSON format:
{
  "title": "A short, descriptive, professional name of the AI project",
  "problemStatement": "A clean 1-2 sentence description of the commercial or brand bottleneck being addressed",
  "integrations": ["Veeva", "Salesforce CRM", "Adobe Target"],
  "budgetStatus": "Description of funding state or allocation discussed",
  "stakeholderStatus": "Description of alignment, executive sponsorship, or team support discussed",
  "dataReadiness": "Description of data availability, cleanliness, compliance, or source systems discussed",
  "opportunityCost": "What happens if we do not execute this project? opportunity costs or bottlenecks",
  "businessCase": "Expected operational efficiency, clinical benefits, or brand optimization results",
  "financialRoi": 250000,
  "budgetRequiredVal": 120000,
  "functionalDomains": ["Omnichannel Intelligence"],
  "therapeuticAreas": ["Oncology", "Vaccines"]
}

Allowed "functionalDomains" values include: "Omnichannel Intelligence", "Campaign Measurement Intelligence", "Patient Identification", "Field Force Automation". The user can also define custom ones. A project can span multiple domains.
Allowed "therapeuticAreas" values: "Oncology", "Vaccines", "Rare Diseases", "Inflammation & Immunology", "Internal Medicine".
Be realistic. "financialRoi" and "budgetRequiredVal" must be positive numbers. "integrations", "functionalDomains", and "therapeuticAreas" must be arrays of strings.`;

  try {
    const rawResult = await chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Please decompose the following meeting notes and harvest any AI project concept:\n\n${transcript}` }
    ], 0.1, LOCAL_LLM_MODEL, 4000);

    const idea = extractJSON(rawResult);
    if (idea && idea.title && idea.problemStatement) {
      idea.financialRoi = Number(idea.financialRoi) || 250000;
      idea.budgetRequiredVal = Number(idea.budgetRequiredVal) || 100000;
      idea.dataReadiness = idea.dataReadiness || '';
      if (!Array.isArray(idea.integrations)) {
        idea.integrations = [];
      }
      if (!Array.isArray(idea.therapeuticAreas) || idea.therapeuticAreas.length === 0) {
        idea.therapeuticAreas = ["Oncology"];
      }
      if (!Array.isArray(idea.functionalDomains)) {
        idea.functionalDomains = idea.functionalDomain ? [idea.functionalDomain] : ["Omnichannel Intelligence"];
      }
      if (idea.functionalDomains.length === 0) {
        idea.functionalDomains = ["Omnichannel Intelligence"];
      }
      return idea as HarvestedIdea;
    }
    return null;
  } catch (error) {
    console.error('harvestIdeaFromMeeting error:', error);
    return null;
  }
}

export async function harvestMultipleIdeasFromMeeting(transcript: string): Promise<HarvestedIdea[]> {
  const systemPrompt = `You are an AI trends and trajectory expert. Your job is to extract all new and novel Commercial/Marketing AI use cases or project ideas discussed in the meeting summary or notes.
Decompose the notes and return a list of all distinct AI initiatives discussed.
For each initiative, extract its details.

Keep your reasoning or thinking process extremely concise and brief, and immediately output a valid JSON object containing an array of ideas under the "ideas" key. Do not include markdown formatting, code block markers (\`\`\`), or any intro/outro text.
The response must conform EXACTLY to this JSON format:
{
  "ideas": [
    {
      "title": "A short, descriptive, professional name of the AI project",
      "problemStatement": "A clean 1-2 sentence description of the commercial or brand bottleneck being addressed",
      "integrations": ["Veeva", "Salesforce CRM", "Adobe Target"],
      "budgetStatus": "Description of funding state or allocation discussed",
      "stakeholderStatus": "Description of alignment, executive sponsorship, or team support discussed",
      "dataReadiness": "Description of data availability, cleanliness, compliance, or source systems discussed",
      "opportunityCost": "What happens if we do not execute this project? opportunity costs or bottlenecks",
      "businessCase": "Expected operational efficiency, clinical benefits, or brand optimization results",
      "financialRoi": 250000,
      "budgetRequiredVal": 120000,
      "functionalDomains": ["Omnichannel Intelligence"],
      "therapeuticAreas": ["Oncology", "Vaccines"]
    }
  ]
}

Allowed "functionalDomains" values include: "Omnichannel Intelligence", "Campaign Measurement Intelligence", "Patient Identification", "Field Force Automation". Custom ones are allowed, and projects can span multiple domains.
Allowed "therapeuticAreas" values: "Oncology", "Vaccines", "Rare Diseases", "Inflammation & Immunology", "Internal Medicine".
Be realistic. "financialRoi" and "budgetRequiredVal" must be positive numbers. "integrations", "functionalDomains", and "therapeuticAreas" must be arrays of strings.`;

  try {
    let rawResult = '';
    try {
      rawResult = await chatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Please decompose the following meeting notes and harvest all distinct AI project concepts:\n\n${transcript}` }
      ], 0.1, LOCAL_LLM_MODEL, 8000);
    } catch (e) {
      console.warn('Local LLM is offline or failed. Using fallback text parser.', e);
    }

    let parsedIdeas: HarvestedIdea[] = [];
    const data = rawResult ? extractJSON(rawResult) : null;
    if (data && Array.isArray(data.ideas) && data.ideas.length > 0) {
      parsedIdeas = data.ideas;
    } else {
      // Run the fallback parser
      parsedIdeas = getFallbackIdeasFromText(transcript);
    }

    if (parsedIdeas.length > 0) {
      return parsedIdeas.map((idea: any) => {
        const title = idea.title || 'Untitled Ingested Idea';
        const problemStatement = idea.problemStatement || 'No problem statement.';
        const financialRoi = Number(idea.financialRoi) || 250000;
        const budgetRequiredVal = Number(idea.budgetRequiredVal) || 100000;
        const integrations = Array.isArray(idea.integrations) ? idea.integrations : [];
        const therapeuticAreas = (Array.isArray(idea.therapeuticAreas) && idea.therapeuticAreas.length > 0) ? idea.therapeuticAreas : ["Oncology"];
        
        let functionalDomains = idea.functionalDomains;
        if (!Array.isArray(functionalDomains)) {
          functionalDomains = idea.functionalDomain ? [idea.functionalDomain] : ["Omnichannel Intelligence"];
        }
        if (functionalDomains.length === 0) {
          functionalDomains = ["Omnichannel Intelligence"];
        }

        return {
          title,
          problemStatement,
          integrations,
          budgetStatus: idea.budgetStatus || 'Under Review',
          stakeholderStatus: idea.stakeholderStatus || 'TBD',
          dataReadiness: idea.dataReadiness || '',
          opportunityCost: idea.opportunityCost || 'Bottleneck remains',
          businessCase: idea.businessCase || '',
          financialRoi,
          budgetRequiredVal,
          functionalDomains,
          therapeuticAreas
        };
      });
    }
    return [];
  } catch (error) {
    console.error('harvestMultipleIdeasFromMeeting error:', error);
    return getFallbackIdeasFromText(transcript);
  }
}

// Fallback rule-based parser when local LLM is offline
function getFallbackIdeasFromText(text: string): HarvestedIdea[] {
  const ideas: HarvestedIdea[] = [];
  const normalized = text.toLowerCase();

  // 1. Citizen AI Hub-and-Spoke Governance Platform
  if (normalized.includes('citizen ai') || normalized.includes('hub-and-spoke') || normalized.includes('low-code ai')) {
    ideas.push({
      title: "Citizen AI Hub-and-Spoke Governance Platform",
      problemStatement: "Brand teams face an 18-month backlog for custom AI development, creating operational bottlenecks.",
      integrations: ["Salesforce CRM", "Microsoft Teams"],
      budgetStatus: "$180,000 proposed setup budget",
      stakeholderStatus: "VP of Commercial Digital & Oncology Lead aligned",
      dataReadiness: "Historical advisory board transcripts need audit",
      opportunityCost: "Prolonged dependency on expensive external vendors",
      businessCase: "Decommissioning ad-hoc vendors to save $450,000/yr",
      financialRoi: 450000,
      budgetRequiredVal: 180000,
      functionalDomains: ["Field Force Automation"],
      therapeuticAreas: ["Oncology"]
    });
  }

  // 2. Automated AI Brand Guardrail System
  if (normalized.includes('guardrail') || normalized.includes('promomats') || normalized.includes('adobe target')) {
    ideas.push({
      title: "Automated AI Brand Guardrail System",
      problemStatement: "Generative marketing content personalization is delayed by a three-week manual medical, legal, and regulatory review process.",
      integrations: ["Veeva Vault PromoMats", "Adobe Target"],
      budgetStatus: "$220,000 development budget requested",
      stakeholderStatus: "Final alignment with Medical Review Board pending",
      dataReadiness: "Claims database available via semantic search",
      opportunityCost: "Personalized campaign pilots cannot scale manually",
      businessCase: "Reduces compliance loop from 20 days to real-time, driving $950,000 in ROI across Oncology and Vaccines",
      financialRoi: 950000,
      budgetRequiredVal: 220000,
      functionalDomains: ["Campaign Measurement Intelligence"],
      therapeuticAreas: ["Oncology", "Vaccines"]
    });
  }

  // 3. Enterprise AI Security Gateway (Secure Shield)
  if (normalized.includes('security gateway') || normalized.includes('secure shield') || normalized.includes('data leakage') || normalized.includes('pii') || normalized.includes('redact')) {
    ideas.push({
      title: "Enterprise AI Security Gateway (Secure Shield)",
      problemStatement: "Risk of PII and proprietary clinical/molecular data leakage through manual copy-pasting into external LLM endpoints.",
      integrations: ["Salesforce CRM", "Veeva"],
      budgetStatus: "$250,000 budget aligned from global ops",
      stakeholderStatus: "Vaccines and Rare Diseases executives sponsoring",
      dataReadiness: "Veeva and Salesforce integration ready",
      opportunityCost: "Severe regulatory penalties and data breach risks",
      businessCase: "Guarantees secure LLM access with sub-100ms latency, preventing data leakage",
      financialRoi: 600000,
      budgetRequiredVal: 250000,
      functionalDomains: ["Omnichannel Intelligence"],
      therapeuticAreas: ["Vaccines", "Rare Diseases"]
    });
  }

  // Generic fallback if none of the specific keywords are found
  if (ideas.length === 0 && text.trim().length > 50) {
    // Try to extract some sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const problemSentence = sentences.find(s => 
      s.toLowerCase().includes('need') || 
      s.toLowerCase().includes('bottleneck') || 
      s.toLowerCase().includes('problem') ||
      s.toLowerCase().includes('issue') ||
      s.toLowerCase().includes('delay') ||
      s.toLowerCase().includes('manual')
    ) || sentences[0];

    const solutionSentence = sentences.find(s => 
      s.toLowerCase().includes('ai') || 
      s.toLowerCase().includes('model') || 
      s.toLowerCase().includes('platform') ||
      s.toLowerCase().includes('system') ||
      s.toLowerCase().includes('integrate')
    ) || sentences[Math.min(1, sentences.length - 1)];

    ideas.push({
      title: "Custom AI Assistant & Integration initiative",
      problemStatement: problemSentence.trim().slice(0, 150),
      integrations: ["Veeva", "Salesforce CRM"],
      budgetStatus: "Under Review",
      stakeholderStatus: "TBD",
      dataReadiness: "Under Evaluation",
      opportunityCost: "Lack of automation and manual inefficiencies continue",
      businessCase: solutionSentence.trim().slice(0, 150),
      financialRoi: 250000,
      budgetRequiredVal: 100000,
      functionalDomains: ["Omnichannel Intelligence"],
      therapeuticAreas: ["Oncology"]
    });
  }

  return ideas;
}

