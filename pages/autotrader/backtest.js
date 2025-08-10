import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { runBacktest } from '../../lib/trading-logic';
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
 * The Backtest Results page.
 * It loads a bot configuration, runs a historical simulation, and displays the performance.
 */
export default function BacktestPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [botConfig, setBotConfig] = useState(null);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('Loading configuration...');
    const [ai, setAi] = useState({ loading: false, interpretation: '' });

    // Effect to handle auth and load config from sessionStorage
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        const configStr = sessionStorage.getItem('financifyBacktestConfig');
        if (configStr) {
            const config = JSON.parse(configStr);
            // Ensure initial capital is set, defaulting if not present
            config.initialCapital = config.initialCapital || 10000;
            setBotConfig(config);
        } else {
            // If no config is found, redirect back to the builder
            router.push('/autotrader/builder');
        }
    }, [user, authLoading, router]);

    // Effect to run the simulation once the config is loaded
    useEffect(() => {
        if (botConfig) {
            performSimulation();
        }
    }, [botConfig]);

    /**
     * Fetches historical data, runs the backtest, and gets AI analysis.
     */
    const performSimulation = async () => {
        try {
            setLoadingMessage('Fetching historical data...');
            const response = await fetch(`/api/stock-data?function=HISTORY&symbol=${botConfig.ticker}&period1=${botConfig.backtest.startDate}&period2=${botConfig.backtest.endDate}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch historical data.');
            }
            const historicalData = await response.json();
            if (!historicalData || historicalData.length < 2) {
                throw new Error('Not enough historical data available for the selected period.');
            }

            setLoadingMessage('Running simulation...');
            const backtestResults = runBacktest(botConfig, historicalData);
            setResults(backtestResults);

            setAi({ loading: true, interpretation: '' });
            getAiInterpretation(backtestResults);

        } catch (error) {
            setLoadingMessage(error.message);
            // Keep loading spinner on error, but show the message
        } finally {
            setLoading(false);
        }
    };

    /**
     * Generates a prompt and calls the AI analysis API.
     */
    const getAiInterpretation = async (backtestResults) => {
        const prompt = `
        Act as a helpful financial advisor for a beginner investor. 
        Analyze the following backtest results for a trading bot on ticker ${botConfig.ticker} 
        using the "${botConfig.strategy}" strategy.
        
        The key performance metrics are:
        - Total Return: ${backtestResults.totalReturn.toFixed(2)}%
        - Maximum Drawdown: ${backtestResults.maxDrawdown.toFixed(2)}%
        - Number of Trades: ${backtestResults.trades.length}

        Your analysis should:
        1. Start with a one-sentence "Overall Summary".
        2. Explain what each metric means in simple terms.
        3. Provide a "Risk vs. Reward Profile".
        4. Conclude with a "Suggested Next Step".
        Format the response as clean HTML using <h3> and <p> tags.
    `;

        try {
            const response = await fetch('/api/ai-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });
            if (!response.ok) throw new Error('AI analysis request failed.');
            const result = await response.json();
            setAi({ loading: false, interpretation: result.analysis });
        } catch (error) {
            setAi({ loading: false, interpretation: `<p class="text-red-500">Could not generate AI analysis.</p>` });
        }
    };

    /**
     * Saves the config and proceeds to the deployment page.
     */
    const proceedToDeploy = () => {
        sessionStorage.setItem('financifyDeployConfig', JSON.stringify(botConfig));
        router.push('/autotrader/deploy');
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
            <div className="mb-6">
                <Link href="/autotrader/builder">
                    <a className="text-sm font-medium text-blue-600 hover:text-blue-800">&larr; Back to Strategy Builder</a>
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 mt-2">Backtest Results for "{botConfig.name}"</h1>
            </div>

            {results && (
                <>
                    {/* Performance Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* ... Metric cards for Total Return, Max Drawdown, etc. ... */}
                    </div>

                    {/* Equity Curve Chart */}
                    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                        <h2 className="text-xl font-semibold mb-4">Equity Curve</h2>
                        <div className="h-96">
                            <Line
                                data={{
                                    labels: results.equityCurve.map(p => p.date),
                                    datasets: [{
                                        label: 'Portfolio Value',
                                        data: results.equityCurve.map(p => p.value),
                                        borderColor: '#3B82F6',
                                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                        fill: true,
                                        pointRadius: 0,
                                        tension: 0.1,
                                    }]
                                }}
                                options={{ responsive: true, maintainAspectRatio: false }}
                            />
                        </div>
                    </div>

                    {/* AI Interpretation */}
                    <div className="bg-white p-8 rounded-lg shadow-md mb-8">
                        <h2 className="text-xl font-semibold mb-4">✨ AI Interpretation</h2>
                        {ai.loading ? <LoadingSpinner /> : <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: ai.interpretation }} />}
                    </div>

                    {/* Trade Log */}
                    <div className="bg-white rounded-lg shadow-md">
                        {/* ... Table to display the log of trades from results.trades ... */}
                    </div>

                    {/* Action Button */}
                    <div className="mt-8 flex justify-end">
                        <button onClick={proceedToDeploy} className="bg-blue-600 text-white px-6 py-3 rounded-md shadow-lg hover:bg-blue-700 transition font-semibold">
                            Proceed to Deploy &rarr;
                        </button>
                    </div>
                </>
            )}
        </main>
    );
}
