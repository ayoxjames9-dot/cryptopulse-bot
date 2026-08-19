require('dotenv').config();
const { Bot, InlineKeyboard } = require('grammy');
const connectDB = require('./config/db');
const User = require('./models/User');

// Initialize the Telegram Bot
const bot = new Bot(process.env.BOT_TOKEN);

// Global Error Handler
bot.catch((err) => {
  console.error('Error in bot middleware:', err);
});

// Command: /start
bot.command('start', async (ctx) => {
  try {
    const telegramId = ctx.from.id;
    let user = await User.findOne({ telegramId });

    if (!user) {
      user = await User.create({
        telegramId,
        username: ctx.from.username || '',
        firstName: ctx.from.first_name || 'User'
      });
    }

    await ctx.reply(`Welcome ${ctx.from.first_name} to CryptoPulse! 🚀\nUse /price <symbol> to check market rates.`);
  } catch (error) {
    console.error('Start Command Error:', error);
    await ctx.reply('An error occurred while setting up your profile.');
  }
});

// App Startup Function
async function startApp() {
  try {
    // Wait for MongoDB before starting the bot
    await connectDB();
    
    bot.start();
    console.log("🚀 CryptoPulse Bot is running...");
  } catch (error) {
    console.error("Failed to start application:", error);
  }
}

startApp();
