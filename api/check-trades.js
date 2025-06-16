import fs from 'fs';
import path from 'path';
import ccxt from 'ccxt';

const logPath = path.resolve('./data/trade-log.json');
const exchange = new ccxt.kucoinfutures();

export default async function handler(req, res) {
  const data = JSON.parse(fs.readFileSync(logPath));
  const updated = [];

  for (let trade of data) {
    if (trade.result !== 'PENDING') continue;

    try {
      const ticker = await exchange.fetchTicker(trade.symbol);
      const price = ticker.last;

      if (trade.side === 'BUY') {
        if (price >= trade.tp) {
          trade.result = 'TP';
        } else if (price <= trade.sl) {
          trade.result = 'SL';
        }
      } else if (trade.side === 'SELL') {
        if (price <= trade.tp) {
          trade.result = 'TP';
        } else if (price >= trade.sl) {
          trade.result = 'SL';
        }
      }

      if (trade.result !== 'PENDING') {
        trade.closedAt = new Date().toISOString();
        updated.push(trade);
      }

    } catch (err) {
      console.error(`Error checking ${trade.symbol}: ${err.message}`);
    }
  }

  fs.writeFileSync(logPath, JSON.stringify(data, null, 2));
  return res.status(200).json({ updated });
}
