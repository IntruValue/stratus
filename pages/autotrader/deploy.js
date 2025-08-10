import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import LoadingSpinner from '../../components/LoadingSpinner';

/**
 * The Bot Deployment page.
 * This is the final step where a user allocates capital, chooses a mode,
 * and activates their trading bot.
 */
export default function DeployPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [botConfig, setBotConfig] = useState(null);
    const [capital, setCapital] = useState(10000);
    const [mode, setMode] = useState('paper'); // 'paper' or 'live'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Effect to handle authentication and load the bot config from sessionStorage
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        const deployConfigStr = sessionStorage.getItem('financifyDeployConfig');
        if (deployConfigStr) {
            setBotConfig(JSON.parse(deployConfigStr));
        } else {
            // If no config is found, the user likely skipped a step, so redirect them.
            if (!authLoading) {
                router.push('/autotrader/builder');
            }
        }
    }, [user, authLoading, router]);

    /**
     * Activates the bot by saving its final configuration to Firestore.
     */
    const activateBot = async (e) => {
        e.preventDefault();
        if (!user || !botConfig) {
            setError("User or bot configuration is missing.");
            return;
        }
        if (capital < 1) {
            setError("Capital allocation must be a positive number.");
            return;
        }

        setLoading(true);
        setError('');

        const finalBotConfig = {
            ...botConfig,
            status: 'Active',
            capital: capital,
            mode: mode,
            deploymentDate: new Date().toISOString(),
            liveTrades: [], // Initialize empty trade log
            livePerformance: { // Initialize performance metrics
                totalPl: 0,
                equityCurve: [{ date: new Date().toISOString().split('T')[0], value: capital }]
            }
        };

        try {
            const botRef = doc(db, `users/${user.uid}/bots`, finalBotConfig.id.toString());
            await setDoc(botRef, finalBotConfig);

            // Clean up session storage after successful deployment
            sessionStorage.removeItem('financifyDeployConfig');
            sessionStorage.removeItem('financifyBacktestConfig');

            alert(`Bot "${finalBotConfig.name}" has been successfully activated!`);
            router.push('/autotrader');

        } catch (err) {
            console.error("Error deploying bot:", err);
            setError("Failed to deploy bot. Please check your connection and try again.");
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || !botConfig) {
        return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
    }

    return (
        <main className="max-w-4xl mx-auto py-10 sm:px-6 lg:px-8">
            <div className="mb-6">
                <Link href="/autotrader/backtest">
                    <a className="text-sm font-medium text-blue-600 hover:text-blue-800">&larr; Back to Backtest Results</a>
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 mt-2">Deploy Bot</h1>
                <p className="mt-2 text-gray-600">Final step! Confirm your settings and activate your bot.</p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md">
                <form onSubmit={activateBot} className="space-y-8">
                    {/* Section 1: Review Bot */}
                    <div className="border-b border-gray-200 pb-6">
                        <h2 className="text-lg font-semibold text-gray-900">1. Review Your Bot</h2>
                        <div className="mt-4 rounded-md bg-gray-50 p-4">
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Bot Name</dt>
                                    <dd className="mt-1 text-sm text-gray-900 font-semibold">{botConfig.name}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Strategy</dt>
                                    <dd className="mt-1 text-sm text-gray-900 font-semibold">{botConfig.strategy}</dd>
                                </div>
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-gray-500">Risk Management</dt>
                                    <dd className="mt-1 text-sm text-gray-900 font-semibold">
                                        {`${botConfig.risk.positionSizing}% Position Sizing, ${botConfig.risk.stopLoss}% Stop-Loss, ${botConfig.risk.takeProfit}% Take-Profit`}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    {/* Section 2: Allocate Capital */}
                    <div className="border-b border-gray-200 pb-6">
                        <h2 className="text-lg font-semibold text-gray-900">2. Allocate Capital</h2>
                        <div className="mt-4">
                            <label htmlFor="capital-allocation" className="block text-sm font-medium text-gray-700">Capital Allocation (USD)</label>
                            <div className="relative mt-1 rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <span className="text-gray-500 sm:text-sm">$</span>
                                </div>
                                <input type="number" value={capital} onChange={(e) => setCapital(Number(e.target.value))} id="capital-allocation" className="block w-full rounded-md border-gray-300 pl-7" placeholder="10000.00" required min="1" />
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Trading Mode */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">3. Choose Trading Mode</h2>
                        <fieldset className="mt-4">
                            <div className="space-y-4 sm:flex sm:items-center sm:space-y-0 sm:space-x-4">
                                {/* Paper Trading Option */}
                                <div onClick={() => setMode('paper')} className={`flex-1 relative flex cursor-pointer rounded-lg border p-4 ${mode === 'paper' ? 'bg-blue-50 border-blue-200 z-10' : 'border-gray-200'}`}>
                                    <input type="radio" name="trading-mode" value="paper" checked={mode === 'paper'} onChange={() => { }} className="h-4 w-4 mt-0.5 cursor-pointer text-blue-600 border-gray-300" />
                                    <div className="ml-3 flex flex-col">
                                        <span className="block text-sm font-medium">Paper Trading</span>
                                        <span className="block text-sm text-gray-500">Simulate trades without real money.</span>
                                    </div>
                                </div>
                                {/* Live Trading Option */}
                                <div onClick={() => setMode('live')} className={`flex-1 relative flex cursor-pointer rounded-lg border p-4 ${mode === 'live' ? 'bg-blue-50 border-blue-200 z-10' : 'border-gray-200'}`}>
                                    <input type="radio" name="trading-mode" value="live" checked={mode === 'live'} onChange={() => { }} className="h-4 w-4 mt-0.5 cursor-pointer text-blue-600 border-gray-300" />
                                    <div className="ml-3 flex flex-col">
                                        <span className="block text-sm font-medium">Live Trading</span>
                                        <span className="block text-sm text-gray-500">Trade with real funds from your connected brokerage.</span>
                                    </div>
                                </div>
                            </div>
                        </fieldset>
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    {/* Action Buttons */}
                    <div className="pt-5 flex justify-end">
                        <button type="submit" disabled={loading} className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-6 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:bg-gray-400">
                            {loading ? 'Deploying...' : 'Activate Bot'}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
