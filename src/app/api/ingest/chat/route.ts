import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { chatCompletion, embedText } from '@/lib/llm';

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
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'No chat history provided' }, { status: 400 });
    }

    const conversationStr = messages
      .filter(m => m.id !== 'welcome')
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const systemPrompt = `You are an AI trends and trajectory expert. Your job is to extract a commercial/marketing AI initiative or use case from the chat log.
You MUST return a valid JSON object. Do not include markdown formatting or code block markers (\`\`\`). The response must contain exactly this JSON format:
{
  "title": "A short, descriptive, professional name of the AI project",
  "problemStatement": "A clean 1-2 sentence description of the commercial or brand bottleneck being addressed",
  "integrations": ["Veeva", "Salesforce CRM"],
  "budgetStatus": "Funding status or allocation details discussed",
  "stakeholderStatus": "Sponsorship and stakeholder alignment details",
  "dataReadiness": "Description of data availability, cleanliness, compliance, or source systems discussed",
  "opportunityCost": "What happens if we do not do this project?",
  "businessCase": "Expected operational efficiency or savings",
  "financialRoi": 250000,
  "budgetRequiredVal": 120000,
  "functionalDomains": ["Omnichannel Intelligence"],
  "therapeuticAreas": ["Oncology", "Vaccines"]
}

Allowed "functionalDomains" values include: "Omnichannel Intelligence", "Campaign Measurement Intelligence", "Patient Identification", "Field Force Automation". Custom values are allowed, and projects can span multiple domains.
Allowed "therapeuticAreas" values: "Oncology", "Vaccines", "Rare Diseases", "Inflammation & Immunology", "Internal Medicine".
Be realistic. "financialRoi" and "budgetRequiredVal" must be positive numbers. "integrations" and "therapeuticAreas" must be arrays of strings.`;

    const rawResult = await chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Please extract the discussed AI use case from this conversation:\n\n${conversationStr}` }
    ], 0.1, undefined, 1000);

    const idea = extractJSON(rawResult);
    if (!idea || !idea.title || !idea.problemStatement) {
      return NextResponse.json({ error: 'Could not extract a valid AI project from the chat conversation. Please make sure you mention a title, problem, and solution approach.' }, { status: 400 });
    }

    // Standardize fields
    idea.financialRoi = Number(idea.financialRoi) || 200000;
    idea.budgetRequiredVal = Number(idea.budgetRequiredVal) || 80000;
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

    // Fetch system weights config (6 weights)
    const weightsConfig = await prisma.systemConfig.findUnique({ where: { key: 'weights' } });
    const w = weightsConfig && weightsConfig.value.split(',').length === 6
      ? weightsConfig.value.split(',').map(Number)
      : [0.16, 0.16, 0.17, 0.17, 0.17, 0.17];

    // Evaluate scores dynamically
    const budgetAvailabilityScore = idea.financialRoi > 400000 ? 90.0 : 75.0;
    const dataAvailabilityScore = (idea.dataReadiness && idea.dataReadiness.length > 20) || idea.integrations.length > 0 ? 85.0 : 65.0;
    const stakeholderReadinessScore = 80.0;
    const impactOfNotDoingScore = idea.opportunityCost.length > 20 ? 85.0 : 70.0;
    const financialBusinessCaseScore = idea.financialRoi > idea.budgetRequiredVal * 2 ? 90.0 : 75.0;
    const budgetRequiredScore = idea.budgetRequiredVal < 150000 ? 90.0 : 70.0;

    const readinessScore = 
      budgetAvailabilityScore * w[0] + 
      dataAvailabilityScore * w[1] + 
      stakeholderReadinessScore * w[2] + 
      impactOfNotDoingScore * w[3] + 
      financialBusinessCaseScore * w[4] + 
      budgetRequiredScore * w[5];

    // Create the project in Backlog
    const project = await prisma.project.create({
      data: {
        title: idea.title,
        problemStatement: idea.problemStatement,
        integrations: idea.integrations,
        budgetStatus: idea.budgetStatus || 'Under Review',
        stakeholderStatus: idea.stakeholderStatus || 'TBD',
        opportunityCost: idea.opportunityCost || 'Status quo bottleneck',
        businessCase: idea.businessCase,
        financialRoi: idea.financialRoi,
        budgetRequiredVal: idea.budgetRequiredVal,
        execSponsor: 'TBD',
        productOwner: 'TBD',
        deploymentGateway: '',
        phase: 'Backlog',
        therapeuticAreas: idea.therapeuticAreas,
        budgetAvailabilityScore,
        dataAvailabilityScore,
        stakeholderReadinessScore,
        impactOfNotDoingScore,
        financialBusinessCaseScore,
        budgetRequiredScore,
        readinessScore,
        functionalDomains: idea.functionalDomains,
        dataReadiness: idea.dataReadiness || ''
      }
    });

    // Generate vector embedding
    const embedTextStr = `${project.title} ${project.problemStatement} ${(project.integrations || []).join(' ')} ${(project.functionalDomains || []).join(' ')} ${(project.therapeuticAreas || []).join(' ')} ${project.dataReadiness || ''}`;
    const embedding = await embedText(embedTextStr);
    const embeddingStr = `[${embedding.join(',')}]`;

    await prisma.$executeRaw`
      INSERT INTO "ProjectEmbedding" ("id", "projectId", "embedding", "createdAt")
      VALUES (gen_random_uuid(), ${project.id}, ${embeddingStr}::vector, NOW())
    `;

    return NextResponse.json({
      success: true,
      project,
      message: `"${project.title}" successfully drafted and added to the Backlog!`
    });

  } catch (error: any) {
    console.error('API Ingest Chat failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
