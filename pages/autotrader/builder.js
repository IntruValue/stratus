import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

/**
 * The Bot Builder page.
 * Allows users to create a new trading bot or edit an existing one.
 */
export default function BotBuilderPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [isEditing, setIsEditing] = useState(false);
    const [mode, setMode] = useState('ai'); // 'ai' or 'manual'
    const [loadingAi, setLoadingAi] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState({ strategy: null, reasoning: null, params: {} });
    const [aiError, setAiError] = useState(null);

    // Helper to format a date object to 'YYYY-MM-DD' string
    const formatDate = (date) => date.toISOString().split('T')[0];

    // Initial state for a new bot configuration
    const initialBotState = {
        id: null,
        name: 'My AI Bot',
        ticker: 'MSFT',
        strategy: null,
        backtest: {
            startDate: formatDate(new Date(new Date().setMonth(new Date().getMonth() - 6))),
            endDate: formatDate(new Date())
        },
        strategyParams: { shortSmaPeriod: 20, longSmaPeriod: 50, /* ... other defaults */ },
        risk: { positionSizing: 5, stopLoss: 10, takeProfit: 20 },
        aiSuggestion: { reasoning: null }
    };

    const [bot, setBot] = useState(initialBotState);

    // Effect for authentication and loading an existing bot for editing
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        const editBotConfigStr = sessionStorage.getItem('financifyEditBotConfig');
        if (editBotConfigStr) {
            setIsEditing(true);
            setBot(JSON.parse(editBotConfigStr));
            sessionStorage.removeItem('financifyEditBotConfig');
        } else {
            setBot(prev => ({ ...prev, id: Date.now() }));
        }
    }, [user, authLoading, router]);

    /**
     * Handles changes to any input in the bot configuration form.
     * @param {string} section - The top-level key in the bot state (e.g., 'risk', 'backtest').
     * @param {string} field - The specific field to update.
     * @param {any} value - The new value for the field.
     */
    const handleInputChange = (section, field, value) => {
        setBot(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    /**
     * Fetches an AI-powered strategy suggestion from the backend.
     */
    const getAiStrategy = async () => {
        // ... (AI strategy fetching logic from previous turn)
    };

    /**
     * Validates the form and proceeds to the backtest page.
     */
    const runBacktest = (e) => {
        e.preventDefault();
        if (!bot.strategy) {
            alert('Please select a strategy or get an AI suggestion.');
            return;
        }
        if (new Date(bot.backtest.startDate) >= new Date(bot.backtest.endDate)) {
            alert('Backtest start date must be before the end date.');
            return;
        }
        sessionStorage.setItem('financifyBacktestConfig', JSON.stringify(bot));
        router.push('/autotrader/backtest');
    };

    if (authLoading) {
        return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
    }

    return (
        <main className="max-w-4xl mx-auto py-10 sm:px-6 lg:px-8">
            <div className="mb-6">
                <Link href="/autotrader">
                    <a className="text-sm font-medium text-blue-600 hover:text-blue-800">&larr; Back to Auto-Trader Dashboard</a>
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 mt-2">
                    {isEditing ? 'Edit Trading Bot' : 'Create New Trading Bot'}
                </h1>
                <p className="mt-2 text-gray-600">Design your strategy and then run a historical backtest to see how it performs.</p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md">
                <form onSubmit={runBacktest} className="space-y-8">
                    {/* Section 1: Bot Details */}
                    <div className="border-b border-gray-200 pb-6">
                        <h2 className="text-lg font-semibold text-gray-900">1. Bot Details</h2>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="bot-name" className="block text-sm font-medium text-gray-700">Bot Name</label>
                                <input type="text" value={bot.name} onChange={(e) => setBot({ ...bot, name: e.target.value })} id="bot-name" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                            </div>
                            <div>
                                <label htmlFor="ticker" className="block text-sm font-medium text-gray-700">Ticker Symbol</label>
                                <input type="text" value={bot.ticker} onChange={(e) => setBot({ ...bot, ticker: e.target.value.toUpperCase() })} id="ticker" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Strategy Configuration */}
                    {/* ... (JSX for AI/Manual mode toggle, strategy selection, and parameter inputs) ... */}

                    {/* Section 3: Final Configuration */}
                    <div className="border-b border-gray-200 pb-6">
                        <h2 className="text-lg font-semibold text-gray-900">3. Final Configuration</h2>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div>
                                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">Backtest Start Date</label>
                                <input type="date" value={bot.backtest.startDate} onChange={(e) => handleInputChange('backtest', 'startDate', e.target.value)} id="start-date" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                            </div>
                            <div>
                                <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">Backtest End Date</label>
                                <input type="date" value={bot.backtest.endDate} onChange={(e) => handleInputChange('backtest', 'endDate', e.target.value)} id="end-date" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
                            </div>
                            {/* ... other inputs for position sizing, stop-loss, take-profit ... */}
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-5 flex justify-end">
                        <button type="submit" disabled={!bot.strategy} className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-6 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:bg-gray-400">
                            Run Backtest &rarr;
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
