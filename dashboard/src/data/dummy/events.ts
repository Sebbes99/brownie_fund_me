import { SubnetEvent } from '../../types';
import { v4 as uuid } from 'uuid';

const EVENT_TEMPLATES: Omit<SubnetEvent, 'id' | 'subnetId' | 'date'>[] = [
  { type: 'update', title: 'Validator software upgrade', description: 'New validator version deployed with performance improvements.', severity: 'info' },
  { type: 'governance', title: 'Emission weight proposal', description: 'Community vote on new emission weight distribution.', severity: 'info' },
  { type: 'release', title: 'Miner update v2.1', description: 'Critical miner update with new scoring mechanism.', severity: 'warning' },
  { type: 'alert', title: 'Unusual stake movement', description: 'Large stake migration detected from multiple validators.', severity: 'warning' },
  { type: 'milestone', title: '1000 validators reached', description: 'The subnet has surpassed 1000 active validators.', severity: 'info' },
  { type: 'governance', title: 'Tempo change proposal', description: 'Proposal to modify the subnet tempo parameter.', severity: 'info' },
  { type: 'alert', title: 'Emission drop detected', description: 'Subnet emission dropped by 15% in the last epoch.', severity: 'critical' },
  { type: 'update', title: 'Scoring function updated', description: 'New scoring algorithm deployed for better accuracy.', severity: 'info' },
  { type: 'release', title: 'API v3 released', description: 'New API endpoints available for subnet data queries.', severity: 'info' },
  { type: 'milestone', title: 'Top 10 by stake', description: 'The subnet entered the top 10 by total stake.', severity: 'info' },
];

export function generateEvents(subnetId: number): SubnetEvent[] {
  const events: SubnetEvent[] = [];
  const count = 3 + (subnetId % 8);

  for (let i = 0; i < count; i++) {
    const template = EVENT_TEMPLATES[(subnetId * 7 + i * 3) % EVENT_TEMPLATES.length];
    const daysAgo = Math.floor(((subnetId + i) * 13) % 90);
    const date = new Date(Date.now() - daysAgo * 86400000);

    events.push({
      ...template,
      id: uuid(),
      subnetId,
      date: date.toISOString(),
    });
  }

  return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
