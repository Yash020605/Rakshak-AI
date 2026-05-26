const axios = require('axios');

// For medical, search multiple amenity types so we don't miss nearby clinics
const AMENITY_TAGS = {
  medical: ['hospital', 'clinic', 'doctors', 'health_centre', 'pharmacy'],
  fire:    ['fire_station'],
  police:  ['police'],
};

/**
 * Haversine distance in km between two lat/lng points
 */
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Find the NEAREST emergency service using Overpass API.
 *
 * Strategy:
 *  1. Fetch all matching amenities within 5 km (up to 50 results).
 *  2. Calculate exact Haversine distance from the user to each result.
 *  3. Return the one with the smallest distance.
 *
 * This guarantees the closest result regardless of the order Overpass returns elements.
 */
async function findNearestService(lat, lng, emergencyType) {
  const amenities = AMENITY_TAGS[emergencyType] || AMENITY_TAGS.medical;
  const radiusMeters = 5000; // 5 km search radius

  // Build a union query for all relevant amenity types
  const amenityFilters = amenities
    .map(
      (a) =>
        `node["amenity"="${a}"](around:${radiusMeters},${lat},${lng});\n` +
        `way["amenity"="${a}"](around:${radiusMeters},${lat},${lng});`
    )
    .join('\n');

  const query = `[out:json][timeout:15];\n(\n${amenityFilters}\n);\nout center 50;`;

  const { data } = await axios.post(
    'https://overpass-api.de/api/interpreter',
    `data=${encodeURIComponent(query)}`,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'RakshakAI/1.0 (emergency-response-app)',
      },
      timeout: 15000,
    }
  );

  const elements = data.elements;
  if (!elements?.length) return null;

  // Normalise lat/lng (ways use center, nodes use lat/lon directly)
  const candidates = elements
    .map((el) => {
      const elLat = el.lat ?? el.center?.lat;
      const elLng = el.lon ?? el.center?.lon;
      if (!elLat || !elLng) return null;
      return {
        name: el.tags?.name || `Nearest ${el.tags?.amenity || 'service'}`,
        address:
          [el.tags?.['addr:street'], el.tags?.['addr:city']]
            .filter(Boolean)
            .join(', ') || '',
        latitude: elLat,
        longitude: elLng,
        amenity: el.tags?.amenity,
        distanceKm: haversineKm(lat, lng, elLat, elLng),
      };
    })
    .filter(Boolean);

  if (!candidates.length) return null;

  // Sort by distance ascending — pick the closest
  candidates.sort((a, b) => a.distanceKm - b.distanceKm);
  const nearest = candidates[0];

  return {
    name: nearest.name,
    address: nearest.address,
    latitude: nearest.latitude,
    longitude: nearest.longitude,
    distanceKm: Math.round(nearest.distanceKm * 10) / 10, // 1 decimal place
    mapsLink: `https://www.openstreetmap.org/?mlat=${nearest.latitude}&mlon=${nearest.longitude}#map=16/${nearest.latitude}/${nearest.longitude}`,
  };
}

/**
 * Reverse geocode using Nominatim (OSM) — free, no key needed.
 */
async function reverseGeocode(lat, lng) {
  const { data } = await axios.get('https://nominatim.openstreetmap.org/reverse', {
    params: { lat, lon: lng, format: 'json' },
    headers: { 'User-Agent': 'RakshakAI/1.0 (emergency-app)' },
    timeout: 8000,
  });
  return data.display_name || `${lat}, ${lng}`;
}

module.exports = { findNearestService, reverseGeocode };
