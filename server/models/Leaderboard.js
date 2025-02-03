const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const leaderboardScoreSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  achievements: { type: Number, default: 0 },
  daysSober: { type: Number, default: 0 },
  redDays: { type: Number, default: 0 }
});

const leaderboardSchema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true }, // 5-letter code
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: Schema.Types.ObjectId, ref: 'User' }], // up to 20 people
  scores: [leaderboardScoreSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Leaderboard', leaderboardSchema);
