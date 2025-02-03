const express = require('express');
const router = express.Router();
const DrinkingLog = require('../models/DrinkingLog');
const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');

router.get('/all', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId)
      return res.status(400).json({ success: false, error: 'Missing userId' });
    const now = new Date();
    const past = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const logs = await DrinkingLog.find({
      user: userId,
      date: { $gte: past, $lte: now },
    });
    return res.json({ success: true, logs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET logs for a specific month
router.get('/:year/:month', async (req, res) => {
  try {
    const { userId } = req.query;
    const { year, month } = req.params;
    const startDate = new Date(year, month - 1, 1, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    const logs = await DrinkingLog.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate },
    });
    return res.json({ success: true, logs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST update a day's log
router.post('/day', async (req, res) => {
  try {
    const { userId, date, status } = req.body;
    if (!userId)
      return res.status(400).json({ success: false, error: 'No userId' });
    const [y, m, d] = date.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d, 12);
    let log = await DrinkingLog.findOne({ user: userId, date: dateObj });
    if (!log) {
      log = new DrinkingLog({ user: userId, date: dateObj });
    }
    log.status = status;
    await log.save();

    await checkAndUnlockAchievements(userId);

    return res.json({ success: true, log });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Check and update achievements for the user.
 * Conditions:
 *  - "first_log": if at least one log exists.
 *  - "double_digit_days": if any calendar month has ≥ 10 logs (any status).
 *  - "5_days_straight_sober": if there are 5 consecutive days with status in ['sober', 'medium'].
 *  - "10_days_straight_sober": if there are 10 consecutive days with status in ['sober', 'medium'].
 *  - "1_month_sober": if there are 30 consecutive days with status in ['sober', 'medium'].
 *  - "half_year_sober": if there are 180 consecutive days.
 *  - "year_sober": if there are 365 consecutive days.
 *  - "1_month_dry": if any complete calendar month is strictly 'sober'.
 *  - "1_month_since_last_crashout": if the gap since the last 'heavy' log is ≥ 30 days.
 *  - "weekend_warrior": if any Saturday–Sunday pair are both in ['sober','medium'].
 */
async function checkAndUnlockAchievements(userId) {
  try {
    const logs = await DrinkingLog.find({ user: userId }).sort({ date: 1 });
    let unlocked = new Set();

    // first_log:
    if (logs.length >= 1) unlocked.add('first_log');

    // double_digit_days:
    const monthCounts = {};
    logs.forEach((log) => {
      const d = new Date(log.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthCounts[key] = (monthCounts[key] || 0) + 1;
    });
    for (const key in monthCounts) {
      if (monthCounts[key] >= 10) {
        unlocked.add('double_digit_days');
        break;
      }
    }

    // Consecutive streak (sober or medium)
    let streak = 0;
    let maxStreak = 0;
    let prev = null;
    logs.forEach((log) => {
      if (log.status === 'sober' || log.status === 'medium') {
        if (prev) {
          const diff = (log.date - prev) / (1000 * 60 * 60 * 24);
          if (Math.round(diff) === 1) {
            streak += 1;
          } else {
            streak = 1;
          }
        } else {
          streak = 1;
        }
      } else {
        streak = 0;
      }
      if (streak > maxStreak) maxStreak = streak;
      prev = log.date;
    });
    if (maxStreak >= 5) unlocked.add('5_days_straight_sober');
    if (maxStreak >= 10) unlocked.add('10_days_straight_sober');
    if (maxStreak >= 30) unlocked.add('1_month_sober');
    if (maxStreak >= 180) unlocked.add('half_year_sober');
    if (maxStreak >= 365) unlocked.add('year_sober');

    // 1_month_dry: For each calendar month, check if every day is strictly 'sober'
    const monthLogs = {};
    logs.forEach((log) => {
      const d = new Date(log.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthLogs[key]) monthLogs[key] = {};
      monthLogs[key][d.getDate()] = log.status;
    });
    for (const key in monthLogs) {
      const [yearStr, monthStr] = key.split('-');
      const year = parseInt(yearStr);
      const month = parseInt(monthStr);
      const daysInMonth = new Date(year, month, 0).getDate();
      const daysObj = monthLogs[key];
      if (Object.keys(daysObj).length === daysInMonth) {
        let allSober = true;
        for (let i = 1; i <= daysInMonth; i++) {
          if (daysObj[i] !== 'sober') {
            allSober = false;
            break;
          }
        }
        if (allSober) {
          unlocked.add('1_month_dry');
          break;
        }
      }
    }


    // weekend_warrior: Check for a Saturday–Sunday pair with status in ['sober','medium'].
    const logsByDate = {};
    logs.forEach(log => {
      const key = new Date(log.date).toISOString().split('T')[0];
      logsByDate[key] = log.status;
    });
    for (const key in logsByDate) {
      const d = new Date(key);
      if (d.getDay() === 5) {
        const next = new Date(d);
        next.setDate(d.getDate() + 1);
        const nextKey = next.toISOString().split('T')[0];
        if (
          (logsByDate[key] === 'sober' || logsByDate[key] === 'medium') &&
          (logsByDate[nextKey] === 'sober' || logsByDate[nextKey] === 'medium')
        ) {
          unlocked.add('weekend_warrior');
          break;
        }
      }
    }

    // Update UserAchievement collection individually.
    const allAchievements = await Achievement.find({});
    for (const ach of allAchievements) {
      if (unlocked.has(ach.key)) {
        await UserAchievement.findOneAndUpdate(
          { user: userId, achievement: ach._id },
          { user: userId, achievement: ach._id },
          { upsert: true, new: true }
        );
      } else {
        await UserAchievement.deleteOne({ user: userId, achievement: ach._id });
      }
    }
  } catch (err) {
    console.error('Error in checkAndUnlockAchievements:', err);
  }
}

module.exports = router;
