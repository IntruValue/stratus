"use client";
import { createChart } from 'lightweight-charts';
import { useEffect, useRef, useState } from 'react';
import Spinner from './Spinner';

export default function StockChart({ symbol }) {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [chartData, setChartData] = useState(null); // New state to hold fetched chart data

  // Effect for initial chart data load
  useEffect(() => {
    if (!symbol) return;

    const fetchData = async () => {
      setLoading(true); // Set loading to true at the start of fetch
      setError(null); // Clear previous errors
      try {
        const response = await fetch(`/api/stock/${symbol}/bars`);
        if (!response.ok) throw new Error('Failed to fetch chart data');
        const data = await response.json();

        if (data.length === 0) {
          setError('No data available for this symbol.');
          setChartData(null); // Clear previous chart data
          return;
        }
        setChartData(data); // Store fetched data
      } catch (err) {
        setError(err.message);
        setChartData(null);
      } finally {
        setLoading(false); // Set loading to false after fetch
      }
    };

    fetchData();
  }, [symbol]);

  // Effect for chart creation and data setting
  useEffect(() => {
    if (!chartContainerRef.current || loading || error || !chartData) {
      return; // Don't create chart if container not ready, still loading, or no data/error
    }

    // Dispose of existing chart before creating a new one
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: { background: { color: '#1f2937' }, textColor: '#d1d5db' },
      grid: { vertLines: { color: '#374151' }, horzLines: { color: '#374151' } },
      timeScale: { borderColor: '#4b5563' },
    });
    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22c55e', downColor: '#ef4444', borderDownColor: '#ef4444',
      borderUpColor: '#22c55e', wickDownColor: '#ef4444', wickUpColor: '#22c55e',
    });

    candleSeries.setData(chartData); // Use stored chartData
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [loading, error, chartData]);

  // Effect to draw analysis on the chart
  useEffect(() => {
    if (!analysis || !chartRef.current) return;

    const { shortSMA, longSMA, signals } = analysis;

    const shortSmaSeries = chartRef.current.addLineSeries({ color: '#3b82f6', lineWidth: 2 });
    shortSmaSeries.setData(shortSMA);

    const longSmaSeries = chartRef.current.addLineSeries({ color: '#f97316', lineWidth: 2 });
    longSmaSeries.setData(longSMA);

    const candleSeries = chartRef.current.serieses()[0];
    candleSeries.setMarkers(signals.map(s => ({
      time: s.time,
      position: s.type === 'buy' ? 'belowBar' : 'aboveBar',
      color: s.type === 'buy' ? '#22c55e' : '#ef4444',
      shape: s.type === 'buy' ? 'arrowUp' : 'arrowDown',
      text: s.type === 'buy' ? 'Buy' : 'Sell',
    })));

  }, [analysis]);

  const runAnalysis = async () => {
    try {
      const res = await fetch('/api/strategy/sma-crossover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      });
      if (!res.ok) throw new Error('Failed to run analysis');
      const data = await res.json();
      setAnalysis(data);
    } catch (err) {
      console.error(err);
      setError('Could not run analysis.');
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Price Chart</h2>
        <button 
          onClick={runAnalysis}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300"
        >
          Run SMA Crossover Analysis
        </button>
      </div>
      {loading && <div className="h-[400px] flex justify-center items-center"><Spinner /></div>}
      {error && <div className="h-[400px] flex justify-center items-center text-red-500">{error}</div>}
      <div ref={chartContainerRef} style={{ width: '100%', height: '400px', display: loading || error ? 'none' : 'block' }} />
    </div>
  );
}