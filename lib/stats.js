import fs from 'fs';
import path from 'path';
import { supabase } from './supabase.js';

const logPath = '/tmp/trade-log.json';

export async function logTradeResult({ symbol, side, entry, result, date }) {
  const { error } = await supabase
    .from('trades')
    .insert([{ symbol, side, entry, result, date }]);

  if (error) console.error('Failed to log trade:', error.message);
}

export async function getStats(range = 'daily') {
  const now = new Date();
  let fromDate = new Date();

  if (range === 'weekly') fromDate.setDate(now.getDate() - 7);
  else if (range === 'monthly') fromDate.setMonth(now.getMonth() - 1);
  else fromDate.setHours(0, 0, 0, 0); // daily

  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .gte('date', fromDate.toISOString());

  if (error) {
    console.error('Failed to fetch stats:', error.message);
    return { total: 0, wins: 0, losses: 0, winRate: 0, pnl: 0 };
  }

  const total = data.length;
  const wins = data.filter(t => t.result === 'TP').length;
  const losses = data.filter(t => t.result === 'SL').length;
  const winRate = total > 0 ? parseFloat((wins / total * 100).toFixed(2)) : 0;
  const pnl = parseFloat((wins * 1.5 - losses).toFixed(2));

  return { total, wins, losses, winRate, pnl };
}

