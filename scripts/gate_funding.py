import requests
url='https://api.gateio.ws/api/v4/futures/usdt/tickers'
resp = requests.get(url, timeout=30)
resp.raise_for_status()
print(len(resp.content))
print(resp.json()[:3])
