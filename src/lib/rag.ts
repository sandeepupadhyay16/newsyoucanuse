import { prisma } from './db';
import { embedText } from './llm';
import { Prisma } from '@prisma/client';

export interface SemanticProjectResult {
  id: string;
  title: string;
  problemStatement: string;
  integrations: string[];
  phase: string;
  readinessScore: number;
  therapeuticAreas: string[];
  functionalDomains: string[];
  similarity: number;
}

export interface SemanticExpertResult {
  id: string;
  name: string;
  title: string;
  organization: string;
  availability: string;
  competencies: string[];
  email: string;
  teamsId: string;
  similarity: number;
}

export interface RAGQueryResult {
  projects: SemanticProjectResult[];
  experts: SemanticExpertResult[];
}

export async function searchPortfolio(query: string, limit = 5): Promise<RAGQueryResult> {
  try {
    const embedding = await embedText(query);
    const embeddingStr = `[${embedding.join(',')}]`;

    // Query similar projects (using safe Prisma.sql template tags)
    const matchedProjects = await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT p.id, p.title, p."problemStatement", p.integrations, p.phase, p."readinessScore", 
             p."therapeuticAreas", p."functionalDomains",
             1 - (pe.embedding <=> ${embeddingStr}::vector) as similarity
      FROM "Project" p
      JOIN "ProjectEmbedding" pe ON pe."projectId" = p.id
      ORDER BY similarity DESC
      LIMIT ${limit}
    `);

    // Query similar experts
    const matchedExperts = await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT e.id, e.name, e.title, e.organization, e.availability, e.competencies, e.email, e."teamsId",
             1 - (ee.embedding <=> ${embeddingStr}::vector) as similarity
      FROM "Expert" e
      JOIN "ExpertEmbedding" ee ON ee."expertId" = e.id
      ORDER BY similarity DESC
      LIMIT ${limit}
    `);

    return {
      projects: matchedProjects.map(p => ({
        id: p.id,
        title: p.title,
        problemStatement: p.problemStatement,
        integrations: Array.isArray(p.integrations) ? p.integrations : [],
        phase: p.phase,
        readinessScore: Number(p.readinessScore),
        therapeuticAreas: Array.isArray(p.therapeuticAreas) ? p.therapeuticAreas : [],
        functionalDomains: Array.isArray(p.functionalDomains) ? p.functionalDomains : [],
        similarity: Number(p.similarity)
      })),
      experts: matchedExperts.map(e => ({
        id: e.id,
        name: e.name,
        title: e.title,
        organization: e.organization,
        availability: e.availability,
        competencies: Array.isArray(e.competencies) ? e.competencies : [],
        email: e.email,
        teamsId: e.teamsId,
        similarity: Number(e.similarity)
      }))
    };
  } catch (error) {
    console.error('searchPortfolio error:', error);
    return { projects: [], experts: [] };
  }
}
