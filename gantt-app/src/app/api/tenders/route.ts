import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
  const regions = searchParams.get('regions')?.split(',').filter(Boolean) || [];
  const statuses = searchParams.get('statuses')?.split(',').filter(Boolean) || [];
  const sources = searchParams.get('sources')?.split(',').filter(Boolean) || [];
  const matchScoreMin = parseInt(searchParams.get('matchScoreMin') || '0', 10);
  const deadline = searchParams.get('deadline') || 'all';
  const published = searchParams.get('published') || 'all';
  const search = searchParams.get('search') || '';
  const groupBy = searchParams.get('groupBy') || 'none';

  const now = new Date();

  // Build where clause
  const where: Record<string, unknown> = {};

  if (categories.length > 0) {
    where.category = { in: categories };
  }
  if (regions.length > 0) {
    where.region = { in: regions };
  }
  if (statuses.length > 0) {
    where.status = { in: statuses };
  }
  if (sources.length > 0) {
    where.source = { in: sources };
  }
  if (matchScoreMin > 0) {
    where.matchScore = { gte: matchScoreMin };
  }

  // Deadline filter
  if (deadline !== 'all') {
    const days = parseInt(deadline.replace('d', ''), 10);
    where.deadlineAt = {
      lte: new Date(now.getTime() + days * 86400000),
      gte: now,
    };
  }

  // Published filter
  if (published !== 'all') {
    const publishedDays: Record<string, number> = {
      today: 1,
      '7d': 7,
      '30d': 30,
    };
    const days = publishedDays[published];
    if (days) {
      where.publishedAt = {
        gte: new Date(now.getTime() - days * 86400000),
      };
    }
  }

  // Search
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { buyer: { contains: search } },
    ];
  }

  const tenders = await prisma.tender.findMany({
    where,
    orderBy: [
      { deadlineAt: 'asc' },
    ],
  });

  // Group if requested
  if (groupBy !== 'none') {
    const grouped: Record<string, typeof tenders> = {};
    for (const tender of tenders) {
      const key = tender[groupBy as keyof typeof tender] as string || 'Övriga';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(tender);
    }
    return NextResponse.json({ tenders, grouped, groupBy });
  }

  return NextResponse.json({ tenders });
}
