const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  telegramId: { type: Number, required: true },
  coinId: { type: String, required: true },
  targetPrice: { type: Number, required: true },
  direction: { type: String, enum: ['above', 'below'], required: true },
  triggered: { type: Boolean, default: false }
});

module.exports = mongoose.model('Alert', AlertSchema);
