// server/routes/leaderboardRoutes.js
const express = require('express');
const router = express.Router();
const Leaderboard = require('../models/Leaderboard');
const UserAchievement = require('../models/UserAchievement');
const User = require('../models/User');
const DrinkingLog = require('../models/DrinkingLog'); // For days sober count
const bcrypt = require('bcryptjs'); // Changed to bcryptjs

// Helper to generate a random 5-letter code.
function generateCode() {
  let code = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 0; i < 5; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

// Route: Create a new leaderboard (only one per user).
router.post('/create', async (req, res) => {
  try {
    const { name, userId } = req.body;
    if (!name || !userId) {
      return res.status(400).json({ success: false, error: 'Name and userId are required.' });
    }
    // Check if user already created a leaderboard.
    const existing = await Leaderboard.findOne({ createdBy: userId });
    if (existing) {
      return res.status(400).json({ success: false, error: 'You have already created a leaderboard.' });
    }
    let code;
    for (let i = 0; i < 5; i++) {
      code = generateCode();
      const conflict = await Leaderboard.findOne({ code });
      if (!conflict) break;
    }
    const leaderboard = new Leaderboard({
      name,
      code,
      createdBy: userId,
      participants: [userId],
      scores: [{ user: userId, achievements: 0, daysSober: 0, redDays: 0 }]
    });
    await leaderboard.save();
    const populatedLb = await Leaderboard.findById(leaderboard._id)
      .populate('createdBy participants scores.user', 'name');
    res.json({ success: true, leaderboard: populatedLb });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Route: Join a leaderboard using a code.
router.post('/join', async (req, res) => {
  try {
    const { code, userId } = req.body;
    if (!code || !userId) {
      return res.status(400).json({ success: false, error: 'Code and userId are required.' });
    }
    let leaderboard = await Leaderboard.findOne({ code });
    if (!leaderboard) {
      return res.status(404).json({ success: false, error: 'Leaderboard not found.' });
    }
    if (leaderboard.participants.includes(userId)) {
      leaderboard = await Leaderboard.findById(leaderboard._id)
        .populate('createdBy participants scores.user', 'name');
      return res.json({ success: true, leaderboard });
    }
    if (leaderboard.participants.length >= 20) {
      return res.status(400).json({ success: false, error: 'Leaderboard is full.' });
    }
    leaderboard.participants.push(userId);
    leaderboard.scores.push({ user: userId, achievements: 0, daysSober: 0, redDays: 0 });
    await leaderboard.save();
    leaderboard = await Leaderboard.findById(leaderboard._id)
      .populate('createdBy participants scores.user', 'name');
    res.json({ success: true, leaderboard });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper: update a leaderboard's scores (daysSober and achievements).
async function updateLeaderboardScores(lb) {
  for (const score of lb.scores) {
    if (score.user && score.user._id) {
      const achievementCount = await UserAchievement.countDocuments({ user: score.user._id });
      score.achievements = achievementCount;
      const daysSober = await DrinkingLog.countDocuments({ 
        user: score.user._id, 
        status: { $in: ['sober', 'medium'] }
      });
      score.daysSober = daysSober;
    }
  }
  return lb;
}

// Route: Get all leaderboards for a user.
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const leaderboards = await Leaderboard.find({ participants: userId })
      .populate('createdBy participants scores.user', 'name');
    for (let lb of leaderboards) {
      lb = await updateLeaderboardScores(lb);
    }
    res.json({ success: true, leaderboards });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Route: Get a specific leaderboard.
router.get('/:id', async (req, res) => {
  try {
    let leaderboard = await Leaderboard.findById(req.params.id)
      .populate('createdBy participants scores.user', 'name');
    if (!leaderboard) return res.status(404).json({ success: false, error: 'Leaderboard not found.' });
    leaderboard = await updateLeaderboardScores(leaderboard);
    res.json({ success: true, leaderboard });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/delete', async (req, res) => {
  try {
    const { leaderboardId, userId, password } = req.body;
    if (!leaderboardId || !userId || !password) {
      return res.status(400).json({ success: false, error: 'Correct Password Required' });
    }
    const leaderboard = await Leaderboard.findById(leaderboardId);
    if (!leaderboard) {
      return res.status(404).json({ success: false, error: 'Leaderboard not found.' });
    }
    if (leaderboard.createdBy.toString() !== userId) {
      return res.status(403).json({ success: false, error: 'You are not authorized to delete this leaderboard.' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(403).json({ success: false, error: 'Invalid password.' });
    }
    await Leaderboard.findByIdAndDelete(leaderboardId);
    res.json({ success: true, message: 'Leaderboard deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
