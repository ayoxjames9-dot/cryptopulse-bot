const User = require('../models/User');
const { getCoinPrice } = require('../services/coingecko');

const SYMBOL_MAP = {
  btc: 'bitcoin',
  eth: 'ethereum',
  sol: 'solana',
  bnb: 'binancecoin',
  doge: 'dogecoin',
  xrp: 'ripple'
};

// View Portfolio
async function handlePortfolioCommand(ctx) {
  const telegramId = ctx.from.id;
  const user = await User.findOne({ telegramId });

  if (!user || !user.portfolio || user.portfolio.length === 0) {
    return ctx.reply(
      `💼 *MY PORTFOLIO*\n\nYour portfolio is currently empty!\n\nAdd assets using:\n\`/addportfolio btc 0.5\`\n\`/addportfolio eth 2.0\``,
      { parse_mode: 'Markdown' }
    );
  }

  await ctx.replyWithChatAction('typing');

  let totalValue = 0;
  let summaryLines = [];

  for (const asset of user.portfolio) {
    const coinData = await getCoinPrice(asset.coinId);
    const price = coinData ? coinData.current_price : 0;
    const value = asset.amount * price;
    totalValue += value;

    summaryLines.push(`${asset.symbol.toUpperCase().padEnd(6)} $${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  }

  const message = 
    `💼 *MY PORTFOLIO*\n\n` +
    `\`\`\`\n` +
    summaryLines.join('\n') + '\n' +
    `----------------\n` +
    `TOTAL   $${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
    `\`\`\``;

  await ctx.reply(message, { parse_mode: 'Markdown' });
}

// Add Asset to Portfolio
async function handleAddPortfolioCommand(ctx) {
  const args = ctx.match.trim().split(/\s+/);
  if (args.length < 2) {
    return ctx.reply("⚠️ Usage: `/addportfolio <coin> <amount>`\nExample: `/addportfolio btc 0.5`", { parse_mode: 'Markdown' });
  }

  const symbol = args[0].toLowerCase();
  const amount = parseFloat(args[1]);

  if (isNaN(amount) || amount <= 0) {
    return ctx.reply("❌ Please enter a valid positive number for the amount.");
  }

  const coinId = SYMBOL_MAP[symbol] || symbol;
  const telegramId = ctx.from.id;

  let user = await User.findOne({ telegramId });
  if (!user) {
    user = new User({ telegramId, username: ctx.from.username });
  }

  const existingAssetIndex = user.portfolio.findIndex(item => item.symbol.toLowerCase() === symbol);

  if (existingAssetIndex > -1) {
    user.portfolio[existingAssetIndex].amount += amount;
  } else {
    user.portfolio.push({ coinId, symbol, amount });
  }

  await user.save();
  await ctx.reply(`✅ Added *${amount} ${symbol.toUpperCase()}* to your portfolio! Check with /portfolio.`, { parse_mode: 'Markdown' });
}

module.exports = { handlePortfolioCommand, handleAddPortfolioCommand };
