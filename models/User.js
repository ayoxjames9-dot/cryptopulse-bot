const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  telegramId: { type: Number, required: true, unique: true },
  username: String,
  referralCode: String,
  referredBy: Number,
  points: { type: Number, default: 0 },
  portfolio: [
    {
      coinId: String,  // e.g., 'bitcoin'
      symbol: String,  // e.g., 'BTC'
      amount: Number   // e.g., 0.5
    }
  ],
  notifications: {
    priceAlerts: { type: Boolean, default: true },
    dailySummary: { type: Boolean, default: true }
  }
});

module.exports = mongoose.model('User', UserSchema);
