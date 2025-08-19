"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Spinner from '../../components/Spinner';
import StockChart from '../../components/StockChart';

export default function StockDetailPage() {
  const { symbol } = useParams();
  const router = useRouter();
  const [asset, setAsset] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tradeStatus, setTradeStatus] = useState('');

  useEffect(() => {
    if (!symbol) return;
    async function fetchAsset() {
      try {
        const res = await fetch(`/api/stock/${symbol.toUpperCase()}/details`);
        if (!res.ok) throw new Error(`Failed to fetch data for ${symbol}`);
        const data = await res.json();
        setAsset(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAsset();
  }, [symbol]);

  const handleTrade = async (side) => {
    setTradeStatus('Submitting order...');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: asset.symbol, qty: quantity, side }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to place order');
      }
      const order = await res.json();
      setTradeStatus(`Order ${side} for ${quantity} share(s) of ${asset.symbol} submitted successfully!`);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err) {
      setTradeStatus(`Error: ${err.message}`);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><Spinner /></div>;
  if (error) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-red-500">Error: {error}</div>;
  if (!asset) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Asset not found.</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-4xl font-bold">{asset.name} ({asset.symbol})</h1>
            <p className="text-gray-400">{asset.exchange}</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold">
              {asset.latestQuote ? `${parseFloat(asset.latestQuote.p).toFixed(2)}` : 'N/A'}
            </p>
            <p className={`text-lg ${asset.dailyChange.absolute >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {asset.dailyChange.absolute.toFixed(2)} ({asset.dailyChange.percent.toFixed(2)}%)
            </p>
          </div>
        </div>

        {/* Chart */}
        <StockChart symbol={asset.symbol} />

        {/* Trading Interface */}
        <div className="bg-gray-800 p-6 rounded-lg mt-8">
          <h2 className="text-2xl font-bold mb-4">Trade</h2>
          <div className="flex items-center space-x-4">
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              className="p-2 bg-gray-700 rounded-md w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button 
              onClick={() => handleTrade('buy')} 
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md transition duration-300"
            >
              Buy
            </button>
            <button 
              onClick={() => handleTrade('sell')} 
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-md transition duration-300"
            >
              Sell
            </button>
          </div>
          {tradeStatus && <p className="mt-4 text-sm text-gray-300">{tradeStatus}</p>}
        </div>
      </div>
    </div>
  );
}