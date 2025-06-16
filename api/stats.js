import { getStats } from '../../lib/stats.js';

export default async function handler(req, res) {
  const range = req.query.range || 'daily';
  const stats = await getStats(range);
  res.json(stats);
}
