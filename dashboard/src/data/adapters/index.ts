import { SubnetDataSource } from '../../types';
import { localDataSource } from './LocalJsonDataSource';

// Switch data source here when connecting to a real API
// import { taoStatsDataSource } from './TaoStatsDataSource';

let currentSource: SubnetDataSource = localDataSource;

export function getDataSource(): SubnetDataSource {
  return currentSource;
}

export function setDataSource(source: SubnetDataSource): void {
  currentSource = source;
}
