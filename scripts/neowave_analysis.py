import requests
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from datetime import datetime, timezone

# Fetch Binance klines for ETHUSDT 4h for ~180 days
symbol = 'ETHUSDT'
interval = '4h'
limit = 2000
url = f'https://api.binance.com/api/v3/klines?symbol={symbol}&interval={interval}&limit={limit}'
resp = requests.get(url, timeout=30)
resp.raise_for_status()
data = resp.json()
# data: [open_time, open, high, low, close, ...]
cols = ['open_time','open','high','low','close','volume','close_time','qav','num_trades','taker_base','taker_quote','ignore']
df = pd.DataFrame(data, columns=cols)
for c in ['open','high','low','close','volume']:
    df[c] = df[c].astype(float)
df['date'] = pd.to_datetime(df['open_time'], unit='ms')
df.set_index('date', inplace=True)
# Keep last 180 days: approx 180*6=1080 rows
rows = 180*6
df = df.tail(rows)

# Simple extrema detection: local maxima/minima using window
def local_extrema(series, order=3):
    # order: number of neighbors on each side
    idx_max = []
    idx_min = []
    for i in range(order, len(series)-order):
        window = series[i-order:i+order+1]
        val = series[i]
        if val == max(window):
            idx_max.append(i)
        if val == min(window):
            idx_min.append(i)
    return idx_max, idx_min

cl = df['close'].values
idx_max, idx_min = local_extrema(cl, order=3)
# Merge and sort extrema
ext_idx = sorted(idx_max + idx_min)
ext_points = [(df.index[i], cl[i], 'max' if i in idx_max else 'min') for i in ext_idx]

# Simple naive Elliott-like labeling: detect sequences of 5 up swings
# Build swings: from extrema alternate min/max
swings = []
for i in range(len(ext_idx)-1):
    i1 = ext_idx[i]
    i2 = ext_idx[i+1]
    t1 = df.index[i1]
    t2 = df.index[i2]
    p1 = cl[i1]
    p2 = cl[i2]
    swings.append({'start_idx':i1,'end_idx':i2,'start_time':t1,'end_time':t2,'start_p':p1,'end_p':p2,'dir': 'up' if p2>p1 else 'down'})

# Try to find a 5-wave up sequence: up, down, up, down, up (dirs)
labels = []
for i in range(len(swings)-4):
    dirs = [s['dir'] for s in swings[i:i+5]]
    if dirs == ['up','down','up','down','up']:
        # label waves 1-5 at the end points
        base = swings[i]
        labels.append({'type':'impulse','start':swings[i]['start_time'],'end':swings[i+4]['end_time'],'waves':[swings[i+j] for j in range(5)]})

# If none found, try opposite (down-up-down-up-down)
if not labels:
    for i in range(len(swings)-4):
        dirs = [s['dir'] for s in swings[i:i+5]]
        if dirs == ['down','up','down','up','down']:
            labels.append({'type':'impulse_down','start':swings[i]['start_time'],'end':swings[i+4]['end_time'],'waves':[swings[i+j] for j in range(5)]})

# Prepare summary text
summary = []
summary.append(f"Data: Binance {symbol} {interval}, last {rows} candles (~{rows/6:.1f} days)")
summary.append(f"Total detected extrema: {len(ext_idx)}")
summary.append(f"Detected swings: {len(swings)}")
if labels:
    summary.append(f"Found {len(labels)} potential 5-wave impulse(s). Showing the most recent:")
    lab = labels[-1]
    for wi, w in enumerate(lab['waves'], start=1):
        summary.append(f" Wave {wi}: {w['start_time'].strftime('%Y-%m-%d %H:%M')} -> {w['end_time'].strftime('%Y-%m-%d %H:%M')} : {w['start_p']:.2f} -> {w['end_p']:.2f} ({w['dir']})")
    summary.append(f"Impulse period: {lab['start'].strftime('%Y-%m-%d %H:%M')} -> {lab['end'].strftime('%Y-%m-%d %H:%M')}")
else:
    summary.append("No clean 5-wave impulse sequence detected with the naive algorithm.")

# Identify latest major peak and trough
latest_peak = None
latest_trough = None
# find last max and min in extrema
for t,p,typ in reversed(ext_points):
    if not latest_peak and typ=='max': latest_peak=(t,p)
    if not latest_trough and typ=='min': latest_trough=(t,p)
    if latest_peak and latest_trough: break
if latest_peak: summary.append(f"Latest peak: {latest_peak[0].strftime('%Y-%m-%d %H:%M')} @ {latest_peak[1]:.2f}")
if latest_trough: summary.append(f"Latest trough: {latest_trough[0].strftime('%Y-%m-%d %H:%M')} @ {latest_trough[1]:.2f}")

# Uncertainty note
summary.append("Note: This is an automated, naive NeoWave/Elliott-like scan. Manual review needed for precise labeling.")

# Print summary to stdout and save to file
out = '\n'.join(summary)
print(out)
with open('C:/Users/sec/Desktop/BlindDrop_MVP/scripts/neowave_summary.txt','w',encoding='utf-8') as f:
    f.write(out)

# Plot price and extrema + labeled waves
plt.figure(figsize=(14,6))
plt.plot(df.index, df['close'], label='Close')
# plot extrema
xs_max = [t for t,p,typ in ext_points if typ=='max']
ys_max = [p for t,p,typ in ext_points if typ=='max']
xs_min = [t for t,p,typ in ext_points if typ=='min']
ys_min = [p for t,p,typ in ext_points if typ=='min']
plt.scatter(xs_max, ys_max, color='red', s=30, label='local max')
plt.scatter(xs_min, ys_min, color='green', s=30, label='local min')

# draw labels for detected impulse
if labels:
    lab = labels[-1]
    for idx,w in enumerate(lab['waves'], start=1):
        st = w['start_time']; en = w['end_time']
        sp = w['start_p']; ep = w['end_p']
        # annotate mid
        midt = st + (en-st)/2
        midp = (sp+ep)/2
        plt.text(en, ep, str(idx), fontsize=12, color='yellow', bbox=dict(facecolor='black', alpha=0.5))

plt.title(f'ETHUSDT {interval} - NeoWave naive scan')
plt.legend()
plt.tight_layout()
plt.savefig('C:/Users/sec/Desktop/BlindDrop_MVP/scripts/neowave_chart.png')
print('\nChart saved to scripts/neowave_chart.png')
