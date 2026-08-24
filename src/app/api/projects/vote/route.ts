import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId, voteType, reason } = body; // projectId refers to ArticleGroup ID

    if (!projectId || !voteType) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    if (voteType === 'upvote') {
      const updated = await prisma.articleGroup.update({
        where: { id: projectId },
        data: {
          upvotes: { increment: 1 }
        }
      });
      return NextResponse.json({ success: true, project: updated });
    } else if (voteType === 'downvote') {
      const updated = await prisma.articleGroup.update({
        where: { id: projectId },
        data: {
          downvotes: { increment: 1 }
        }
      });
      return NextResponse.json({ success: true, project: updated });
    } else {
      return NextResponse.json({ error: 'Invalid voteType' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('POST /api/projects/vote failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
