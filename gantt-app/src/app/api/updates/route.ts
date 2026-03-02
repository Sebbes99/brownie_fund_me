import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch pending update batches
export async function GET() {
  const pendingBatches = await prisma.updateBatch.findMany({
    where: { status: 'pending' },
    include: {
      entries: {
        include: {
          tender: true,
        },
      },
    },
    orderBy: { fetchedAt: 'desc' },
    take: 1,
  });

  const pendingCount = await prisma.updateBatch.count({
    where: { status: 'pending' },
  });

  return NextResponse.json({
    batch: pendingBatches[0] || null,
    pendingCount,
  });
}

// POST: Apply or defer an update batch
export async function POST(request: NextRequest) {
  const { batchId, action, userId } = await request.json();

  if (!batchId || !action) {
    return NextResponse.json(
      { error: 'batchId and action required' },
      { status: 400 }
    );
  }

  if (action === 'apply') {
    await prisma.updateBatch.update({
      where: { id: batchId },
      data: {
        status: 'applied',
        appliedAt: new Date(),
      },
    });
  } else if (action === 'defer') {
    // Keep as pending, just log the deferral
  }

  // Log the action
  if (userId) {
    await prisma.updateLog.create({
      data: {
        batchId,
        userId,
        action,
      },
    });
  }

  return NextResponse.json({ success: true });
}
