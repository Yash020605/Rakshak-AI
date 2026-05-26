const express = require('express');
const { cache } = require('../config/cache');
const { findNearestService } = require('../services/locationService');

const router = express.Router();

// POST /api/location/update
router.post('/update', async (req, res) => {
  const { userId, latitude, longitude } = req.body;
  if (!userId || !latitude || !longitude)
    return res.status(400).json({ error: 'userId, latitude, longitude required' });

  try {
    cache.set(`live:${userId}`, { latitude, longitude, updatedAt: Date.now() });
    // Broadcast to any Socket.IO listeners
    req.app.get('io')?.emit(`location:${userId}`, { latitude, longitude });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/location/live/:userId
router.get('/live/:userId', async (req, res) => {
  try {
    const data = cache.get(`live:${req.params.userId}`);
    if (!data) return res.status(404).json({ error: 'No live location found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/location/nearest?lat=&lng=&type=
router.get('/nearest', async (req, res) => {
  const { lat, lng, type } = req.query;
  if (!lat || !lng || !type)
    return res.status(400).json({ error: 'lat, lng, type required' });

  try {
    const service = await findNearestService(parseFloat(lat), parseFloat(lng), type);
    if (!service) return res.status(404).json({ error: 'No nearby service found' });
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/location/route?fromLat=&fromLng=&toLat=&toLng=
// Uses OSRM public demo server — free, no API key needed
router.get('/route', async (req, res) => {
  const { fromLat, fromLng, toLat, toLng } = req.query;
  if (!fromLat || !fromLng || !toLat || !toLng)
    return res.status(400).json({ error: 'fromLat, fromLng, toLat, toLng required' });

  try {
    const axios = require('axios');
    // OSRM format: /route/v1/{profile}/{lon,lat};{lon,lat}
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}`;
    const { data } = await axios.get(url, {
      params: { overview: 'full', geometries: 'geojson', steps: 'false' },
      headers: { 'User-Agent': 'RakshakAI/1.0 (emergency-response-app)' },
      timeout: 10000,
    });

    if (data.code !== 'Ok' || !data.routes?.length)
      return res.status(404).json({ error: 'No route found' });

    const route = data.routes[0];
    res.json({
      // GeoJSON coordinates array [[lng,lat], ...]
      coordinates: route.geometry.coordinates,
      distanceMeters: Math.round(route.distance),
      durationSeconds: Math.round(route.duration),
      etaMinutes: Math.round(route.duration / 60),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
