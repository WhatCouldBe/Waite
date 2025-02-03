require('dotenv').config();
const axios = require('axios');

const categoryQueries = {
  outdoor: "outdoor activities",
  indoor: "indoor activities",
  restaurants: "restaurants",
  entertainment: "entertainment",
};

exports.getPlaces = async (req, res) => {
  try {
    const { category, lat, lng } = req.query;
    if (!category || !lat || !lng) {
      return res.status(400).json({ message: 'Missing required parameters: category, lat, lng' });
    }
    
    const query = categoryQueries[category] || category;
    const radius = 5000;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error("GOOGLE_MAPS_API_KEY is not defined in .env");
      return res.status(500).json({ message: 'Server configuration error' });
    }
    
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${lat},${lng}&radius=${radius}&key=${apiKey}`;
    
    const response = await axios.get(url);
    
    if (response.data.status === 'OK') {
      const filtered = response.data.results.filter(place => {
        const name = place.name.toLowerCase();
        return !(name.includes('pub') || name.includes('bar') || name.includes('liquor'));
      });
      return res.json({ results: filtered });
    } else {
      console.error("Google Places API error:", response.data);
      return res.status(500).json({ message: 'Google Places API error', details: response.data });
    }
  } catch (error) {
    console.error('Error in getPlaces:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
