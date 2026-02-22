import React, { useEffect } from 'react';
import { useAppStore } from './stores/appStore';
import { getDataSource } from './data/adapters';
import { SubnetMetrics } from './types';
import { TopBar } from './components/layout/TopBar';
import { SubnetSidebar } from './components/sidebar/SubnetSidebar';
import { MainPanel } from './components/layout/MainPanel';
import { WatchlistManager } from './components/pro/WatchlistManager';
import { AlertsPanel } from './components/pro/AlertsPanel';
import { SimulationProvider } from './components/simulation/SimulationProvider';
import { RateLimitNotice } from './components/common/RateLimitNotice';
import './styles/global.css';

const App: React.FC = () => {
  const { setSubnets, setMetricsMap, darkMode, selectSubnet } = useAppStore();

  // Bootstrap: load subnets and metrics
  useEffect(() => {
    const ds = getDataSource();

    Promise.all([ds.listSubnets(), ds.getAllMetrics()]).then(([subnets, allMetrics]) => {
      setSubnets(subnets);
      const metricsMap: Record<number, SubnetMetrics> = {};
      for (const m of allMetrics) metricsMap[m.subnetId] = m;
      setMetricsMap(metricsMap);

      // Auto-select first subnet if none selected
      if (!useAppStore.getState().selectedSubnetId && subnets.length > 0) {
        selectSubnet(subnets[0].subnetId);
      }
    });

    // Periodic registry refresh — use 5 min interval to respect rate limits
    const interval = setInterval(async () => {
      const latestSubnets = await ds.listSubnets();
      const currentSubnets = useAppStore.getState().subnets;
      if (latestSubnets.length !== currentSubnets.length) {
        setSubnets(latestSubnets);
      }
    }, 300_000);

    return () => clearInterval(interval);
  }, []);

  return (
    <SimulationProvider>
      <div
        data-theme={darkMode ? 'dark' : 'light'}
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <TopBar />
        <div style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
        }}>
          {/* Left sidebar */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <SubnetSidebar />
            <WatchlistManager />
            <AlertsPanel />
          </div>

          {/* Main content */}
          <MainPanel />
        </div>
        <RateLimitNotice />
      </div>
    </SimulationProvider>
  );
};

export default App;
