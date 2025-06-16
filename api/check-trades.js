import { supabase } from '../../lib/supabase.js';
import ccxt from 'ccxt';

const exchange = new ccxt.kucoinfutures();

export default async function handler(req, res) {
  const { data: trades, error } = await supabase
    .from('trades')
    .select('*')
    .eq('result', 'PENDING');

  if (error) {
    console.error('Error fetching trades:', error.message);
    return res.status(500).json({ error: error.message });
  }

  const updated = [];

  for (let trade of trades) {
    try {
      const ticker = await exchange.fetchTicker(trade.symbol);
      const price = ticker.last;

      let result = 'PENDING';

      if (trade.side === 'BUY') {
        if (price >= trade.tp) result = 'TP';
        else if (price <= trade.sl) result = 'SL';
      } else if (trade.side === 'SELL') {
        if (price <= trade.tp) result = 'TP';
        else if (price >= trade.sl) result = 'SL';
      }

      if (result !== 'PENDING') {
        const { error: updateError } = await supabase
          .from('trades')
          .update({ result, closed_at: new Date().toISOString() })
          .eq('id', trade.id);

        if (!updateError) updated.push({ ...trade, result });
        else console.error(`Failed to update trade ${trade.id}:`, updateError.message);
      }

    } catch (err) {
      console.error(`Error checking ${trade.symbol}: ${err.message}`);
    }
  }

  return res.status(200).json({ updated });
}
