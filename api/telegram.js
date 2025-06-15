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
📈 *Total Trades:* ${stats.totalTrades ?? 0}
✅ *Wins:* ${stats.wins ?? 0}
❌ *Losses:* ${stats.losses ?? 0}
🏆 *Win Rate:* ${(stats.winRate ?? 0).toFixed(2)}%
💰 *Profit:* $${(stats.profit ?? 0).toFixed(2)}

📅 *This Period*
▫️ Daily: ${stats.daily ?? 0}
▫️ Weekly: ${stats.weekly ?? 0}
▫️ Monthly: ${stats.monthly ?? 0}
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
