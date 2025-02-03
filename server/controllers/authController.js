require('dotenv').config();
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs'); // Updated: use bcryptjs
const User = require('../models/User');
const VerificationCode = require('../models/VerificationCode');
const OneTimeCode = require('../models/OneTimeCode'); // if using forgot-password OTP

// Create your nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sign Up
 */
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User already exists with that email.' });
    }

    // Hash password using bcryptjs
    const hashed = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new User({ name, email, password: hashed });
    await newUser.save();

    // Generate verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await VerificationCode.create({ code, email });

    // Send verification email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Waite Verification Code',
      html: `
        <h2>Verify Your Account</h2>
        <p>Your code is: <strong>${code}</strong></p>
      `,
    });

    res.json({ message: 'Signup successful. Please check your email for a verification code.' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Error signing up user.' });
  }
};

/**
 * Verify (Sign Up)
 */
exports.verify = async (req, res) => {
  try {
    const { email, code } = req.body;

    const record = await VerificationCode.findOne({ email, code });
    if (!record) {
      return res.status(400).json({ message: 'Invalid or expired verification code.' });
    }

    // Mark user as verified
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found.' });
    }
    user.isVerified = true;
    await user.save();

    // Remove the code from DB
    await VerificationCode.deleteOne({ _id: record._id });

    res.json({ message: 'Email verified successfully! You can now sign in.' });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ message: 'Error verifying code.' });
  }
};

/**
 * Sign In
 */
exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email.' });
    }

    // Compare using bcryptjs
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid password.' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email first.' });
    }

    // Store user in session
    req.session.user = user;

    res.json({ message: 'Signed in successfully!', user: user.toJSON() });
  } catch (err) {
    console.error('Signin error:', err);
    res.status(500).json({ message: 'Error signing in.' });
  }
};

/**
 * Resend Verification Code
 */
exports.resend = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please sign up first.' });
    }
    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified.' });
    }

    // Generate new code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Remove any old codes
    await VerificationCode.deleteMany({ email });

    // Create a fresh record
    await VerificationCode.create({ email, code });

    // Send code via email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Verification Code (Resent)',
      html: `
        <h2>Verification Code</h2>
        <p>Your new code is: <strong>${code}</strong></p>
      `,
    });

    res.json({ message: 'Verification code resent successfully.' });
  } catch (err) {
    console.error('Resend error:', err);
    res.status(500).json({ message: 'Error resending code.' });
  }
};

/**
 * Request Password OTP (Forgot Password)
 */
exports.requestPasswordOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with that email.' });
    }
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email first.' });
    }

    // Generate one-time code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Remove old codes
    await OneTimeCode.deleteMany({ email });

    // Create fresh
    await OneTimeCode.create({ email, code });

    // Email it
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your One-Time Login Code',
      html: `
        <h2>One-Time Login Code</h2>
        <p>Your code: <strong>${code}</strong></p>
        <p>Expires in 5 minutes.</p>
      `,
    });

    res.json({ message: 'One-time code sent. Check your email.' });
  } catch (err) {
    console.error('requestPasswordOTP error:', err);
    res.status(500).json({ message: 'Error sending one-time code.' });
  }
};

/**
 * OTP Login (Forgot Password Flow)
 */
exports.otpLogin = async (req, res) => {
  try {
    const { email, code } = req.body;
    const record = await OneTimeCode.findOne({ email, code });
    if (!record) {
      return res.status(400).json({ message: 'Invalid or expired code.' });
    }

    // Check user
    const user = await User.findOne({ email });
    if (!user || !user.isVerified) {
      return res.status(400).json({ message: 'User not found or not verified.' });
    }

    // Delete used OTP
    await OneTimeCode.deleteOne({ _id: record._id });

    // Log user in
    req.session.user = user;
    // Force them to change password
    req.session.mustChangePassword = true;

    res.json({ message: 'OTP login successful. Please change your password.', user: user.toJSON() });
  } catch (err) {
    console.error('otpLogin error:', err);
    res.status(500).json({ message: 'Error logging in with OTP.' });
  }
};

/**
 * Change Password (After OTP Login)
 */
exports.changePassword = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(403).json({ message: 'Not authenticated.' });
    }
    if (!req.session.mustChangePassword) {
      return res.status(400).json({ message: 'Password change is not currently required.' });
    }

    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'New password is too short.' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    const user = await User.findById(req.session.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.password = hashed;
    await user.save();

    req.session.mustChangePassword = false;

    res.json({ message: 'Password changed successfully!' });
  } catch (err) {
    console.error('changePassword error:', err);
    res.status(500).json({ message: 'Error changing password.' });
  }
};

/**
 * Logout
 */
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.json({ message: 'Logged out successfully.' });
  });
};
