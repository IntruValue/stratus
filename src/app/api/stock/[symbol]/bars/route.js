import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(request, { params }) {
  const { symbol } = params;
  
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 1);

    const results = await yahooFinance.historical(symbol, {
      period1: startDate,
      period2: endDate,
      interval: '1d',
    });

    // Map the Yahoo Finance history to the format Lightweight Charts expects
    const data = results.map(bar => ({
      time: new Date(bar.date).getTime() / 1000,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
    }));

    return NextResponse.json(data);

  } catch (error) {
    console.error(`[API/stock/bars] Error fetching bars for ${symbol} from Yahoo Finance:`, error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}