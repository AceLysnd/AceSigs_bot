import { getStats } from '../lib/stats.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const body = req.body;
  const chatId = body?.message?.chat?.id;
  const text = body?.message?.text;

  if (text === '/stats') {
    const stats = getStats();

    const message = `
📊 *Trading Stats Summary*
———————————————
📈 *Total Trades:* ${stats.totalTrades}
✅ *Wins:* ${stats.wins}
❌ *Losses:* ${stats.losses}
🏆 *Win Rate:* ${stats.winRate}%
💰 *Profit:* $${stats.profit.toFixed(2)}

📅 *This Period*
▫️ Daily: ${stats.daily}
▫️ Weekly: ${stats.weekly}
▫️ Monthly: ${stats.monthly}
    `.trim();

    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`;
    const telegramRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    return res.status(200).json({ success: true });
  }

  // fallback
  return res.status(200).json({ success: true, message: 'No command handled' });
}
