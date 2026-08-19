require('dotenv').config();
const { Bot, InlineKeyboard } = require('grammy');
const connectDB = require('./config/db');
const User = require('./models/User');
const { getCoinPrice, getTrendingCoins, getGlobalMarket } = require('./services/coingecko');

const bot = new Bot(process.env.BOT_TOKEN);

// Global Error Handler for grammY
bot.catch((err) => {
  console.error('Error in bot middleware:', err);
});

async function startApp() {
  try {
    // Wait for MongoDB connection BEFORE starting the bot
    await connectDB();
    
    bot.start();
    console.log("🚀 CryptoPulse Bot is running...");
  } catch (error) {
    console.error("Failed to start application:", error);
  }
}

// Map common symbols to CoinGecko IDs
const SYMBOL_MAP = {
  btc: 'bitcoin',
  eth: 'ethereum',
  sol: 'solana',
  bnb: 'binancecoin',
  doge: 'dogecoin',
  xrp: 'ripple'
};

// Command handlers...
bot.command('start', async (ctx) => {
  // ... your start logic
});

// Launch the app
startApp();
  const username = ctx.from.username || ctx.from.first_name;
  const startParam = ctx.match; // captures referral payload (e.g. t.me/bot?start=12345)

  let user = await User.findOne({ telegramId });

  if (!user) {
    let referredBy = null;
    if (startParam && !isNaN(startParam) && parseInt(startParam) !== telegramId) {
      referredBy = parseInt(startParam);
      await User.findOneAndUpdate({ telegramId: referredBy }, { $inc: { points: 100 } });
    }

    user = await User.create({
      telegramId,
      username,
      referralCode: telegramId.toString(),
      referredBy,
      points: referredBy ? 50 : 0
    });
  }

  const welcomeMenu = new InlineKeyboard()
    .text("📊 Market Summary", "menu_global")
    .text("🔥 Trending", "menu_trending").row()
    .text("💼 Portfolio", "menu_portfolio")
    .text("👥 Invite & Earn", "menu_referral");

  await ctx.reply(
    `⚡ *Welcome to CryptoPulse Bot!*\n\nYour 24/7 crypto companion for live prices, market updates, alerts, and portfolio tracking.`,
    { parse_mode: 'Markdown', reply_markup: welcomeMenu }
  );
});

// Command: /price <coin>
bot.command('price', async (ctx) => {
  const query = ctx.match.trim().toLowerCase();
  if (!query) return ctx.reply("⚠️ Usage: `/price btc` or `/price ethereum`", { parse_mode: 'Markdown' });

  const coinId = SYMBOL_MAP[query] || query;
  const coin = await getCoinPrice(coinId);

  if (!coin) {
    return ctx.reply("❌ Coin not found. Try `/price btc` or `/price solana`.", { parse_mode: 'Markdown' });
  }

  const changeSign = coin.price_change_percentage_24h >= 0 ? '+' : '';
  const message = 
    `💰 *${coin.symbol.toUpperCase()} / ${coin.name}*\n\n` +
    `*Price:* $${coin.current_price.toLocaleString()}\n` +
    `*24H Change:* ${changeSign}${coin.price_change_percentage_24h.toFixed(2)}%\n` +
    `*Market Cap:* $${(coin.market_cap / 1e9).toFixed(2)}B\n` +
    `*24H Volume:* $${(coin.total_volume / 1e9).toFixed(2)}B`;

  await ctx.reply(message, { parse_mode: 'Markdown' });
});

// Callback: Global Market Snapshot
bot.callbackQuery('menu_global', async (ctx) => {
  await ctx.answerCallbackQuery();
  const global = await getGlobalMarket();
  if (!global) return ctx.reply("Unable to fetch global data currently.");

  const msg = 
    `🌎 *GLOBAL MARKET OVERVIEW*\n\n` +
    `*Total Market Cap:* $${(global.total_market_cap.usd / 1e12).toFixed(2)}T\n` +
    `*24H Volume:* $${(global.total_volume.usd / 1e9).toFixed(2)}B\n` +
    `*BTC Dominance:* ${global.market_cap_percentage.btc.toFixed(1)}%\n` +
    `*Active Cryptos:* ${global.active_cryptocurrencies.toLocaleString()}`;

  await ctx.reply(msg, { parse_mode: 'Markdown' });
});

// Callback: Trending Coins
bot.callbackQuery('menu_trending', async (ctx) => {
  await ctx.answerCallbackQuery();
  const list = await getTrendingCoins();
  
  let text = `🔥 *TRENDING CRYPTO*\n\n`;
  list.forEach((item, index) => {
    text += `${index + 1}. *${item.item.symbol}* (${item.item.name})\n`;
  });

  await ctx.reply(text, { parse_mode: 'Markdown' });
});

// Callback: Referral System
bot.callbackQuery('menu_referral', async (ctx) => {
  await ctx.answerCallbackQuery();
  const user = await User.findOne({ telegramId: ctx.from.id });

  const botInfo = await bot.api.getMe();
  const refLink = `https://t.me/${botInfo.username}?start=${ctx.from.id}`;

  const msg = 
    `👥 *INVITE & EARN*\n\n` +
    `*Your Points:* ${user ? user.points : 0}\n\n` +
    `Share your referral link with friends to earn points:\n` +
    `\`${refLink}\``;

  await ctx.reply(msg, { parse_mode: 'Markdown' });
});

bot.start();
console.log("🚀 CryptoPulse Bot is running...");
