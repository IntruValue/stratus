import { NextResponse } from 'next/server';
import Alpaca from '@alpacahq/alpaca-trade-api';

// Helper to calculate Simple Moving Average
const calculateSMA = (data, period) => {
  let sma = [];
  for (let i = period - 1; i < data.length; i++) {
    const subset = data.slice(i - (period - 1), i + 1);
    const sum = subset.reduce((acc, val) => acc + val.c, 0);
    sma.push({ time: data[i].time, value: sum / period });
  }
  return sma;
};

// Helper to find crossover signals
const findCrossovers = (shortSMA, longSMA) => {
  const signals = [];
  let i = 1;
  let j = 1;

  // Align starting points
  while (i < shortSMA.length && j < longSMA.length) {
    if (shortSMA[i].time < longSMA[j].time) {
      i++;
      continue;
    }
    if (longSMA[j].time < shortSMA[i].time) {
      j++;
      continue;
    }

    const prevShort = shortSMA[i - 1].value;
    const prevLong = longSMA[j - 1].value;
    const currShort = shortSMA[i].value;
    const currLong = longSMA[j].value;

    // Golden Cross (Buy)
    if (prevShort <= prevLong && currShort > currLong) {
      signals.push({ time: shortSMA[i].time, type: 'buy' });
    }
    // Death Cross (Sell)
    if (prevShort >= prevLong && currShort < currLong) {
      signals.push({ time: shortSMA[i].time, type: 'sell' });
    }

    i++;
    j++;
  }
  return signals;
};

export async function POST(request) {
  const { symbol, shortPeriod = 20, longPeriod = 50 } = await request.json();

  const alpaca = new Alpaca({
    keyId: process.env.NEXT_PUBLIC_ALPACA_API_KEY_ID,
    secretKey: process.env.NEXT_PUBLIC_ALPACA_API_SECRET_KEY,
    paper: true,
    feed: 'iex', // Use the free data feed
  });

  try {
    // Fetch enough data to calculate the longest SMA
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - longPeriod * 3); // Fetch more data for safety

    const bars = alpaca.getBarsV2(symbol, {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      timeframe: '1Day',
      adjustment: 'raw',
    });

    const historicalData = [];
    for await (let bar of bars) {
      historicalData.push({ 
        time: new Date(bar.Timestamp).getTime() / 1000,
        o: bar.OpenPrice,
        h: bar.HighPrice,
        l: bar.LowPrice,
        c: bar.ClosePrice 
      });
    }

    const shortSMA = calculateSMA(historicalData, shortPeriod);
    const longSMA = calculateSMA(historicalData, longPeriod);
    const signals = findCrossovers(shortSMA, longSMA);

    return NextResponse.json({ shortSMA, longSMA, signals });

  } catch (error) {
    console.error(`[API/strategy/sma-crossover] Error for ${symbol}:`, error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
