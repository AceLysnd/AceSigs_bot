import { logTradeResult } from '../../lib/stats.js';

export default async function handler(req, res) {
  const { symbol, side, entry, result, date } = req.body;
  await logTradeResult({ symbol, side, entry, result, date });
  res.status(200).json({ success: true });
}
