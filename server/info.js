// server/info.js
const mongoose = require('mongoose');
const Drink = require('./models/Drink');

// Replace with your actual MongoDB connection string
const mongoURI = 'mongodb+srv://melkote:IZrmuaElUkaOBBpU@database.vwiwebs.mongodb.net/';

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
    seedDrinks();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

const drinks = [
  { name: "Jack Daniel's Old No. 7 Tennessee Whiskey", abv: 40, volume: 750 },
  { name: "Jack Daniel's Country Cocktail", abv: 4.8, volume: 355 },
  { name: "Jameson Orange Spirit Drink", abv: 30, volume: 750 },
  { name: "Smirnoff Ice", abv: 4.5, volume: 710 },
  { name: "High Noon Vodka Seltzer", abv: 4.5, volume: 355 },
  { name: "Jameson Black Barrel", abv: 40, volume: 750 },
  { name: "Fireball Cinnamon Whiskey", abv: 33, volume: 50 },
  { name: "Twisted Tea Hard Iced Tea", abv: 5, volume: 355 },
  { name: "White Claw Hard Seltzer", abv: 5, volume: 355 },
  { name: "Dogfish Head Cocktail", abv: 12, volume: 355 },
  { name: "Coors Light Beer Can", abv: 4.2, volume: 355 },
  { name: "Bud Light Beer Bottle", abv: 5, volume: 355 },
  { name: "Corona Extra Beer Bottle", abv: 4.6, volume: 355 },
  { name: "Angry Orchard Hard Cider Bottle", abv: 5, volume: 355 },
  { name: "Casamigos Blanco Tequila", abv: 40, volume: 750 },
  { name: "JINRO Chamisul Soju Fresh", abv: 13, volume: 375 },
  { name: "New Amsterdam Pink Whitney", abv: 40, volume: 375 },
  { name: "Malibu Caribbean Coconut Liquor Rum", abv: 21, volume: 750 },
  { name: "Tito's Handmade Vodka", abv: 40, volume: 750 },
  { name: "Heineken Lager", abv: 5, volume: 355 }
];

async function seedDrinks() {
  try {
    // Clear any existing drinks
    await Drink.deleteMany({});
    console.log('Old drinks removed.');

    // Insert new drinks
    await Drink.insertMany(drinks);
    console.log('Drinks seeded successfully.');
  } catch (error) {
    console.error('Error seeding drinks:', error);
  } finally {
    mongoose.connection.close();
  }
}
