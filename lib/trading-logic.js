/**
 * @file lib/trading-logic.js
 * @description This file contains all the core logic for backtesting trading strategies,
 * calculating technical indicators, and computing performance metrics.
 */

// --- TECHNICAL INDICATOR CALCULATORS ---

/**
 * Calculates the Simple Moving Average (SMA) for a given period.
 * @param {number[]} data - An array of closing prices.
 * @param {number} period - The lookback period for the SMA.
 * @returns {Array<number|null>} An array of SMA values.
 */
const calculateSMA = (data, period) => {
    const sma = Array(data.length).fill(null);
    for (let i = period - 1; i < data.length; i++) {
        const slice = data.slice(i - period + 1, i + 1);
        const sum = slice.reduce((acc, val) => acc + val, 0);
        sma[i] = sum / period;
    }
    return sma;
};

/**
 * Calculates the Exponential Moving Average (EMA) for a given period.
 * @param {number[]} data - An array of closing prices.
 * @param {number} period - The lookback period for the EMA.
 * @returns {number[]} An array of EMA values.
 */
const calculateEMA = (data, period) => {
    const k = 2 / (period + 1);
    const ema = [data[0]];
    for (let i = 1; i < data.length; i++) {
        ema.push(data[i] * k + ema[i - 1] * (1 - k));
    }
    return ema;
};

/**
 * Calculates the Relative Strength Index (RSI).
 * @param {number[]} data - An array of closing prices.
 * @param {number} period - The lookback period for the RSI.
 * @returns {Array<number|null>} An array of RSI values.
 */
const calculateRSI = (data, period) => {
    const rsi = Array(data.length).fill(null);
    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
        const change = data[i] - data[i - 1];
        if (change > 0) gains += change;
        else losses -= change;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;
    if (avgLoss > 0) {
        rsi[period] = 100 - (100 / (1 + (avgGain / avgLoss)));
    } else {
        rsi[period] = 100;
    }

    for (let i = period + 1; i < data.length; i++) {
        const change = data[i] - data[i - 1];
        avgGain = (avgGain * (period - 1) + (change > 0 ? change : 0)) / period;
        avgLoss = (avgLoss * (period - 1) + (change < 0 ? -change : 0)) / period;
        if (avgLoss > 0) {
            rsi[i] = 100 - (100 / (1 + (avgGain / avgLoss)));
        } else {
            rsi[i] = 100;
        }
    }
    return rsi;
};


// --- SIGNAL GENERATION LOGIC ---

/**
 * Generates buy/sell signals based on an SMA Crossover strategy.
 * @param {object} params - The strategy parameters.
 * @param {number[]} params.prices - Array of closing prices.
 * @param {object} params.strategyParams - Parameters for the strategy.
 * @returns {string[]} An array of signals ('BUY', 'SELL', or null).
 */
const generateSmaCrossoverSignals = ({ prices, strategyParams }) => {
    const { shortSmaPeriod, longSmaPeriod } = strategyParams;
    const shortSma = calculateSMA(prices, shortSmaPeriod);
    const longSma = calculateSMA(prices, longSmaPeriod);

    return prices.map((_, i) => {
        if (i > 0 && shortSma[i] > longSma[i] && shortSma[i - 1] <= longSma[i - 1]) return 'BUY';
        if (i > 0 && shortSma[i] < longSma[i] && shortSma[i - 1] >= longSma[i - 1]) return 'SELL';
        return null;
    });
};

// ... You would create similar signal generation functions for MACD, RSI, etc.


// --- CORE SIMULATION ENGINE ---

/**
 * Runs the core backtest simulation based on a series of signals.
 * @param {object} params - The simulation parameters.
 * @returns {object} The results of the backtest.
 */
const runCoreSimulation = ({ historicalData, signals, botConfig }) => {
    const { initialCapital = 10000, risk } = botConfig;
    let capital = initialCapital;
    let shares = 0;
    const trades = [];
    const equityCurve = [{ date: historicalData[0].date, value: initialCapital }];
    let lastBuyPrice = 0;

    for (let i = 1; i < historicalData.length; i++) {
        const date = historicalData[i].date;
        const price = historicalData[i].close;
        const currentEquity = capital + (shares * price);

        // Stop-Loss and Take-Profit logic
        if (shares > 0) {
            const plPercent = ((price - lastBuyPrice) / lastBuyPrice) * 100;
            if (plPercent <= -risk.stopLoss || plPercent >= risk.takeProfit) {
                signals[i] = 'SELL'; // Force a sell signal
            }
        }

        if (signals[i] === 'BUY' && capital > 0) {
            const positionSize = currentEquity * (risk.positionSizing / 100);
            const sharesToBuy = positionSize / price;
            shares += sharesToBuy;
            capital -= positionSize;
            lastBuyPrice = price;
            trades.push({ date, action: 'BUY', price, quantity: sharesToBuy });
        } else if (signals[i] === 'SELL' && shares > 0) {
            capital += shares * price;
            const pl = (price - lastBuyPrice) * shares;
            trades.push({ date, action: 'SELL', price, quantity: shares, pl });
            shares = 0;
        }

        equityCurve.push({ date, value: capital + (shares * price) });
    }
    return { trades, equityCurve };
};


// --- PERFORMANCE METRICS ---

const calculatePerformanceMetrics = (equityCurve, initialCapital) => {
    if (equityCurve.length < 2) return { /* default zero values */ };

    const finalEquity = equityCurve[equityCurve.length - 1].value;
    const totalReturn = ((finalEquity - initialCapital) / initialCapital) * 100;

    // Max Drawdown Calculation
    let peak = -Infinity;
    let maxDrawdown = 0;
    equityCurve.forEach(point => {
        if (point.value > peak) peak = point.value;
        const drawdown = (peak - point.value) / peak;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    // ... other metric calculations like Sharpe Ratio, Annualized Return, etc.

    return {
        totalReturn,
        maxDrawdown: maxDrawdown * 100,
        // ... other metrics
    };
};


// --- MAIN EXPORTED FUNCTION ---

/**
 * The main entry point for running a backtest.
 * It orchestrates fetching data, generating signals, running the simulation, and calculating results.
 * @param {object} botConfig - The full configuration object for the bot.
 * @param {object[]} historicalData - The historical price data.
 * @returns {object} A comprehensive results object.
 */
export const runBacktest = (botConfig, historicalData) => {
    const prices = historicalData.map(d => d.close);
    let signals;

    switch (botConfig.strategy) {
        case 'SMA Crossover':
            signals = generateSmaCrossoverSignals({ prices, strategyParams: botConfig.strategyParams });
            break;
        // Add cases for other strategies (RSI, MACD, etc.)
        default:
            throw new Error(`Strategy "${botConfig.strategy}" is not implemented.`);
    }

    const { trades, equityCurve } = runCoreSimulation({ historicalData, signals, botConfig });
    const performance = calculatePerformanceMetrics(equityCurve, botConfig.initialCapital);

    return {
        ...performance,
        trades,
        equityCurve,
    };
};
