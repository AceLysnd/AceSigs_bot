import { getStats } from '../lib/stats.js';
import axios from 'axios';

export default async function handler(req, res) {
  try {
    const body = req.body;
    console.log('✅ Incoming Telegram Webhook:', JSON.stringify(body));

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('❌ Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
