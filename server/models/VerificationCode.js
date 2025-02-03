// server/models/VerificationCode.js
const mongoose = require('mongoose');

const verificationCodeSchema = new mongoose.Schema({
  code: String,
  email: String,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // 5 minutes
  },
});

module.exports = mongoose.model('VerificationCode', verificationCodeSchema);
