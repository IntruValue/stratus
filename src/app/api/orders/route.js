import { NextResponse } from 'next/server';
import Alpaca from '@alpacahq/alpaca-trade-api';

export async function POST(request) {
  const alpaca = new Alpaca({
    keyId: process.env.NEXT_PUBLIC_ALPACA_API_KEY_ID,
    secretKey: process.env.NEXT_PUBLIC_ALPACA_API_SECRET_KEY,
    paper: true,
  });

  try {
    const { symbol, qty, side } = await request.json();

    if (!symbol || !qty || !side) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const order = await alpaca.createOrder({
      symbol: symbol,
      qty: parseInt(qty, 10),
      side: side, // 'buy' or 'sell'
      type: 'market', // Or 'limit', 'stop', etc.
      time_in_force: 'day', // Or 'gtc', 'opg', etc.
    });

    return NextResponse.json(order);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
