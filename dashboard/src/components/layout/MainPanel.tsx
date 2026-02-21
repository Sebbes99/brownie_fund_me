import React, { useEffect, useState, useContext, useMemo } from 'react';
import { useAppStore } from '../../stores/appStore';
import { getDataSource } from '../../data/adapters';
import { SubnetMeta, SubnetMetrics, SubnetEvent, TimeSeriesPoint } from '../../types';
import { PriceChart } from '../chart/PriceChart';
import { DrawingToolbar } from '../chart/DrawingToolbar';
import { IndicatorPanel, IndicatorButtons } from '../chart/IndicatorPanel';
import { DetailTabBar } from '../details/DetailTabs';
import { OverviewTab } from '../details/OverviewTab';
import { MetricsTab } from '../details/MetricsTab';
import { TechnicalsTab } from '../details/TechnicalsTab';
import { ActivityTab } from '../details/ActivityTab';
import { RawTab } from '../details/RawTab';
import { ComparePanel } from '../pro/ComparePanel';
import { SimulationContext } from '../simulation/SimulationProvider';
import { EmptyState } from '../common/EmptyState';
import { ChartSkeleton } from '../common/Skeleton';
import { BarChart3 } from 'lucide-react';

export const MainPanel: React.FC = () => {
  const {
    selectedSubnetId, subnets, metricsMap, timeframe, activeTab,
    compareMode, compareSubnets, simulationActive,
  } = useAppStore();

  const { simulatedData } = useContext(SimulationContext);
  const ds = getDataSource();

  const [subnet, setSubnet] = useState<SubnetMeta | null>(null);
  const [metrics, setMetrics] = useState<SubnetMetrics | null>(null);
  const [series, setSeries] = useState<TimeSeriesPoint[]>([]);
  const [events, setEvents] = useState<SubnetEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [compareData, setCompareData] = useState<{ subnetId: number; data: TimeSeriesPoint[]; color: string; name: string }[]>([]);

  // Load data when subnet or timeframe changes
  useEffect(() => {
    if (selectedSubnetId === null) return;

    let cancelled = false;
    setLoading(true);

    Promise.all([
      ds.getSubnet(selectedSubnetId),
      ds.getMetrics(selectedSubnetId),
      ds.getSeries(selectedSubnetId, timeframe),
      ds.getEvents(selectedSubnetId),
    ]).then(([sub, met, ser, evt]) => {
      if (cancelled) return;
      setSubnet(sub);
      setMetrics(met);
      setSeries(ser);
      setEvents(evt);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [selectedSubnetId, timeframe]);

  // Load compare data
  useEffect(() => {
    if (!compareMode || compareSubnets.length === 0) {
      setCompareData([]);
      return;
    }

    Promise.all(
      compareSubnets.map(async cs => {
        const data = await ds.getSeries(cs.subnetId, timeframe);
        const sub = subnets.find(s => s.subnetId === cs.subnetId);
        return {
          subnetId: cs.subnetId,
          data,
          color: cs.color,
          name: sub?.name || `SN${cs.subnetId}`,
        };
      })
    ).then(setCompareData);
  }, [compareMode, compareSubnets, timeframe, subnets]);

  // Use simulated data if simulation is active
  const chartData = simulationActive && simulatedData.length > 0 ? simulatedData : series;

  if (selectedSubnetId === null) {
    return (
      <div style={styles.emptyWrap}>
        <EmptyState
          icon={<BarChart3 size={48} />}
          title="Select a subnet"
          description="Choose a subnet from the sidebar to view its chart and analytics"
        />
      </div>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return subnet && <OverviewTab subnet={subnet} metrics={metrics} />;
      case 'metrics':
        return <MetricsTab metrics={metrics} />;
      case 'technicals':
        return <TechnicalsTab data={chartData} />;
      case 'activity':
        return <ActivityTab events={events} />;
      case 'raw':
        return subnet && <RawTab subnet={subnet} metrics={metrics} lastPoints={chartData} />;
      default:
        return null;
    }
  };

  return (
    <div style={styles.container}>
      {/* Compare panel */}
      <ComparePanel />

      {/* Chart area */}
      <IndicatorButtons />
      <DrawingToolbar />
      <div style={styles.chartWrap}>
        <PriceChart
          data={chartData}
          subnetId={selectedSubnetId}
          loading={loading}
          compareData={compareMode ? compareData : undefined}
        />
        <IndicatorPanel data={chartData} />
      </div>

      {/* Detail tabs */}
      <DetailTabBar />
      <div style={styles.tabContent}>
        {renderTab()}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: 'var(--bg)',
  },
  emptyWrap: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartWrap: {
    borderBottom: '1px solid var(--border)',
  },
  tabContent: {
    flex: 1,
    overflow: 'auto',
  },
};
