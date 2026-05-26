export const API_BASE_URL = 'http://10.5.69.205:5000/api'; // WiFi IP of dev machine

export const EMERGENCY_TYPES = {
  medical: {
    label: 'Medical Emergency',
    emoji: '🚑',
    color: '#E53935',
    lightColor: '#FFEBEE',
    description: 'Ambulance',
  },
  fire: {
    label: 'Fire Emergency',
    emoji: '🔥',
    color: '#F57C00',
    lightColor: '#FFF3E0',
    description: 'Fire Brigade',
  },
  police: {
    label: 'Crime / Threat',
    emoji: '🚓',
    color: '#1565C0',
    lightColor: '#E3F2FD',
    description: 'Police',
  },
};

// OpenStreetMap tile URL — free, no API key required
export const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
