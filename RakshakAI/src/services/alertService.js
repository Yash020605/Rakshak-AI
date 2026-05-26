import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { Linking } from 'react-native';
import { API_BASE_URL } from '../config/constants';
import { getProfile } from './storageService';
import { sendOfflineSMS, callEmergencyContact } from './smsService';

const EMERGENCY_NUMBERS = {
  medical: '108',
  fire: '101',
  police: '100',
};

/**
 * Auto-call the national emergency number for the given type
 */
async function callEmergencyService(type) {
  const number = EMERGENCY_NUMBERS[type] || '112';
  try {
    await Linking.openURL(`tel:${number}`);
  } catch (err) {
    console.warn('Emergency call failed:', err.message);
  }
}

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
      // Auto-call emergency service number immediately
      callEmergencyService(type);
      // Also notify personal emergency contacts
      callEmergencyContact(profile).catch(() => {});
      return { source: 'online', ...data };
    } catch (err) {
      console.warn('Online SOS failed, falling back to SMS:', err.message);
    }
  }

  // Offline fallback — SMS + call
  await sendOfflineSMS(type, latitude, longitude, profile);
  callEmergencyService(type);
  return { source: 'offline', success: true };
}

export async function resolveAlert(alertId) {
  const { data } = await axios.patch(`${API_BASE_URL}/alert/${alertId}/resolve`);
  return data;
}
