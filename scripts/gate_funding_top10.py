import requests
url='https://api.gateio.ws/api/v4/futures/usdt/tickers'
resp = requests.get(url, timeout=30)
resp.raise_for_status()
data = resp.json()
items = []
for d in data:
    fr = d.get('funding_rate')
    if fr is None:
        continue
    try:
        frf = float(fr)
    except:
        continue
    items.append((d.get('contract'), frf, float(d.get('last',0)), float(d.get('volume_24h',0))))
items_sorted = sorted(items, key=lambda x: x[1], reverse=True)
print('Top 10 contracts by funding_rate (positive highest)')
for c,fr,price,vol in items_sorted[:10]:
    print(f"{c}: {fr} => {fr*100:.5f}% , last={price}, vol24h={vol}")

items_abs = sorted(items, key=lambda x: abs(x[1]), reverse=True)
print('\nTop 10 by absolute funding magnitude')
for c,fr,price,vol in items_abs[:10]:
    print(f"{c}: {fr} => {fr*100:.5f}% , last={price}, vol24h={vol}")
