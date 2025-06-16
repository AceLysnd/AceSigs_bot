import ccxt from 'ccxt';
import axios from 'axios';
import { logTradeResult } from '../lib/stats.js';  // adjust path if needed

export default async function handler(req, res) {
  const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  const exchange = new ccxt.kucoinfutures();

  const PAIRS = [
    'BTC/USDT:USDT',
    'ETH/USDT:USDT',
    'BNB/USDT:USDT',
    'SOL/USDT:USDT',
    'XRP/USDT:USDT',
    'ADA/USDT:USDT',
    'DOGE/USDT:USDT',
    'AVAX/USDT:USDT',
    'DOT/USDT:USDT',
    'SHIB/USDT:USDT',
    'MATIC/USDT:USDT',
    'LTC/USDT:USDT',
    'TRX/USDT:USDT',
    'LINK/USDT:USDT',
    'ATOM/USDT:USDT'
  ];

  const signals = [];

  try {
    for (const symbol of PAIRS) {
      try {
        const candles = await exchange.fetchOHLCV(symbol, '1m', undefined, 100);
        const closes = candles.map(c => c[4]);

        const rsi = calculateRSI(closes, 7);
        const ema = calculateEMA(closes, 21);
        const price = closes[closes.length - 1];

        const rsiPrev = rsi[rsi.length - 2];
        const rsiCurr = rsi[rsi.length - 1];
        const emaCurr = ema[ema.length - 1];

        let message = null;

        const atr = calculateATR(candles, 14); // adjusted to 14 and smoother calc
        const atrCurr = atr[atr.length - 1];
        const structureLow = Math.min(...closes.slice(-10));
        const structureHigh = Math.max(...closes.slice(-10));
        const minSL = 0.1;

        if (rsiPrev < 30 && rsiCurr > 30 && price > emaCurr) {
          const sl = Math.min(price - atrCurr * 1.5, structureLow);
          const tp = price + 1.5 * (price - sl);
          message = `🟢 BUY Signal on ${symbol}\nEntry: ${price.toFixed(4)}\nSL: ${sl.toFixed(4)}\nTP: ${tp.toFixed(4)}\nRR: 1.5\nRSI: ${rsiCurr.toFixed(2)}\nEMA(21): ${emaCurr.toFixed(2)}`;
        }
        else if (rsiPrev > 70 && rsiCurr < 70 && price < emaCurr) {
          const sl = Math.max(price + atrCurr * 1.5, structureHigh);
          const tp = price - 1.5 * (sl - price);
          message = `🔴 SELL Signal on ${symbol}\nEntry: ${price.toFixed(4)}\nSL: ${sl.toFixed(4)}\nTP: ${tp.toFixed(4)}\nRR: 1.5\nRSI: ${rsiCurr.toFixed(2)}\nEMA(21): ${emaCurr.toFixed(2)}`;
        }

        if (message) {
          await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: message
          });
          
          const result = {
            symbol,
            side: message.includes('BUY') ? 'BUY' : 'SELL',
            entry: price,
            result: 'PENDING', // will be updated later to TP or SL
            date: new Date().toISOString()
          };

          logTradeResult(result);

          signals.push(message);
        }

      } catch (innerErr) {
        console.error(`Error with ${symbol}: ${innerErr.message}`);
      }
    }

    return res.status(200).json({ success: true, signals });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

function calculateRSI(prices, period = 7) {
  const deltas = prices.slice(1).map((v, i) => v - prices[i]);
  let gains = [], losses = [];
  for (let i = 0; i < deltas.length; i++) {
    gains.push(Math.max(0, deltas[i]));
    losses.push(Math.max(0, -deltas[i]));
  }
  let avgGain = avg(gains.slice(0, period));
  let avgLoss = avg(losses.slice(0, period));
  const rsi = [];

  for (let i = period; i < prices.length - 1; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi.push(100 - 100 / (1 + rs));
  }

  return new Array(period).fill(null).concat(rsi);
}

function calculateEMA(prices, period = 21) {
  const k = 2 / (period + 1);
  const ema = [avg(prices.slice(0, period))];
  for (let i = period; i < prices.length; i++) {
    ema.push(prices[i] * k + ema[ema.length - 1] * (1 - k));
  }
  return new Array(period - 1).fill(null).concat(ema);
}

function calculateATR(candles, period = 14) {
  const trs = [];
  for (let i = 1; i < candles.length; i++) {
    const [ , high, low, , close ] = candles[i];
    const [ , , , , prevClose ] = candles[i - 1];
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trs.push(tr);
  }
  const atrs = [];
  let atr = avg(trs.slice(0, period));
  atrs.push(atr);
  for (let i = period; i < trs.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period;
    atrs.push(atr);
  }
  return new Array(period).fill(null).concat(atrs);
}

function avg(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
