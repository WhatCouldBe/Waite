// server/models/UserAchievement.js
const mongoose = require('mongoose');

const userAchievementSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  achievement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement',
    required: true,
  },
  unlockedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('UserAchievement', userAchievementSchema);
