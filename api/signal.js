import ccxt from 'ccxt';
import axios from 'axios';

export default async function handler(req, res) {
  const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  const exchange = new ccxt.kucoin();

  // Customizable
  const PAIRS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT', 'ADA/USDT'];
  const signals = [];

  try {
    for (const symbol of PAIRS) {
      try {
        const candles = await exchange.fetchOHLCV(symbol, '5m', undefined, 100);
        const closes = candles.map(c => c[4]);
        const rsi = calculateRSI(closes, 14);
        const rsiPrev = rsi[rsi.length - 2];
        const rsiCurr = rsi[rsi.length - 1];

        let message = null;

        if (rsiPrev < 30 && rsiCurr > 30) {
          message = `🟢 RSI BUY on ${symbol} (RSI: ${rsiCurr.toFixed(2)})`;
        } else if (rsiPrev > 70 && rsiCurr < 70) {
          message = `🔴 RSI SELL on ${symbol} (RSI: ${rsiCurr.toFixed(2)})`;
        }

        if (message) {
          await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: message
          });
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

// RSI function
function calculateRSI(prices, period = 14) {
  const deltas = [];
  for (let i = 1; i < prices.length; i++) {
    deltas.push(prices[i] - prices[i - 1]);
  }

  let gains = [];
  let losses = [];
  for (let i = 0; i < deltas.length; i++) {
    const delta = deltas[i];
    gains.push(delta > 0 ? delta : 0);
    losses.push(delta < 0 ? -delta : 0);
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

function avg(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
