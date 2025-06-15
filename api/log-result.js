import { logTradeResult } from '@/lib/stats';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { symbol, side, entry, result } = req.body;

  if (!['TP', 'SL'].includes(result)) {
    return res.status(400).json({ error: 'Invalid result' });
  }

  logTradeResult({
    symbol,
    side,
    entry,
    result,
    date: new Date().toISOString()
  });

  return res.json({ success: true });
}
