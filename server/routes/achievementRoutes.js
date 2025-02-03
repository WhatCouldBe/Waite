const express = require('express');
const router = express.Router();
const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');

router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId;
    const achievements = await Achievement.find().exec();
    const userUnlocked = await UserAchievement.find({ user: userId }).exec();
    const unlockedSet = new Set(userUnlocked.map((ua) => ua.achievement.toString()));
    const result = achievements.map((ach) => ({
      _id: ach._id,
      key: ach.key,
      name: ach.title, // use title from schema as the name
      description: ach.description,
      points: ach.points,
      unlocked: unlockedSet.has(ach._id.toString()),
    }));
    res.json({ success: true, achievements: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/check', async (req, res) => {
  try {
    const userId = req.body.userId;
    res.json({ success: true, message: 'Achievements checked' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
