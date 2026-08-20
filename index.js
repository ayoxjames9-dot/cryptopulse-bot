require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const axios = require('axios');

// 1. Environment Guard
const botToken = process.env.BOT_TOKEN;
const mongoURI = process.env.MONGO_URI;
const coinGeckoKey = process.env.COINGECKO_API_KEY;

if (!botToken || !mongoURI) {
  console.error("FATAL ERROR: BOT_TOKEN or MONGO_URI is missing.");
  process.exit(1);
}

// Helper for CoinGecko Headers
const getHeaders = () => (coinGeckoKey ? { 'x-cg-demo-api-key': coinGeckoKey } : {});

// 2. Database Connection
mongoose.connect(mongoURI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Error:", err.message);
    process.exit(1);
  });

// 3. Initialize Bot
const bot = new TelegramBot(botToken, { polling: true });
console.log("🤖 CryptoPulse Bot updated & online...");

// 4. Command Handlers

// /start & /help
bot.onText(/\/(start|help)/, (msg) => {
  const helpMessage = `
📊 *CryptoPulse Bot Commands*

• /price <coin> - Get live price (e.g. \`/price bitcoin\`)
• /top - View top 5 cryptos by market cap
• /trending - See trending coins on CoinGecko
• /gas - Check live Ethereum gas fees
• /ping - Check if bot is active
  `;
  bot.sendMessage(msg.chat.id, helpMessage, { parse_mode: 'Markdown' });
});

// /price <coin>
bot.onText(/\/price (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const coin = match[1].toLowerCase().trim();

  try {
    const res = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
      params: { ids: coin, vs_currencies: 'usd', include_24hr_change: true },
      headers: getHeaders()
    });

    if (res.data[coin]) {
      const price = res.data[coin].usd;
      const change = res.data[coin].usd_24h_change.toFixed(2);
      const symbol = change >= 0 ? '📈 +' : '📉 ';
      bot.sendMessage(chatId, `💰 *${coin.toUpperCase()}*\nPrice: $${price.toLocaleString()} USD\n24h Change: ${symbol}${change}%`, { parse_mode: 'Markdown' });
    } else {
      bot.sendMessage(chatId, `⚠️ Coin "${coin}" not found. Try full names like \`bitcoin\` or \`ethereum\`.`, { parse_mode: 'Markdown' });
    }
  } catch (err) {
    bot.sendMessage(chatId, "❌ Failed to fetch price data.");
  }
});

// /top (Top 5 Cryptos)
bot.onText(/\/top/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const res = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: { vs_currency: 'usd', order: 'market_cap_desc', per_page: 5, page: 1 },
      headers: getHeaders()
    });

    let message = "🏆 *Top 5 Cryptocurrencies*\n\n";
    res.data.forEach((c, idx) => {
      const change = c.price_change_percentage_24h.toFixed(2);
      const icon = change >= 0 ? '🟢' : '🔴';
      message += `${idx + 1}. *${c.name}* (${c.symbol.toUpperCase()}): $${c.current_price.toLocaleString()} | ${icon} ${change}%\n`;
    });

    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (err) {
    bot.sendMessage(chatId, "❌ Could not retrieve top markets.");
  }
});

// /trending
bot.onText(/\/trending/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const res = await axios.get('https://api.coingecko.com/api/v3/search/trending', { headers: getHeaders() });
    const coins = res.data.coins.slice(0, 5);

    let message = "🔥 *Trending Searches*\n\n";
    coins.forEach((item, idx) => {
      message += `${idx + 1}. *${item.item.name}* (${item.item.symbol})\n`;
    });

    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (err) {
    bot.sendMessage(chatId, "❌ Could not fetch trending coins.");
  }
});

// /gas (Ethereum Gas Tracker)
bot.onText(/\/gas/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const res = await axios.get('https://api.owlracle.info/v4/eth/gas');
    const speeds = res.data.speeds;
    
    const message = `
⛽ *Ethereum Gas Tracker*

🐢 Low: ~${Math.round(speeds[0].gasPrice)} Gwei
🚗 Avg: ~${Math.round(speeds[1].gasPrice)} Gwei
🚀 Fast: ~${Math.round(speeds[2].gasPrice)} Gwei
    `;
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (err) {
    bot.sendMessage(chatId, "❌ Failed to retrieve gas data.");
  }
});

// /ping
bot.onText(/\/ping/, (msg) => bot.sendMessage(msg.chat.id, "Pong! 🏓 Bot is active."));

bot.on('polling_error', (err) => console.error('Polling Error:', err.message));
