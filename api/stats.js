import { getStats } from '@/lib/stats';

export default function handler(req, res) {
  const range = req.query.range || 'daily'; // daily, weekly, monthly
  const stats = getStats(range);
  return res.json(stats);
}
