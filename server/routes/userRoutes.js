const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/update', async (req, res) => {
  try {
    const { userId, profilePicture, weight, height, dateOfBirth, sex } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: "Missing userId" });
    }
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePicture, weight, height, dateOfBirth, sex },
      { new: true }
    );
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
