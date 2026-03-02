import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateTenderSummary } from '@/lib/claude';

export async function POST(request: NextRequest) {
  const { tenderId } = await request.json();

  const tender = await prisma.tender.findUnique({
    where: { id: tenderId },
  });

  if (!tender) {
    return NextResponse.json({ error: 'Tender not found' }, { status: 404 });
  }

  // Return cached summary if available
  if (tender.aiSummary) {
    try {
      const cached = JSON.parse(tender.aiSummary);
      return NextResponse.json(cached);
    } catch {
      // Invalid cached data, regenerate
    }
  }

  const summary = await generateTenderSummary(tender.title, tender.description);

  // Cache the summary
  await prisma.tender.update({
    where: { id: tenderId },
    data: { aiSummary: JSON.stringify(summary) },
  });

  return NextResponse.json(summary);
}
