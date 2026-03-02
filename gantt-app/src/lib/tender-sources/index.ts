import type { RawTender, TenderSource } from './types';
import { MockTenderSource } from './mock-source';

export type { RawTender, TenderSource };

// Registry of all available tender sources
const sources: TenderSource[] = [
  new MockTenderSource(),
  // Add real sources here when API keys are available:
  // new MercellSource(),
  // new VismaAnbudSource(),
  // new TedEuSource(),
];

export async function fetchAllTenders(): Promise<RawTender[]> {
  const results = await Promise.allSettled(
    sources.map((source) => source.fetch())
  );

  const allTenders: RawTender[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allTenders.push(...result.value);
    } else {
      console.error('Tender source failed:', result.reason);
    }
  }

  return allTenders;
}
