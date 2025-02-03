// server/models/DrinkingLog.js
const mongoose = require('mongoose');

const drinkingLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['sober', 'medium', 'heavy'], required: true },
});

module.exports = mongoose.model('DrinkingLog', drinkingLogSchema);
