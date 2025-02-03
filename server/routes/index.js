const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const achievementRoutes = require('./achievementRoutes');
const drinkingLogRoutes = require('./drinkingLog');
const leaderboardRoutes = require('./leaderboardRoutes');
const userRoutes = require('./userRoutes');

router.use('/auth', authRoutes);
router.use('/achievements', achievementRoutes);
router.use('/drinkingLogs', drinkingLogRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/users', userRoutes);

module.exports = router;
