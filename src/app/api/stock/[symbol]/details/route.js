import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(request, { params }) {
  const { symbol } = params;

  try {
    const quote = await yahooFinance.quote(symbol);

    if (!quote) {
      return NextResponse.json({ message: 'Asset not found' }, { status: 404 });
    }

    // Map the Yahoo Finance quote to our existing data structure
    const response = {
      symbol: quote.symbol,
      name: quote.longName || quote.shortName,
      exchange: quote.fullExchangeName,
      latestQuote: {
        p: quote.regularMarketPrice,
      },
      dailyChange: {
        absolute: quote.regularMarketChange,
        percent: quote.regularMarketChangePercent,
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error(`[API/stock/details] Error fetching details for ${symbol} from Yahoo Finance:`, error);
    return NextResponse.json({ message: `An error occurred: ${error.message}` }, { status: 500 });
  }
}
