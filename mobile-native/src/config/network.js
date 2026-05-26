import { Platform } from 'react-native';

/**
 * Network configuration helper
 * 
 * IMPORTANT: Update this with your actual backend URL
 * 
 * For development:
 * - Android Emulator: Use 10.0.2.2:5000
 * - iOS Simulator: Use localhost:5000
 * - Physical Device: Use your computer's local IP (e.g., 192.168.1.100:5000)
 * 
 * For production:
 * - Use your deployed backend URL (e.g., https://api.rakshak.com)
 */

// Auto-detect development environment
function getDevServerUrl() {
  if (Platform.OS === 'android') {
    // Android emulator uses 10.0.2.2 to access host machine's localhost
    return 'http://10.0.2.2:5000';
  }
  // iOS simulator can use localhost
  return 'http://localhost:5000';
}

// Change this to your production URL when deploying
const PRODUCTION_URL = 'https://your-backend-url.com';

// Set to true when testing on physical device with local backend
const USE_LOCAL_IP = true;
const LOCAL_IP = '10.5.69.205'; // Your computer's IP address

export function getApiBaseUrl() {
  if (__DEV__) {
    if (USE_LOCAL_IP) {
      return `http://${LOCAL_IP}:5000`;
    }
    return getDevServerUrl();
  }
  return PRODUCTION_URL;
}

export const API_BASE_URL = `${getApiBaseUrl()}/api`;
export const SOCKET_URL = getApiBaseUrl();
