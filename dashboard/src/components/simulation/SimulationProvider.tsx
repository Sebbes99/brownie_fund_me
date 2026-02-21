import React, { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../../stores/appStore';
import { getFullTimeSeries } from '../../data/dummy/timeSeries';
import { TimeSeriesPoint } from '../../types';

/**
 * SimulationProvider: Manages time simulation mode.
 * When active, it "plays back" historical data as if streaming in real-time.
 * Renders nothing visible — purely a logic controller.
 */

interface SimulationContextValue {
  simulatedData: TimeSeriesPoint[];
}

export const SimulationContext = React.createContext<SimulationContextValue>({
  simulatedData: [],
});

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    simulationActive, simulationSpeed, simulationIndex,
    selectedSubnetId, setSimulationIndex, setSimulationTotal,
  } = useAppStore();

  const fullDataRef = useRef<TimeSeriesPoint[]>([]);
  const intervalRef = useRef<number | null>(null);

  // Load full data when subnet changes
  useEffect(() => {
    if (selectedSubnetId === null) return;
    const full = getFullTimeSeries(selectedSubnetId);
    fullDataRef.current = full;
    setSimulationTotal(full.length);
    setSimulationIndex(Math.min(simulationIndex, full.length));
  }, [selectedSubnetId]);

  // Simulation tick
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!simulationActive) return;

    const baseInterval = 1000; // 1 second per tick at 1x
    const tickInterval = baseInterval / simulationSpeed;

    intervalRef.current = window.setInterval(() => {
      const { simulationIndex, simulationTotal } = useAppStore.getState();
      if (simulationIndex >= simulationTotal - 1) {
        useAppStore.getState().toggleSimulation(); // Stop at end
        return;
      }
      setSimulationIndex(simulationIndex + 1);
    }, tickInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [simulationActive, simulationSpeed]);

  const simulatedData = simulationActive
    ? fullDataRef.current.slice(0, simulationIndex + 1)
    : fullDataRef.current;

  return (
    <SimulationContext.Provider value={{ simulatedData }}>
      {children}
    </SimulationContext.Provider>
  );
};
