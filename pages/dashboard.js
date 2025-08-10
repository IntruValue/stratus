import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import LoadingSpinner from '../components/LoadingSpinner';
import Link from 'next/link';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [pageLoading, setPageLoading] = useState(true);
  const [tickerInput, setTickerInput] = useState('');
  const [watchlist, setWatchlist] = useState([]);
  const [companyData, setCompanyData] = useState({});
  const [portfolioTotals, setPortfolioTotals] = useState({ marketValue: 0, dailyPl: 0, dailyPlPercent: 0 });
  const [activeBotsCount, setActiveBotsCount] = useState(0);
  const [marketNews, setMarketNews] = useState('Loading news...');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      const fetchMarketNews = async () => {
        // This is a simplified news fetcher. In a real app, you might use a dedicated news API.
        const prompt = "Provide a single, brief sentence summarizing today's top financial market news.";
        try {
          const response = await fetch('/api/ai-analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
          });
          if (!response.ok) throw new Error('Failed to fetch news');
          const result = await response.json();
          setMarketNews(result.analysis.replace(/<\/?[^>]+(>|$)/g, "")); // Strip HTML tags for dashboard view
        } catch (error) {
          setMarketNews('Could not load news at this time.');
        }
      };

      fetchMarketNews();

      const unsubscribers = [
        onSnapshot(collection(db, `users/${user.uid}/watchlist`), async (snapshot) => {
          const tickers = snapshot.docs.map(doc => doc.id);
          setWatchlist(tickers);
          fetchCompanyDataForTickers(tickers);
        }),
        onSnapshot(collection(db, `users/${user.uid}/portfolio`), (snapshot) => {
          const holdings = snapshot.docs.map(doc => ({ ticker: doc.id, ...doc.data() }));
          calculatePortfolioTotals(holdings);
        }),
        onSnapshot(collection(db, `users/${user.uid}/bots`), (snapshot) => {
          const activeBots = snapshot.docs.filter(doc => doc.data().status === 'Active').length;
          setActiveBotsCount(activeBots);
        }),
      ];

      setPageLoading(false);
      return () => unsubscribers.forEach(unsub => unsub());
    }
  }, [user]);

  const fetchCompanyDataForTickers = async (tickers) => {
    const dataPromises = tickers.map(ticker => fetch(`/api/stock-data?symbol=${ticker}`).then(res => res.json()));
    const results = await Promise.all(dataPromises);
    const newData = {};
    results.forEach((data, index) => {
      if (data && data.symbol) newData[data.symbol] = data;
    });
    setCompanyData(prev => ({ ...prev, ...newData }));
  };

  const calculatePortfolioTotals = async (holdings) => {
    if (holdings.length === 0) {
      setPortfolioTotals({ marketValue: 0, dailyPl: 0, dailyPlPercent: 0 });
      return;
    }
    const tickers = [...new Set(holdings.map(h => h.ticker))];
    const dataPromises = tickers.map(ticker => fetch(`/api/stock-data?symbol=${ticker}`).then(res => res.json()));
    const results = await Promise.all(dataPromises);
    const priceData = {};
    results.forEach(data => { if (data && data.symbol) priceData[data.symbol] = data; });

    let totalMarketValue = 0;
    let totalDailyPl = 0;
    holdings.forEach(holding => {
      const data = priceData[holding.ticker];
      if (data) {
        totalMarketValue += holding.shares * data.regularMarketPrice;
        totalDailyPl += (holding.shares * data.regularMarketChange);
      }
    });
    const costBasis = totalMarketValue - totalDailyPl;
    setPortfolioTotals({
      marketValue: totalMarketValue,
      dailyPl: totalDailyPl,
      dailyPlPercent: costBasis > 0 ? (totalDailyPl / costBasis) * 100 : 0,
    });
  };

  const searchTicker = (e) => {
    e.preventDefault();
    if (tickerInput.trim()) {
      router.push(`/company/${tickerInput.toUpperCase()}`);
    }
  };

  const removeFromWatchlist = async (ticker) => {
    await deleteDoc(doc(db, `users/${user.uid}/watchlist`, ticker));
  };

  const formatCurrency = (value) => {
    if (typeof value !== 'number') return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  if (authLoading || pageLoading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
  }

  return (
    <main className="max-w-7xl mx-auto py-10 sm:px-6 lg:px-8">
      <section id="search" className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome Back!</h1>
        <p className="text-lg text-gray-600 mb-6">What are we analyzing today?</p>
        <form onSubmit={searchTicker} className="relative">
          <input type="text" value={tickerInput} onChange={(e) => setTickerInput(e.target.value)} placeholder="Search for a stock ticker (e.g., MSFT, GOOG)..." className="w-full pl-4 pr-12 py-3 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg" />
          <button type="submit" className="absolute inset-y-0 right-0 px-4 flex items-center bg-blue-600 text-white rounded-r-md hover:bg-blue-700">Search</button>
        </form>
      </section>

      {/* ... Dashboard Cards and Watchlist Table JSX ... */}
    </main>
  );
}