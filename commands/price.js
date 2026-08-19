const { getCoinPrice } = require('../services/coingecko');

// Common symbol-to-CoinGecko ID mappings
const SYMBOL_MAP = {
  btc: 'bitcoin',
  eth: 'ethereum',
  sol: 'solana',
  bnb: 'binancecoin',
  doge: 'dogecoin',
  xrp: 'ripple',
  ada: 'cardano',
  dot: 'polkadot',
  link: 'chainlink',
  trx: 'tron'
};

async function handlePriceCommand(ctx) {
  const query = ctx.match.trim().toLowerCase();
  
  if (!query) {
    return ctx.reply("⚠️ Usage: `/price btc` or `/price ethereum`", { parse_mode: 'Markdown' });
  }

  // Resolve mapped symbol or fallback to input query
  const coinId = SYMBOL_MAP[query] || query;
  const coin = await getCoinPrice(coinId);

  if (!coin) {
    return ctx.reply(`❌ Coin *"${query}"* not found. Try `/price btc` or `/price solana`.`, { parse_mode: 'Markdown' });
  }

  const changeSign = coin.price_change_percentage_24h >= 0 ? '+' : '';
  const changeEmoji = coin.price_change_percentage_24h >= 0 ? '📈' : '📉';

  const message = 
    `💰 *${coin.symbol.toUpperCase()} / ${coin.name}* ${changeEmoji}\n\n` +
    `*Price:* $${coin.current_price.toLocaleString()}\n` +
    `*24H Change:* ${changeSign}${coin.price_change_percentage_24h.toFixed(2)}%\n` +
    `*Market Cap:* $${(coin.market_cap / 1e9).toFixed(2)}B\n` +
    `*24H Volume:* $${(coin.total_volume / 1e9).toFixed(2)}B`;

  await ctx.reply(message, { parse_mode: 'Markdown' });
}

module.exports = { handlePriceCommand };
