require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');

// 1. Check for Required Environment Variables
const botToken = process.env.BOT_TOKEN;
const mongoURI = process.env.MONGO_URI;

if (!botToken) {
  console.error("FATAL ERROR: BOT_TOKEN is missing in environment variables.");
  process.exit(1);
}

if (!mongoURI) {
  console.error("FATAL ERROR: MONGO_URI is missing in environment variables.");
  process.exit(1);
}

// 2. Connect to MongoDB
mongoose.connect(mongoURI)
  .then(() => console.log("✅ Successfully connected to MongoDB!"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Failed:", err.message);
    process.exit(1);
  });

// 3. Initialize Telegram Bot (Polling Mode)
const bot = new TelegramBot(botToken, { polling: true });

console.log("🤖 CryptoPulse Bot is running...");

// 4. Basic Bot Commands
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'there';
  bot.sendMessage(chatId, `Hello ${firstName}! Welcome to CryptoPulse Bot 🚀\nType /help to see available commands.`);
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Available Commands:\n/start - Welcome message\n/ping - Test bot responsiveness");
});

bot.onText(/\/ping/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Pong! 🏓 Bot is active.");
});

// 5. Handle Unexpected Errors
bot.on('polling_error', (error) => {
  console.error('Polling Error:', error.code || error.message);
});
