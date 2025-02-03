// server/models/Achievement.js
const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  key: { type: String, unique: true }, // e.g. "3_days_sober"
  title: String,
  description: String,
  // how many "points" or "value" the achievement is worth, etc.
  points: { type: Number, default: 1 },
});

module.exports = mongoose.model('Achievement', achievementSchema);
