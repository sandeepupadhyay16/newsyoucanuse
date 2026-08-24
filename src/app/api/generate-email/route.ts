import { NextResponse } from 'next/server';
import { chatCompletion } from '@/lib/llm';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionTitle, sessionDate, agendaItems } = body;

    if (!sessionTitle || !sessionDate || !agendaItems || !Array.isArray(agendaItems) || agendaItems.length === 0) {
      return NextResponse.json({ error: 'Missing session title, date, or agenda items.' }, { status: 400 });
    }

    const agendaSummary = agendaItems.map((item: any, idx: number) => {
      const speakerText = item.speakerName 
        ? `${item.speakerName} (${item.speakerTitle || 'Industry Expert'} at ${item.speakerOrg || 'External Org'})`
        : 'TBD';
      return `[Topic ${idx + 1}]
Title: ${item.title}
Duration: ${item.duration || '30 mins'}
Speaker: ${speakerText}
Commercial Focus / Problem Statement: ${item.problemStatement || 'N/A'}
Therapeutic Areas / Tech Domains: ${(item.therapeuticAreas || []).join(', ') || 'N/A'}`;
    }).join('\n\n');

    const systemPrompt = `You are a professional Executive Communications Director for the Pfizer Commercial AI Tech Think Tank Council. 
Your job is to draft a premium, highly concise, high-impact session invitation email sent to Pfizer steering leaders and marketing attendees.
CRITICAL MANDATE: Keep the draft extremely direct, brief, and devoid of any fluff, boilerplate corporate filler, or unnecessary introductory pleasantries. Focus purely on critical strategic details.`;

    const userPrompt = `Please draft a highly concise, punchy executive Think Tank Session Invitation based on the following schedule:

Session Title: ${sessionTitle}
Session Date: ${sessionDate}

Agenda Schedule:
${agendaSummary}

Instructions for the draft:
- Keep it short, direct, and zero-fluff.
- Use clean, professional Markdown.
- Sections to include:
  1. **Subject Line**: Direct and professional (e.g., "[Invitation] Think Tank: ${sessionTitle} - ${sessionDate}").
  2. **Session Context**: A brief 2-3 sentence overview of why this session matters for Pfizer's commercial strategy.
  3. **Agenda & Relevancy**: A short bulleted list of topics with a 1-sentence explanation of their specific commercial relevance.
  4. **Key Takeaways**: 2-3 brief bullet points outlining what attendees will learn.
  5. **Speaker Profile**: A 1-2 sentence professional bio for the speaker(s).

Draft the concise email now:`;

    const answer = await chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], 0.3);

    return NextResponse.json({ emailText: answer });
  } catch (error: any) {
    console.error('API generate-email failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
