export interface RawTender {
  externalId: string;
  title: string;
  description: string;
  category: string;
  region: string;
  buyer: string;
  value: number | null;
  currency: string;
  publishedAt: Date;
  deadlineAt: Date;
  source: string;
  sourceUrl: string | null;
  rawData: Record<string, unknown>;
}

export interface TenderSource {
  name: string;
  fetch(): Promise<RawTender[]>;
}
