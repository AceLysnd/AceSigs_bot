import fs from 'fs';
import path from 'path';

const logPath = path.resolve('./data/trade-log.json');

export function logTradeResult({ symbol, side, entry, result, date }) {
  const data = JSON.parse(fs.readFileSync(logPath));
  data.push({ symbol, side, entry, result, date });
  fs.writeFileSync(logPath, JSON.stringify(data, null, 2));
}

export function getStats(range = 'daily') {
  const data = JSON.parse(fs.readFileSync(logPath));
  const now = new Date();
  const filtered = data.filter(trade => {
    const d = new Date(trade.date);
    if (range === 'daily') return d.toDateString() === now.toDateString();
    if (range === 'weekly') return now - d < 7 * 24 * 60 * 60 * 1000;
    if (range === 'monthly') return now - d < 30 * 24 * 60 * 60 * 1000;
    return true;
  });

  const total = filtered.length;
  const wins = filtered.filter(t => t.result === 'TP').length;
  const losses = filtered.filter(t => t.result === 'SL').length;
  const winRate = total > 0 ? (wins / total * 100).toFixed(2) : 0;
  const pnl = (wins * 1.5 - losses).toFixed(2); // 1.5 RR

  return { total, wins, losses, winRate, pnl };
}
