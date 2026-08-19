const cron = require('node-cron');
const Alert = require('../models/Alert');
const User = require('../models/User');
const { getCoinPrice, getGlobalMarket } = require('./coingecko');

function startCronJobs(bot) {
  // 1. Check price alerts every 1 minute
  cron.schedule('* * * * *', async () => {
    const activeAlerts = await Alert.find({ triggered: false });

    for (let alert of activeAlerts) {
      const data = await getCoinPrice(alert.coinId);
      if (!data) continue;

      const currentPrice = data.current_price;
      let isTriggered = false;

      if (alert.direction === 'above' && currentPrice >= alert.targetPrice) {
        isTriggered = true;
      } else if (alert.direction === 'below' && currentPrice <= alert.targetPrice) {
        isTriggered = true;
      }

      if (isTriggered) {
        alert.triggered = true;
        await alert.save();

        await bot.api.sendMessage(
          alert.telegramId,
          `🚨 *PRICE ALERT*\n\n` +
          `*${data.symbol.toUpperCase()}* has reached your target!\n\n` +
          `*Current Price:* $${currentPrice.toLocaleString()}\n` +
          `*Target:* $${alert.targetPrice.toLocaleString()}`,
          { parse_mode: 'Markdown' }
        );
      }
    }
  });

  // 2. Broadcast Daily Summary every morning at 08:00 AM
  cron.schedule('0 8 * * *', async () => {
    const users = await User.find({ "notifications.dailySummary": true });
    const btc = await getCoinPrice('bitcoin');
    const eth = await getCoinPrice('ethereum');
    const sol = await getCoinPrice('solana');
    const global = await getGlobalMarket();

    const summary = 
      `🌅 *DAILY CRYPTO PULSE*\n\n` +
      `*BTC:* $${btc?.current_price.toLocaleString()} (${btc?.price_change_percentage_24h.toFixed(1)}%)\n` +
      `*ETH:* $${eth?.current_price.toLocaleString()} (${eth?.price_change_percentage_24h.toFixed(1)}%)\n` +
      `*SOL:* $${sol?.current_price.toLocaleString()} (${sol?.price_change_percentage_24h.toFixed(1)}%)\n\n` +
      `*Market Cap:* $${(global?.total_market_cap?.usd / 1e12).toFixed(2)}T\n` +
      `*BTC Dominance:* ${global?.market_cap_percentage?.btc.toFixed(1)}%`;

    for (let user of users) {
      try {
        await bot.api.sendMessage(user.telegramId, summary, { parse_mode: 'Markdown' });
      } catch (err) {
        // Handle blocked users
      }
    }
  });
}

module.exports = startCronJobs;
