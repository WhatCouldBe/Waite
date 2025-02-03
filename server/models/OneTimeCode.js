// server/models/OneTimeCode.js
const mongoose = require('mongoose');

/**
 *one-time code for password login.
 * Expires after 5 minutes (300 seconds).
 */
const oneTimeCodeSchema = new mongoose.Schema({
  code: String,
  email: String,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // 5 minutes
  },
});

module.exports = mongoose.model('OneTimeCode', oneTimeCodeSchema);
