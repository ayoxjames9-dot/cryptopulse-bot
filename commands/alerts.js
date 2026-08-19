const Alert = require('../models/Alert');

const SYMBOL_MAP = {
  btc: 'bitcoin',
  eth: 'ethereum',
  sol: 'solana',
  bnb: 'binancecoin',
  doge: 'dogecoin',
  xrp: 'ripple'
};

// Set New Price Alert
async function handleSetAlertCommand(ctx) {
  const args = ctx.match.trim().split(/\s+/);

  if (args.length < 3) {
    return ctx.reply(
      "⚠️ Usage: `/alert <coin> <target_price> <above/below>`\n\nExamples:\n`/alert btc 120000 above`\n`/alert eth 3000 below`",
      { parse_mode: 'Markdown' }
    );
  }

  const symbol = args[0].toLowerCase();
  const targetPrice = parseFloat(args[1]);
  const direction = args[2].toLowerCase();

  if (isNaN(targetPrice) || targetPrice <= 0) {
    return ctx.reply("❌ Target price must be a valid number.");
  }

  if (!['above', 'below'].includes(direction)) {
    return ctx.reply("❌ Direction must be either `above` or `below`.", { parse_mode: 'Markdown' });
  }

  const coinId = SYMBOL_MAP[symbol] || symbol;

  await Alert.create({
    telegramId: ctx.from.id,
    coinId,
    targetPrice,
    direction
  });

  await ctx.reply(
    `🚨 *ALERT CREATED*\n\nYou will receive a notification when *${symbol.toUpperCase()}* goes *${direction}* $${targetPrice.toLocaleString()}.`,
    { parse_mode: 'Markdown' }
  );
}

// List Active Alerts
async function handleListAlertsCommand(ctx) {
  const alerts = await Alert.find({ telegramId: ctx.from.id, triggered: false });

  if (alerts.length === 0) {
    return ctx.reply("🔔 You have no active price alerts. Set one with `/alert btc 120000 above`.", { parse_mode: 'Markdown' });
  }

  let text = `🚨 *YOUR ACTIVE ALERTS*\n\n`;
  alerts.forEach((a, index) => {
    text += `${index + 1}. *${a.coinId.toUpperCase()}* ${a.direction} $${a.targetPrice.toLocaleString()}\n`;
  });

  await ctx.reply(text, { parse_mode: 'Markdown' });
}

module.exports = { handleSetAlertCommand, handleListAlertsCommand };
