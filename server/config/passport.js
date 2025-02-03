require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
// passport.js was to be used for google auth, not being implemented for now.
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let existingUser = await User.findOne({ googleId: profile.id });
        if (existingUser) {
          return done(null, existingUser);
        }
        
        const newUser = new User({
          googleId: profile.id,
          email: profile.emails[0].value,
          isVerified: true, // automatically verified for Google OAuth
        });
        await newUser.save();
        done(null, newUser);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

// serialize user into the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// deserialize user from session
passport.deserializeUser((id, done) => {
  User.findById(id)
    .then((user) => done(null, user))
    .catch((err) => done(err, null));
});

module.exports = passport;
