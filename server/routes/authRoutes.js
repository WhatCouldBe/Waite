const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
router.post('/signup', authController.signup);
router.post('/verify', authController.verify);
router.post('/signin', authController.signin);
router.get('/logout', authController.logout);
router.post('/resend', authController.resend);
router.post('/request-password-otp', authController.requestPasswordOTP);
router.post('/otp-login', authController.otpLogin);
router.post('/change-password', authController.changePassword);
router.get('/protected', (req, res) => {
  if (!req.session.user) {
    return res.status(403).json({ message: 'Not authenticated.' });
  }
  res.json({ message: 'You can access protected route!', user: req.session.user });
});

module.exports = router;
