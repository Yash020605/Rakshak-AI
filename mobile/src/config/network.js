import { Platform } from 'react-native';

/**
 * Network configuration
 *
 * ─── For local development ────────────────────────────────────────────────────
 * Set USE_LOCAL_IP = true and update LOCAL_IP to your machine's LAN IP.
 *   Android emulator → 10.0.2.2 reaches host localhost
 *   Physical device  → your machine's IP (e.g. 192.168.1.100)
 *
 * ─── For production ───────────────────────────────────────────────────────────
 * Set PRODUCTION_URL to your deployed backend (e.g. https://rakshak-ai.onrender.com)
 * and set USE_LOCAL_IP = false.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ✅ UPDATE THIS to your Render / Railway / Fly.io URL after deploying
const PRODUCTION_URL = 'https://rakshak-ai-backend.onrender.com';

// Set to true only during local development on a physical device
const USE_LOCAL_IP = false;
const LOCAL_IP = '10.5.69.205'; // Your dev machine's LAN IP

function getDevServerUrl() {
  if (USE_LOCAL_IP) return `http://${LOCAL_IP}:5000`;
  if (Platform.OS === 'android') return 'http://10.0.2.2:5000';
  return 'http://localhost:5000';
}

export function getApiBaseUrl() {
  if (__DEV__) return getDevServerUrl();
  return PRODUCTION_URL;
}

export const API_BASE_URL = `${getApiBaseUrl()}/api`;
export const SOCKET_URL = getApiBaseUrl();
