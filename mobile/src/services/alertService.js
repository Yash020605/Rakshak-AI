import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { API_BASE_URL } from '../config/constants';
import { getProfile } from './storageService';
import { sendOfflineSMS } from './smsService';

/**
 * Main SOS trigger — tries online first, falls back to SMS-only
 */
export async function triggerSOS(type, latitude, longitude, deviceToken = null) {
  const profile = await getProfile();
  if (!profile) throw new Error('No profile found. Please set up your profile first.');

  const netState = await NetInfo.fetch();

  if (netState.isConnected) {
    try {
      const userId = profile.userId;
      const { data } = await axios.post(
        `${API_BASE_URL}/alert/sos`,
        { userId, type, latitude, longitude, deviceToken },
        { timeout: 8000 }
      );
      return { source: 'online', ...data };
    } catch (err) {
      console.warn('Online SOS failed, falling back to SMS:', err.message);
    }
  }

  // Offline fallback — direct SMS
  await sendOfflineSMS(type, latitude, longitude, profile);
  return { source: 'offline', success: true };
}

export async function resolveAlert(alertId) {
  const { data } = await axios.patch(`${API_BASE_URL}/alert/${alertId}/resolve`);
  return data;
}
