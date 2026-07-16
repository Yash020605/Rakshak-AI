import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { Linking, Alert } from 'react-native';
import { API_BASE_URL } from '../config/constants';
import { getProfile } from './storageService';
import { sendOfflineSMS, callEmergencyContact } from './smsService';

const EMERGENCY_NUMBERS = { medical: '108', fire: '101', police: '100' };

async function callEmergencyService(type) {
  const number = EMERGENCY_NUMBERS[type] || '112';
  await Linking.openURL(`tel:${number}`).catch(() => {});
}

export async function triggerSOS(type, latitude, longitude) {
  const profile = await getProfile();
  if (!profile) throw new Error('No profile found. Please set up your profile first.');

  const netState = await NetInfo.fetch();

  if (netState.isConnected) {
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/alert/sos`,
        { userId: profile.userId, type, latitude, longitude },
        { timeout: 8000 }
      );
      Alert.alert('Text Sent', 'Your emergency contacts have been notified automatically.');
      callEmergencyService(type);
      return { source: 'online', ...data };
    } catch (err) {
      console.warn('Online SOS failed, falling back:', err.message);
    }
  }

  await sendOfflineSMS(type, latitude, longitude, profile);
  Alert.alert('Carrier Text Sent', 'Your emergency contacts have been notified (offline native fallback).');
  callEmergencyService(type);
  return { source: 'offline', success: true };
}

export async function resolveAlert(alertId) {
  const { data } = await axios.patch(`${API_BASE_URL}/alert/${alertId}/resolve`);
  return data;
}
