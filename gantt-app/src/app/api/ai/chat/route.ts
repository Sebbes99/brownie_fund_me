import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { chatWithContext } from '@/lib/claude';

export async function POST(request: NextRequest) {
  const { question, userId } = await request.json();

  if (!question) {
    return NextResponse.json({ error: 'Question required' }, { status: 400 });
  }

  // Get all active tenders for context
  const tenders = await prisma.tender.findMany({
    where: {
      status: { not: 'stängd' },
    },
    orderBy: { deadlineAt: 'asc' },
  });

  // Build context string
  const tendersContext = tenders
    .map(
      (t) =>
        `- ${t.title} | Kategori: ${t.category} | Region: ${t.region} | Beställare: ${t.buyer} | Värde: ${t.value ? `${(t.value / 1000000).toFixed(1)} Mkr` : 'Ej angivet'} | Deadline: ${t.deadlineAt.toISOString().split('T')[0]} | Match: ${t.matchScore || 'N/A'}% | Status: ${t.status}`
    )
    .join('\n');

  const answer = await chatWithContext(question, tendersContext);

  // Save chat messages if userId is provided
  if (userId) {
    await prisma.chatMessage.createMany({
      data: [
        { userId, role: 'user', content: question },
        { userId, role: 'assistant', content: answer },
      ],
    });
  }

  return NextResponse.json({ answer });
}
