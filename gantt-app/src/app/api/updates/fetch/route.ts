import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchAllTenders } from '@/lib/tender-sources';

// POST: Trigger a new data fetch (called by cron or manually)
export async function POST() {
  const rawTenders = await fetchAllTenders();

  let newCount = 0;
  let updatedCount = 0;
  let closedCount = 0;

  // Create a new batch
  const batch = await prisma.updateBatch.create({
    data: {
      newCount: 0,
      updatedCount: 0,
      closedCount: 0,
      status: 'pending',
    },
  });

  for (const raw of rawTenders) {
    const existing = await prisma.tender.findUnique({
      where: { externalId: raw.externalId },
    });

    if (!existing) {
      // New tender
      const tender = await prisma.tender.create({
        data: {
          externalId: raw.externalId,
          title: raw.title,
          description: raw.description,
          category: raw.category,
          region: raw.region,
          buyer: raw.buyer,
          value: raw.value,
          currency: raw.currency,
          publishedAt: raw.publishedAt,
          deadlineAt: raw.deadlineAt,
          source: raw.source,
          sourceUrl: raw.sourceUrl,
          status: 'ny',
          rawData: JSON.stringify(raw.rawData),
        },
      });

      await prisma.updateEntry.create({
        data: {
          batchId: batch.id,
          tenderId: tender.id,
          changeType: 'new',
        },
      });

      newCount++;
    } else {
      // Check if updated
      const hasChanges =
        existing.title !== raw.title ||
        existing.description !== raw.description ||
        existing.value !== raw.value ||
        existing.deadlineAt.getTime() !== raw.deadlineAt.getTime();

      if (hasChanges) {
        const diff = JSON.stringify({
          title: existing.title !== raw.title ? { old: existing.title, new: raw.title } : undefined,
          value: existing.value !== raw.value ? { old: existing.value, new: raw.value } : undefined,
          deadline:
            existing.deadlineAt.getTime() !== raw.deadlineAt.getTime()
              ? { old: existing.deadlineAt.toISOString(), new: raw.deadlineAt.toISOString() }
              : undefined,
        });

        await prisma.tender.update({
          where: { id: existing.id },
          data: {
            title: raw.title,
            description: raw.description,
            value: raw.value,
            deadlineAt: raw.deadlineAt,
            status: 'uppdaterad',
            rawData: JSON.stringify(raw.rawData),
          },
        });

        await prisma.updateEntry.create({
          data: {
            batchId: batch.id,
            tenderId: existing.id,
            changeType: 'updated',
            diff,
          },
        });

        updatedCount++;
      }
    }
  }

  // Check for tenders that should be marked as closing soon or closed
  const now = new Date();
  const fiveDaysFromNow = new Date(now.getTime() + 5 * 86400000);

  await prisma.tender.updateMany({
    where: {
      deadlineAt: { lte: fiveDaysFromNow, gt: now },
      status: { not: 'stängd' },
    },
    data: { status: 'stänger_snart' },
  });

  const closedTenders = await prisma.tender.findMany({
    where: {
      deadlineAt: { lt: now },
      status: { not: 'stängd' },
    },
  });

  for (const tender of closedTenders) {
    await prisma.tender.update({
      where: { id: tender.id },
      data: { status: 'stängd' },
    });

    await prisma.updateEntry.create({
      data: {
        batchId: batch.id,
        tenderId: tender.id,
        changeType: 'closed',
      },
    });

    closedCount++;
  }

  // Update batch counts
  await prisma.updateBatch.update({
    where: { id: batch.id },
    data: { newCount, updatedCount, closedCount },
  });

  return NextResponse.json({
    batchId: batch.id,
    newCount,
    updatedCount,
    closedCount,
  });
}
