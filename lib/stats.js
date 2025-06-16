import fs from 'fs';
import path from 'path';

const logPath = path.resolve('./data/trade-log.json');

export function logTradeResult({ symbol, side, entry, result, date }) {
  const data = JSON.parse(fs.readFileSync(logPath));
  data.push({ symbol, side, entry, result, date });
  fs.writeFileSync(logPath, JSON.stringify(data, null, 2));
}

export function getStats(range = 'daily') {
  let data = [];
  try {
    data = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
  } catch (e) {
    console.error('Failed to read trade log:', e);
    return { total: 0, wins: 0, losses: 0, winRate: 0, pnl: 0 };
  }

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD

  const filtered = data.filter(trade => {
    const d = new Date(trade.date).toISOString().slice(0, 10);
    if (range === 'daily') return d === todayStr;
    if (range === 'weekly') return now - new Date(trade.date) < 7 * 24 * 60 * 60 * 1000;
    if (range === 'monthly') return now - new Date(trade.date) < 30 * 24 * 60 * 60 * 1000;
    return true;
  });

  const total = filtered.length;
  const wins = filtered.filter(t => t.result === 'TP').length;
  const losses = filtered.filter(t => t.result === 'SL').length;
  const winRate = total > 0 ? (wins / total * 100).toFixed(2) : '0.00';
  const pnl = (wins * 1.5 - losses).toFixed(2); // Assume RR = 1.5

  return { total, wins, losses, winRate, pnl };
}
