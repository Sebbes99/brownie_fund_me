import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get('format') || 'json';

  const tenders = await prisma.tender.findMany({
    where: { status: { not: 'stängd' } },
    orderBy: { deadlineAt: 'asc' },
  });

  if (format === 'json') {
    return NextResponse.json(tenders);
  }

  if (format === 'csv') {
    const headers = [
      'Titel',
      'Kategori',
      'Region',
      'Beställare',
      'Värde (SEK)',
      'Publicerad',
      'Deadline',
      'Status',
      'Match Score',
      'Källa',
    ];

    const rows = tenders.map((t) =>
      [
        `"${t.title.replace(/"/g, '""')}"`,
        t.category,
        t.region,
        `"${t.buyer.replace(/"/g, '""')}"`,
        t.value?.toString() || '',
        t.publishedAt.toISOString().split('T')[0],
        t.deadlineAt.toISOString().split('T')[0],
        t.status,
        t.matchScore?.toString() || '',
        t.source,
      ].join(',')
    );

    const csv = [headers.join(','), ...rows].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="anbud-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  }

  return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
}
