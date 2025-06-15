import axios from 'axios';

export default async function handler(req, res) {
  const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  try {
    const response = await axios.get('https://api.kucoin.com/api/v1/market/stats');
    const stats = Object.values(response.data.data);

    const sorted = stats
      .filter(s => s.symbol.endsWith('-USDT'))
      .sort((a, b) => Math.abs(parseFloat(b.changeRate)) - Math.abs(parseFloat(a.changeRate)))
      .slice(0, 5);

    let message = `📊 Top 5 Movers (1H Change):\n`;
    for (const mover of sorted) {
      const pair = mover.symbol.replace('-', '/');
      const change = (parseFloat(mover.changeRate) * 100).toFixed(2);
      message += `${pair}: ${change}%\n`;
    }

    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: message,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
