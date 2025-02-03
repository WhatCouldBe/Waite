const express = require('express');
const router = express.Router();
const Achievement = require('../models/Achievement');
const User = require('../models/User');

router.get('/', async (req, res) => {
  try {
    const all = await Achievement.find({});
    return res.json({ success: true, achievements: all });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    const all = await Achievement.find({});
    const unlockedSet = new Set(user.unlockedAchievements || []);

    const combined = all.map((ach) => ({
      ...ach.toObject(),
      isUnlocked: unlockedSet.has(ach.key),
    }));
    return res.json({ success: true, achievements: combined });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
