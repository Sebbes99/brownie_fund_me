import { SubnetDataSource } from '../../types';
import { localDataSource } from './LocalJsonDataSource';
import { taoStatsDataSource } from './TaoStatsDataSource';

// Use TaoStats live data if an API key is configured, otherwise fall back to dummy data
const apiKey = import.meta.env.VITE_TAOSTATS_API_KEY;
let currentSource: SubnetDataSource = apiKey ? taoStatsDataSource : localDataSource;

export function getDataSource(): SubnetDataSource {
  return currentSource;
}

export function setDataSource(source: SubnetDataSource): void {
  currentSource = source;
}
