import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateDailyBriefing } from '@/lib/claude';

export async function GET() {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 86400000);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 86400000);

  // Count new tenders (last 24h)
  const newCount = await prisma.tender.count({
    where: {
      publishedAt: { gte: oneDayAgo },
    },
  });

  // Count updated tenders
  const updatedCount = await prisma.tender.count({
    where: {
      status: 'uppdaterad',
      updatedAt: { gte: oneDayAgo },
    },
  });

  // Count closed tenders
  const closedCount = await prisma.tender.count({
    where: {
      status: 'stängd',
      updatedAt: { gte: oneDayAgo },
    },
  });

  // Get urgent tenders (deadline within 7 days, sorted by match score)
  const urgentTenders = await prisma.tender.findMany({
    where: {
      deadlineAt: {
        gte: now,
        lte: sevenDaysFromNow,
      },
      status: { not: 'stängd' },
    },
    orderBy: { matchScore: 'desc' },
    take: 5,
  });

  const urgentForAI = urgentTenders.map((t) => ({
    title: t.title,
    daysLeft: Math.ceil(
      (t.deadlineAt.getTime() - now.getTime()) / 86400000
    ),
    matchScore: t.matchScore || 0,
  }));

  const briefingText = await generateDailyBriefing(
    newCount,
    updatedCount,
    closedCount,
    urgentForAI
  );

  const highlights = urgentTenders.map((t) => ({
    tenderId: t.id,
    title: t.title,
    reason: t.matchReason || '',
    matchScore: t.matchScore || 0,
    daysUntilDeadline: Math.ceil(
      (t.deadlineAt.getTime() - now.getTime()) / 86400000
    ),
  }));

  return NextResponse.json({
    text: briefingText,
    generatedAt: now.toISOString(),
    highlights,
    stats: { newCount, updatedCount, closedCount },
  });
}
