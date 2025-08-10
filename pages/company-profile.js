import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import LoadingSpinner from '../../components/LoadingSpinner';

import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

/**
 * The Company Profile page, a dynamic route that displays
 * detailed information for a specific stock ticker.
 */
export default function CompanyProfilePage() {
    const router = useRouter();
    const { ticker } = router.query; // Extracts the ticker from the URL, e.g., "AAPL"
    const { user, loading: authLoading } = useAuth();

    const [companyData, setCompanyData] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [inWatchlist, setInWatchlist] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('Authenticating...');
    const [aiLoading, setAiLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('summary');

    // Effect to handle authentication and redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    // Effect to fetch all company data when the ticker or user changes
    useEffect(() => {
        if (user && ticker) {
            const fetchData = async () => {
                setLoading(true);
                setLoadingMessage(`Loading data for ${ticker.toUpperCase()}...`);
                try {
                    const [quoteRes, historyRes] = await Promise.all([
                        fetch(`/api/stock-data?symbol=${ticker}`),
                        fetch(`/api/stock-data?function=HISTORY&symbol=${ticker}`)
                    ]);

                    if (!quoteRes.ok || !historyRes.ok) {
                        throw new Error(`Could not retrieve data for ${ticker.toUpperCase()}.`);
                    }

                    const quoteData = await quoteRes.json();
                    const historyData = await historyRes.json();

                    setCompanyData(quoteData);
                    prepareChartData(historyData);

                } catch (error) {
                    setLoadingMessage(error.message);
                } finally {
                    setLoading(false);
                }
            };

            fetchData();

            const watchlistRef = doc(db, `users/${user.uid}/watchlist`, ticker.toUpperCase());
            const unsubscribe = onSnapshot(watchlistRef, (doc) => {
                setInWatchlist(doc.exists());
            });

            return () => unsubscribe();
        }
    }, [user, ticker]);

    const prepareChartData = (history) => {
        const prices = (history || []).filter(p => p && typeof p.close === 'number' && p.date).slice(-90);
        setChartData({
            labels: prices.map(p => new Date(p.date).toLocaleDateString()),
            datasets: [{
                label: `${ticker.toUpperCase()} Stock Price`,
                data: prices.map(p => p.close),
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                pointRadius: 0,
                tension: 0.4,
            }]
        });
    };

    const toggleWatchlist = async () => {
        if (!user || !ticker) return;
        const watchlistRef = doc(db, `users/${user.uid}/watchlist`, ticker.toUpperCase());
        if (inWatchlist) {
            await deleteDoc(watchlistRef);
        } else {
            await setDoc(watchlistRef, { addedAt: new Date() });
        }
    };

    const generateAiAnalysis = async () => {
        setAiLoading(true);
        setAiAnalysis('');
        const prompt = `Provide a detailed SWOT analysis for ${companyData.shortName} (${companyData.symbol}). Format the output in clean HTML with <h3> tags for headings (Strengths, Weaknesses, Opportunities, Threats) and <ul> with <li> tags for bullet points.`;
        try {
            const response = await fetch('/api/ai-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });
            if (!response.ok) throw new Error('Failed to generate analysis.');
            const result = await response.json();
            setAiAnalysis(result.analysis);
        } catch (error) {
            setAiAnalysis(`<p class="text-red-500">Sorry, there was an error generating the analysis.</p>`);
        } finally {
            setAiLoading(false);
        }
    };

    const formatMetric = (value, type = 'number') => {
        if (typeof value !== 'number' || isNaN(value)) return 'N/A';
        switch (type) {
            case 'largeNumber':
                if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
                if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
                if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
                return value.toLocaleString();
            case 'currency':
                return `$${value.toFixed(2)}`;
            case 'percent':
                return `${(value * 100).toFixed(2)}%`;
            case 'ratio':
                return value.toFixed(2);
            default:
                return value.toLocaleString();
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <LoadingSpinner />
                <p className="mt-4 text-gray-600">{loadingMessage}</p>
            </div>
        );
    }

    return (
        <main className="max-w-7xl mx-auto py-10 sm:px-6 lg:px-8">
            {companyData && (
                <>
                    <header className="mb-8">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-4xl font-bold text-gray-900">
                                    {companyData.shortName} ({companyData.symbol})
                                </h1>
                                <p className="text-lg text-gray-500">
                                    {companyData.exchange} - {companyData.quoteType}
                                </p>
                            </div>
                            <button onClick={toggleWatchlist} className={`rounded-md px-4 py-2 text-sm font-semibold transition ${inWatchlist ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'}`}>
                                <span>{inWatchlist ? '✓ In Watchlist' : '+ Add to Watchlist'}</span>
                            </button>
                        </div>
                        <div className="mt-4 flex items-baseline space-x-3">
                            <p className="text-3xl font-bold">
                                ${companyData.regularMarketPrice.toFixed(2)}
                            </p>
                            <p className={`text-xl font-semibold ${companyData.regularMarketChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {companyData.regularMarketChange.toFixed(2)} ({companyData.regularMarketChangePercent.toFixed(2)}%)
                            </p>
                        </div>
                    </header>

                    <div className="border-b border-gray-200 mb-8">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            <button onClick={() => setActiveTab('summary')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'summary' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Summary & Key Metrics</button>
                            <button onClick={() => setActiveTab('charting')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'charting' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Charting</button>
                            <button onClick={() => setActiveTab('ai_insights')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'ai_insights' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>✨ AI Insights</button>
                        </nav>
                    </div>

                    <div>
                        {activeTab === 'summary' && (
                            <section>
                                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                                    <h2 className="text-xl font-semibold mb-3">Business Summary</h2>
                                    <p className="text-gray-600 leading-relaxed">
                                        {companyData.longBusinessSummary || 'No summary available.'}
                                    </p>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">Key Metrics</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {/* Key Metrics Grid */}
                                </div>
                            </section>
                        )}
                        {activeTab === 'charting' && chartData && (
                            <section className="bg-white p-6 rounded-lg shadow-md">
                                <h2 className="text-xl font-semibold mb-4">Price Performance (90 Days)</h2>
                                <div className="h-96">
                                    <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
                                </div>
                            </section>
                        )}
                        {activeTab === 'ai_insights' && (
                            <section className="bg-white p-6 rounded-lg shadow-md">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-semibold">AI-Powered SWOT Analysis</h2>
                                    <button onClick={generateAiAnalysis} disabled={aiLoading} className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50">
                                        {aiLoading ? 'Analyzing...' : '✨ Generate Analysis'}
                                    </button>
                                </div>
                                {aiLoading && <div className="mt-6"><LoadingSpinner /></div>}
                                {aiAnalysis && <div className="mt-6 prose max-w-none" dangerouslySetInnerHTML={{ __html: aiAnalysis }} />}
                            </section>
                        )}
                    </div>
                </>
            )}
        </main>
    );
}
