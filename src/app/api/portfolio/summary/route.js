import { NextResponse } from 'next/server';
import Alpaca from '@alpacahq/alpaca-trade-api';

export async function GET(request) {
  const alpaca = new Alpaca({
    keyId: process.env.NEXT_PUBLIC_ALPACA_API_KEY_ID,
    secretKey: process.env.NEXT_PUBLIC_ALPACA_API_SECRET_KEY,
    paper: true,
    feed: 'iex', // Use the free data feed
  });

  try {
    const account = await alpaca.getAccount();
    return NextResponse.json(account);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}