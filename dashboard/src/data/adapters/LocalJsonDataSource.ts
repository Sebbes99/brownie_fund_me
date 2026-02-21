import { SubnetDataSource, SubnetMeta, TimeSeriesPoint, SubnetMetrics, SubnetEvent, Timeframe } from '../../types';
import { dummySubnets } from '../dummy/subnetRegistry';
import { getDummyTimeSeries } from '../dummy/timeSeries';
import { generateMetrics, getAllDummyMetrics } from '../dummy/metrics';
import { generateEvents } from '../dummy/events';

export class LocalJsonDataSource implements SubnetDataSource {
  private version = 1;

  async listSubnets(): Promise<SubnetMeta[]> {
    // Simulate network delay
    await this.delay(50);
    return [...dummySubnets];
  }

  async getSubnet(id: number): Promise<SubnetMeta | null> {
    await this.delay(20);
    return dummySubnets.find(s => s.subnetId === id) ?? null;
  }

  async getSeries(subnetId: number, timeframe: Timeframe): Promise<TimeSeriesPoint[]> {
    await this.delay(80);
    return getDummyTimeSeries(subnetId, timeframe);
  }

  async getMetrics(subnetId: number): Promise<SubnetMetrics | null> {
    await this.delay(30);
    return generateMetrics(subnetId);
  }

  async getAllMetrics(): Promise<SubnetMetrics[]> {
    await this.delay(100);
    return getAllDummyMetrics();
  }

  async getEvents(subnetId: number): Promise<SubnetEvent[]> {
    await this.delay(40);
    return generateEvents(subnetId);
  }

  async getVersion(): Promise<number> {
    return this.version;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const localDataSource = new LocalJsonDataSource();
