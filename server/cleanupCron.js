const cron = require('node-cron');
const User = require('./models/User');

// schedule runs every 5 minutes
// (See node-cron docs for different schedules.)
cron.schedule('*/5 * * * *', async () => {
  const FIFTEEN_MINUTES = 1000 * 60 * 5;
  const cutoff = new Date(Date.now() - FIFTEEN_MINUTES);

  try {
    // Remove all users who are NOT verified
    // and were created more than 5 minute ago
    const result = await User.deleteMany({
      isVerified: false,
      createdAt: { $lt: cutoff },
    });

    if (result.deletedCount > 0) {
      console.log(`🗑️ Cleaned up ${result.deletedCount} unverified user(s).`);
    }
  } catch (err) {
    console.error('Error cleaning up unverified users:', err);
  }
});
