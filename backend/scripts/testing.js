echo "=== TESTING ADDITIONAL FREE PROVIDERS ==="
echo ""

echo "1. MEXC (free, no key):"
curl -s --max-time 5 "https://api.mexc.com/api/v3/ticker/price?symbol=BTCUSDT" && echo " ✅" || echo " ❌"

echo ""
echo "2. Bitget (free, no key):"
curl -s --max-time 5 "https://api.bitget.com/api/v2/spot/market/tickers?symbol=BTCUSDT" && echo " ✅" || echo " ❌"

echo ""
echo "3. Bitfinex (free, no key):"
curl -s --max-time 5 "https://api-pub.bitfinex.com/v2/ticker/tBTCUSD" && echo " ✅" || echo " ❌"

echo ""
echo "4. Huobi/HTX (free, no key):"
curl -s --max-time 5 "https://api.huobi.pro/market/detail/merged?symbol=btcusdt" && echo " ✅" || echo " ❌"

echo ""
echo "5. CoinGecko free API (alternative endpoint):"
curl -s --max-time 5 "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd" && echo " ✅" || echo " ❌"

echo ""
echo "6. CoinDesk (Bitcoin only, free):"
curl -s --max-time 5 "https://api.coindesk.com/v1/bpi/currentprice.json" | head -c 100 && echo " ✅" || echo " ❌"

echo ""
echo "7. CoinGecko free API key (sign up at coingecko.com):"
echo "   https://www.coingecko.com/en/api/pricing"
echo "   Free tier: 30 req/min (same as public, but more reliable)"

echo ""
echo "8. TwelveData free API key:"
echo "   https://twelvedata.com/apikey"
echo "   Free: 800 req/day, 8 req/min"
echo "   You already have a key: 791a3718a5e5450fa008177fed4848d5"

echo ""
echo "9. Alpha Vantage free API key:"
echo "   https://www.alphavantage.co/support/#api-key"
echo "   Free: 25 req/day"
echo "   Supports: Crypto + Forex"

echo ""
echo "10. Finnhub free API key:"
echo "   https://finnhub.io/register"
echo "   Free: 60 req/min"
echo "   Supports: Crypto + Forex + Stocks"

echo ""
echo "=== DONE ==="