// pages/api/stock-data.js
import yahooFinance from 'yahoo-finance2';

// A simple in-memory cache to reduce redundant API calls
const cache = new Map();

export default async function handler(req, res) {
  const { symbol, func = 'QUOTE', period1, period2 } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: 'Stock symbol is required.' });
  }

  const cacheKey = `YF_${func}_${symbol}_${period1}_${period2}`;

  // Check if a valid (less than 5 minutes old) entry is in the cache
  if (cache.has(cacheKey) && (Date.now() - cache.get(cacheKey).timestamp < 5 * 60 * 1000)) {
    return res.status(200).json(cache.get(cacheKey).data);
  }

  try {
    let data;
    if (func === 'HISTORY') {
      const queryOptions = { period1: period1 || '2023-01-01' };
      if (period2) queryOptions.period2 = period2;
      data = await yahooFinance.historical(symbol, queryOptions);
    } else {
      data = await yahooFinance.quote(symbol);
    }
    
    // Store the new data and a timestamp in the cache
    cache.set(cacheKey, { timestamp: Date.now(), data });
    res.status(200).json(data);

  } catch (error) {
    console.error(`[YahooFinance API] Error for ${symbol}:`, error.message);
    res.status(500).json({ error: `Failed to fetch data for ${symbol}. It may be delisted.` });
  }
}