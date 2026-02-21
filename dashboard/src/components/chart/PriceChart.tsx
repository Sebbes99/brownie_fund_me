import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  CrosshairMode,
  ColorType,
} from 'lightweight-charts';
import type {
  IChartApi,
  CandlestickData,
  HistogramData,
  Time,
} from 'lightweight-charts';
import { useAppStore } from '../../stores/appStore';
import type { TimeSeriesPoint, Drawing } from '../../types';
import { calcSMA, calcEMA, formatPrice, formatPercent } from '../../utils/indicators';
import { getDrawingsForChart, saveDrawing } from '../../services/drawingPersistence';
import { v4 as uuid } from 'uuid';
import { ChartSkeleton } from '../common/Skeleton';

interface PriceChartProps {
  data: TimeSeriesPoint[];
  subnetId: number;
  loading?: boolean;
  compareData?: { subnetId: number; data: TimeSeriesPoint[]; color: string; name: string }[];
}

function toChartTime(t: number): Time {
  return Math.floor(t / 1000) as Time;
}

export const PriceChart: React.FC<PriceChartProps> = ({ data, subnetId, loading, compareData }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  /* eslint-disable @typescript-eslint/no-explicit-any -- LW Charts v5 generic types are complex */
  const candleSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const indicatorSeriesRef = useRef<Map<string, any>>(new Map());
  const compareSeriesRef = useRef<Map<number, any>>(new Map());
  const drawingLinesRef = useRef<Map<string, any>>(new Map());
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const {
    timeframe, indicators, darkMode, activeDrawingTool, setActiveDrawingTool,
    currentDrawings, setCurrentDrawings, addDrawing,
    compareMode,
  } = useAppStore();

  const [crosshairData, setCrosshairData] = useState<{
    time: string; open: string; high: string; low: string; close: string; volume: string; change: string;
  } | null>(null);

  const [drawingStart, setDrawingStart] = useState<{ time: Time; price: number } | null>(null);

  // Load drawings from IndexedDB
  const loadDrawings = useCallback(async () => {
    const drawings = await getDrawingsForChart(subnetId, 'price', timeframe);
    setCurrentDrawings(drawings);
  }, [subnetId, timeframe, setCurrentDrawings]);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 420,
      layout: {
        background: { type: ColorType.Solid, color: darkMode ? '#0d1321' : '#fafafa' },
        textColor: darkMode ? '#8899b4' : '#5a6478',
        fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, Inter, sans-serif',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: darkMode ? '#1a2540' : '#e8eaed' },
        horzLines: { color: darkMode ? '#1a2540' : '#e8eaed' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: darkMode ? '#2a3a5c' : '#c0c6d0',
          labelBackgroundColor: darkMode ? '#1a2035' : '#e8eaed',
        },
        horzLine: {
          color: darkMode ? '#2a3a5c' : '#c0c6d0',
          labelBackgroundColor: darkMode ? '#1a2035' : '#e8eaed',
        },
      },
      rightPriceScale: {
        borderColor: darkMode ? '#1e2d4a' : '#d0d5dd',
      },
      timeScale: {
        borderColor: darkMode ? '#1e2d4a' : '#d0d5dd',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScale: { axisPressedMouseMove: { time: true, price: true } },
      handleScroll: { vertTouchDrag: true },
    });

    // Candlestick series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00c853',
      downColor: '#ff1744',
      borderUpColor: '#00c853',
      borderDownColor: '#ff1744',
      wickUpColor: '#00c853',
      wickDownColor: '#ff1744',
    });

    // Volume series (overlay at bottom)
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // Crosshair handler
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData) {
        setCrosshairData(null);
        return;
      }
      const d = param.seriesData.get(candleSeries) as CandlestickData<Time> | undefined;
      if (d && 'open' in d) {
        const prevClose = data.length > 1 ? data[data.length - 2]?.close : d.open;
        const change = prevClose ? ((d.close - prevClose) / prevClose) * 100 : 0;
        setCrosshairData({
          time: new Date((param.time as number) * 1000).toLocaleDateString(),
          open: formatPrice(d.open),
          high: formatPrice(d.high),
          low: formatPrice(d.low),
          close: formatPrice(d.close),
          volume: '',
          change: formatPercent(change),
        });
      }
    });

    // Click handler for drawings
    chart.subscribeClick((param) => {
      if (!activeDrawingTool || !param.time || !param.point) return;

      const price = candleSeries.coordinateToPrice(param.point.y);
      if (price === null) return;

      if (!drawingStart) {
        setDrawingStart({ time: param.time, price });
      } else {
        // Complete drawing
        const newDrawing: Drawing = {
          drawingId: uuid(),
          subnetId,
          chartId: 'price',
          timeframe,
          toolType: activeDrawingTool,
          anchors: [
            { time: drawingStart.time as number, price: drawingStart.price },
            { time: param.time as number, price },
          ],
          style: {
            color: '#2962ff',
            lineWidth: 2,
            lineStyle: 'solid',
          },
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        addDrawing(newDrawing);
        saveDrawing(newDrawing);
        setDrawingStart(null);
      }
    });

    // Resize observer
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        chart.applyOptions({
          width: entry.contentRect.width,
        });
      }
    });
    ro.observe(chartContainerRef.current);

    loadDrawings();

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      indicatorSeriesRef.current.clear();
      compareSeriesRef.current.clear();
      drawingLinesRef.current.clear();
    };
  }, [darkMode, subnetId]); // Recreate chart when theme or subnet changes

  // Update candle + volume data
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || data.length === 0) return;

    const candleData: CandlestickData<Time>[] = data.map(d => ({
      time: toChartTime(d.t),
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    const volumeData: HistogramData<Time>[] = data.map(d => ({
      time: toChartTime(d.t),
      value: d.volume,
      color: d.close >= d.open ? 'rgba(0,200,83,0.3)' : 'rgba(255,23,68,0.3)',
    }));

    candleSeriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);
  }, [data]);

  // Update indicators
  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    // Remove old indicator series
    for (const [, series] of indicatorSeriesRef.current) {
      chartRef.current.removeSeries(series);
    }
    indicatorSeriesRef.current.clear();

    for (const ind of indicators) {
      if (!ind.visible) continue;

      if (ind.type === 'SMA') {
        const smaData = calcSMA(data, ind.period);
        const series = chartRef.current.addSeries(LineSeries, {
          color: ind.color,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        series.setData(smaData.map(p => ({ time: toChartTime(p.t), value: p.value })));
        indicatorSeriesRef.current.set(`SMA-${ind.period}`, series);
      } else if (ind.type === 'EMA') {
        const emaData = calcEMA(data, ind.period);
        const series = chartRef.current.addSeries(LineSeries, {
          color: ind.color,
          lineWidth: 1,
          lineStyle: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        series.setData(emaData.map(p => ({ time: toChartTime(p.t), value: p.value })));
        indicatorSeriesRef.current.set(`EMA-${ind.period}`, series);
      }
    }
  }, [data, indicators]);

  // Compare mode
  useEffect(() => {
    if (!chartRef.current) return;

    // Remove old compare series
    for (const [, series] of compareSeriesRef.current) {
      chartRef.current.removeSeries(series);
    }
    compareSeriesRef.current.clear();

    if (!compareMode || !compareData) return;

    // Normalize: first point = 100
    for (const comp of compareData) {
      if (comp.data.length === 0) continue;
      const basePrice = comp.data[0].close;
      const series = chartRef.current.addSeries(LineSeries, {
        color: comp.color,
        lineWidth: 2,
        priceLineVisible: false,
        title: `SN${comp.subnetId}`,
      });

      series.setData(comp.data.map(d => ({
        time: toChartTime(d.t),
        value: (d.close / basePrice) * 100,
      })));

      compareSeriesRef.current.set(comp.subnetId, series);
    }
  }, [compareMode, compareData]);

  // Render drawings as lines on chart
  useEffect(() => {
    if (!chartRef.current) return;

    // Clear old
    for (const [, series] of drawingLinesRef.current) {
      chartRef.current.removeSeries(series);
    }
    drawingLinesRef.current.clear();

    for (const drawing of currentDrawings) {
      if (drawing.anchors.length < 2) continue;

      const lineStyleValue = drawing.style.lineStyle === 'dashed' ? 1 : drawing.style.lineStyle === 'dotted' ? 2 : 0;
      const series = chartRef.current.addSeries(LineSeries, {
        color: drawing.style.color,
        lineWidth: drawing.style.lineWidth as 1 | 2 | 3 | 4,
        lineStyle: lineStyleValue,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });

      if (drawing.toolType === 'horizontal') {
        const price = drawing.anchors[0].price;
        const first = data[0];
        const last = data[data.length - 1];
        if (first && last) {
          series.setData([
            { time: toChartTime(first.t), value: price },
            { time: toChartTime(last.t), value: price },
          ]);
        }
      } else if (drawing.toolType === 'fibRetracement') {
        const [a0, a1] = drawing.anchors;
        series.setData([
          { time: toChartTime(a0.time), value: a0.price },
          { time: toChartTime(a1.time), value: a1.price },
        ]);
      } else {
        series.setData(
          drawing.anchors.map(a => ({
            time: toChartTime(a.time),
            value: a.price,
          }))
        );
      }

      drawingLinesRef.current.set(drawing.drawingId, series);
    }
  }, [currentDrawings, data]);

  if (loading) return <ChartSkeleton />;

  return (
    <div style={{ position: 'relative' }}>
      {/* OHLC overlay */}
      {crosshairData && (
        <div style={chartStyles.ohlcOverlay}>
          <span style={{ color: 'var(--text-muted)' }}>{crosshairData.time}</span>
          <span>O <span className="mono">{crosshairData.open}</span></span>
          <span>H <span className="mono">{crosshairData.high}</span></span>
          <span>L <span className="mono">{crosshairData.low}</span></span>
          <span>C <span className="mono">{crosshairData.close}</span></span>
          <span className={parseFloat(crosshairData.change) >= 0 ? 'green' : 'red'}>
            {crosshairData.change}
          </span>
        </div>
      )}

      {/* Drawing mode indicator */}
      {activeDrawingTool && (
        <div style={chartStyles.drawingMode}>
          Drawing: {activeDrawingTool}
          {drawingStart && ' (click to complete)'}
          <button
            onClick={() => { setActiveDrawingTool(null); setDrawingStart(null); }}
            style={chartStyles.drawingCancel}
          >
            ESC
          </button>
        </div>
      )}

      <div ref={chartContainerRef} style={{ width: '100%' }} />
    </div>
  );
};

const chartStyles: Record<string, React.CSSProperties> = {
  ohlcOverlay: {
    position: 'absolute',
    top: 8,
    left: 12,
    zIndex: 10,
    display: 'flex',
    gap: 12,
    fontSize: 11,
    color: 'var(--text-secondary)',
    background: 'rgba(10, 14, 23, 0.85)',
    padding: '4px 10px',
    borderRadius: 'var(--radius)',
    backdropFilter: 'blur(8px)',
  },
  drawingMode: {
    position: 'absolute',
    top: 8,
    right: 12,
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 11,
    color: 'var(--accent)',
    background: 'rgba(41, 98, 255, 0.1)',
    padding: '4px 10px',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--accent)',
  },
  drawingCancel: {
    background: 'var(--accent)',
    color: '#fff',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
    cursor: 'pointer',
    border: 'none',
  },
};
