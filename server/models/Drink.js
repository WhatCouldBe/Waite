// server/models/Drink.js
const mongoose = require('mongoose');

const drinkSchema = new mongoose.Schema({
  name: { type: String, required: true },
  abv: { type: Number, required: true },
  volume: { type: Number, required: true },
  baseFactor: { type: Number, default: 1 }
});

module.exports = mongoose.model('Drink', drinkSchema);
