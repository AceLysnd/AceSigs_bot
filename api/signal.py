import ccxt
import pandas as pd
import requests
from ta.momentum import RSIIndicator
import os

def handler(request):
    TELEGRAM_BOT_TOKEN = os.environ['7892325560:AAGMoq64HEMPROQmybfHMuCNzkP7eegnlT0']
    TELEGRAM_CHAT_ID = os.environ['7823805142']
    SYMBOL = 'BTC/USDT'

    def send_telegram(message):
        url = f'https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage'
        payload = {'chat_id': TELEGRAM_CHAT_ID, 'text': message}
        requests.post(url, json=payload)

    try:
        exchange = ccxt.binance()
        candles = exchange.fetch_ohlcv(SYMBOL, timeframe='5m', limit=100)
        df = pd.DataFrame(candles, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])

        df['rsi'] = RSIIndicator(df['close'], window=14).rsi()
        rsi_curr = df['rsi'].iloc[-1]
        rsi_prev = df['rsi'].iloc[-2]

        if rsi_prev < 30 and rsi_curr > 30:
            msg = f"🟢 RSI BUY on {SYMBOL} (RSI: {rsi_curr:.2f})"
            send_telegram(msg)
        elif rsi_prev > 70 and rsi_curr < 70:
            msg = f"🔴 RSI SELL on {SYMBOL} (RSI: {rsi_curr:.2f})"
            send_telegram(msg)

        return {
            "statusCode": 200,
            "body": "Signal checked."
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": f"Error: {str(e)}"
        }
