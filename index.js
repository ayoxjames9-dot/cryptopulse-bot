require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const axios = require('axios');

// 1. Environment Variables Guard
const botToken = process.env.BOT_TOKEN;
const mongoURI = process.env.MONGO_URI;
const coinGeckoKey = process.env.COINGECKO_API_KEY;

if (!botToken || !mongoURI) {
  console.error("FATAL ERROR: BOT_TOKEN or MONGO_URI is missing.");
  process.exit(1);
}

const getHeaders = () => (coinGeckoKey ? { 'x-cg-demo-api-key': coinGeckoKey } : {});

// 2. Connect to Database
mongoose.connect(mongoURI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Error:", err.message);
    process.exit(1);
  });

// 3. Initialize Telegram Bot
const bot = new TelegramBot(botToken, { polling: true });
console.log("🤖 CryptoPulse Bot is live...");

// 4. Custom Welcoming Message Handler
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'Trader';

  const welcomeText = `
👋 *Welcome to CryptoPulse, ${firstName}!* 🚀

Your 24/7 assistant for real-time crypto prices, top market trends, and live network stats.

👇 *Quick Navigation Options:*
`;

  // Interactive Inline Keyboard
  const options = {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🏆 Top 5 Cryptos", callback_data: "cmd_top" },
          { text: "🔥 Trending", callback_data: "cmd_trending" }
        ],
        [
          { text: "⛽ Gas Tracker", callback_data: "cmd_gas" },
          { text: "❓ Help & Usage", callback_data: "cmd_help" }
        ]
      ]
    }
  };

  bot.sendMessage(chatId, welcomeText, options);
});

// 5. Handle Inline Button Clicks
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  // Acknowledge the button press to remove the loading spinner
  bot.answerCallbackQuery(query.id);

  if (data === "cmd_top") {
    fetchTopCryptos(chatId);
  } else if (data === "cmd_trending") {
    fetchTrending(chatId);
  } else if (data === "cmd_gas") {
    fetchGas(chatId);
  } else if (data === "cmd_help") {
    sendHelp(chatId);
  }
});

// Helper Functions
async function fetchTopCryptos(chatId) {
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
    bot.sendMessage(chatId, "❌ Could not fetch top markets.");
  }
}

async function fetchTrending(chatId) {
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
}

async function fetchGas(chatId) {
  try {
    const res = await axios.get('https://api.owlracle.info/v4/eth/gas');
    const speeds = res.data.speeds;
    const message = `⛽ *Ethereum Gas Tracker*\n\n🐢 Low: ~${Math.round(speeds[0].gasPrice)} Gwei\n🚗 Avg: ~${Math.round(speeds[1].gasPrice)} Gwei\n🚀 Fast: ~${Math.round(speeds[2].gasPrice)} Gwei`;
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (err) {
    bot.sendMessage(chatId, "❌ Failed to retrieve gas data.");
  }
}

function sendHelp(chatId) {
  const helpMsg = `
📊 *CryptoPulse Help Menu*

• /price <coin> - Get live price (e.g. \`/price bitcoin\`)
• /top - View top 5 cryptos
• /trending - See trending coins
• /gas - Check Ethereum gas fees
• /ping - Check bot response time
  `;
  bot.sendMessage(chatId, helpMsg, { parse_mode: 'Markdown' });
}

// 6. Direct Command Handlers
bot.onText(/\/help/, (msg) => sendHelp(msg.chat.id));
bot.onText(/\/top/, (msg) => fetchTopCryptos(msg.chat.id));
bot.onText(/\/trending/, (msg) => fetchTrending(msg.chat.id));
bot.onText(/\/gas/, (msg) => fetchGas(msg.chat.id));

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
      bot.sendMessage(chatId, `⚠️ Coin "${coin}" not found.`);
    }
  } catch (err) {
    bot.sendMessage(chatId, "❌ Failed to fetch price data.");
  }
});

bot.on('polling_error', (err) => console.error('Polling Error:', err.message));
