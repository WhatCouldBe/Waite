const express = require('express');
const router = express.Router();
const Drink = require('../models/Drink');

// GET all drinks
router.get('/', async (req, res) => {
  try {
    const drinks = await Drink.find({});
    return res.json({ success: true, drinks });
  } catch (err) {
    console.error("Error fetching drinks:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET a single drink by its ID
router.get('/:id', async (req, res) => {
  try {
    const drink = await Drink.findById(req.params.id);
    if (!drink) {
      return res.status(404).json({ success: false, error: 'Drink not found' });
    }
    return res.json({ success: true, drink });
  } catch (err) {
    console.error("Error fetching drink:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST create a new drink
router.post('/', async (req, res) => {
  try {
    const newDrink = new Drink(req.body);
    await newDrink.save();
    return res.json({ success: true, drink: newDrink });
  } catch (err) {
    console.error("Error creating drink:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update an existing drink by ID
router.put('/:id', async (req, res) => {
  try {
    const updatedDrink = await Drink.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedDrink) {
      return res.status(404).json({ success: false, error: 'Drink not found' });
    }
    return res.json({ success: true, drink: updatedDrink });
  } catch (err) {
    console.error("Error updating drink:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE a drink by ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedDrink = await Drink.findByIdAndDelete(req.params.id);
    if (!deletedDrink) {
      return res.status(404).json({ success: false, error: 'Drink not found' });
    }
    return res.json({ success: true, drink: deletedDrink });
  } catch (err) {
    console.error("Error deleting drink:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
