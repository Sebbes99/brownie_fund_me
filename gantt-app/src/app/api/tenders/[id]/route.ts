import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tender = await prisma.tender.findUnique({
    where: { id },
  });

  if (!tender) {
    return NextResponse.json({ error: 'Tender not found' }, { status: 404 });
  }

  return NextResponse.json(tender);
}
