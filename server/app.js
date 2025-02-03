require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const connectDB = require('./config/db');
const routes = require('./routes');
const drinksRouter = require('./routes/drinks');
const placesRouter = require('./routes/places'); 

connectDB();

const app = express();

app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'someSecretKey',
    resave: false,
    saveUninitialized: false,
  })
);

app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-eval' https:; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com; " +
      "img-src 'self' data: https:; " +
      "object-src 'none';"
  );
  next();
});

app.use('/', routes);
app.use('/drinks', drinksRouter);
app.use('/api/places', placesRouter);

app.use(express.static(path.join(__dirname, '../client/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

module.exports = app;
