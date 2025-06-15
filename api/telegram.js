import { getStats } from '../lib/stats.js';

async function sendMessage(chatId, text) {
  const url = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown'
    })
  });
}

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

    await sendMessage(chatId, message);
    return res.status(200).json({ success: true });
  }

  if (text === '/top_mover') {
    try {
      const moverRes = await fetch(`${process.env.BASE_URL}/api/top_mover`);
      const data = await moverRes.json();

      if (!data.success) {
        await sendMessage(chatId, '❌ Failed to fetch top movers');
      } else {
        await sendMessage(chatId, data.message || '✅ Top movers fetched successfully.');
      }
    } catch (err) {
      await sendMessage(chatId, `❌ Error: ${err.message}`);
    }

    return res.status(200).json({ success: true });
  }

  // fallback
  return res.status(200).json({ success: true, message: 'No command handled' });
}
