import { getStats } from '@/lib/stats';
import axios from 'axios';

export default async function handler(req, res) {
  const message = req.body.message;

  if (!message || !message.text) return res.status(200).end();

  const chatId = message.chat.id;
  const text = message.text.trim();

  if (text.startsWith('/stats')) {
    const [, rangeInput] = text.split(' ');
    const range = ['weekly', 'monthly'].includes(rangeInput) ? rangeInput : 'daily';

    const stats = getStats(range);

    const reply = `📊 *${range.charAt(0).toUpperCase() + range.slice(1)} Trade Stats*\n
📈 Total Trades: ${stats.total}
✅ Wins: ${stats.wins}
❌ Losses: ${stats.losses}
🏆 Win Rate: ${stats.winRate}%
💰 Profit: ${stats.pnl}R`;

    await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: chatId,
      text: reply,
      parse_mode: 'Markdown'
    });
  }

  return res.status(200).end();
}
