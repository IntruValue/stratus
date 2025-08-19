"use client";
import { useEffect, useState } from 'react';
import Spinner from '../components/Spinner';

export default function Dashboard() {
  const [account, setAccount] = useState(null);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const summaryRes = await fetch('/api/portfolio/summary');
        if (!summaryRes.ok) throw new Error('Failed to fetch account summary');
        const summaryData = await summaryRes.json();
        setAccount(summaryData);

        const positionsRes = await fetch('/api/portfolio/positions');
        if (!positionsRes.ok) throw new Error('Failed to fetch positions');
        const positionsData = await positionsRes.json();
        setPositions(positionsData);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="bg-red-500 p-4 rounded-lg">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-8">Dashboard</h1>
        
        {/* Account Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-400">Portfolio Value</h2>
            <p className="text-3xl font-bold">${parseFloat(account.portfolio_value).toLocaleString()}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-400">Buying Power</h2>
            <p className="text-3xl font-bold">${parseFloat(account.buying_power).toLocaleString()}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-400">Today's Change</h2>
            <p className={`text-3xl font-bold ${account.equity_change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${parseFloat(account.equity_change).toFixed(2)} ({(account.equity_change_percent * 100).toFixed(2)}%)
            </p>
          </div>
        </div>

        {/* Positions */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Your Positions</h2>
          <div className="overflow-x-auto">
            {positions.length > 0 ? (
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-4">Symbol</th>
                    <th className="text-right p-4">Qty</th>
                    <th className="text-right p-4">Current Price</th>
                    <th className="text-right p-4">Market Value</th>
                    <th className="text-right p-4">Today's P/L</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map(pos => (
                    <tr key={pos.asset_id} className="border-b border-gray-700 hover:bg-gray-700">
                      <td className="p-4 font-bold">{pos.symbol}</td>
                      <td className="text-right p-4">{pos.qty}</td>
                      <td className="text-right p-4">${parseFloat(pos.current_price).toLocaleString()}</td>
                      <td className="text-right p-4">${parseFloat(pos.market_value).toLocaleString()}</td>
                      <td className={`text-right p-4 ${pos.unrealized_intraday_pl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        ${parseFloat(pos.unrealized_intraday_pl).toFixed(2)} ({(pos.unrealized_intraday_plpc * 100).toFixed(2)}%)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center text-gray-400 py-8">You have no open positions.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}