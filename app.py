import ccxt
import pandas as pd
import time
import requests
from ta.momentum import RSIIndicator

# --- CONFIG ---
SYMBOL = 'BTC/USDT'
TIMEFRAME = '5m'
TELEGRAM_BOT_TOKEN = '7892325560:AAGMoq64HEMPROQmybfHMuCNzkP7eegnlT0'
TELEGRAM_CHAT_ID = '7823805142'
THRESHOLD_LOW = 30
THRESHOLD_HIGH = 70

# --- INIT ---
exchange = ccxt.binance()

def send_telegram(message):
    url = f'https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage'
    payload = {'chat_id': TELEGRAM_CHAT_ID, 'text': message}
    requests.post(url, json=payload)

def get_rsi_signal():
    candles = exchange.fetch_ohlcv(SYMBOL, timeframe=TIMEFRAME, limit=100)
    df = pd.DataFrame(candles, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])

    rsi = RSIIndicator(df['close'], window=14).rsi()
    df['rsi'] = rsi

    rsi_prev = df['rsi'].iloc[-2]
    rsi_curr = df['rsi'].iloc[-1]

    # RSI crossing 30 upwards → BUY signal
    if rsi_prev < THRESHOLD_LOW and rsi_curr > THRESHOLD_LOW:
        return f"🟢 BUY SIGNAL! RSI crossed above {THRESHOLD_LOW} on {SYMBOL} (RSI={round(rsi_curr, 2)})"
    
    # RSI crossing 70 downwards → SELL signal
    elif rsi_prev > THRESHOLD_HIGH and rsi_curr < THRESHOLD_HIGH:
        return f"🔴 SELL SIGNAL! RSI crossed below {THRESHOLD_HIGH} on {SYMBOL} (RSI={round(rsi_curr, 2)})"

    return None

# --- MAIN LOOP ---
while True:
    try:
        signal = get_rsi_signal()
        if signal:
            send_telegram(signal)
            print(f"[Signal Sent] {signal}")
        else:
            print("No signal.")
    except Exception as e:
        print(f"Error: {e}")
    
    time.sleep(60 * 5)  # Run every 5 minutes