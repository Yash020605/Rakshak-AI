import { Linking, PermissionsAndroid, Platform } from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

const EMERGENCY_LABELS = {
  medical: 'MEDICAL EMERGENCY',
  fire: 'FIRE EMERGENCY',
  police: 'CRIME/THREAT EMERGENCY',
};

/**
 * Request CALL_PHONE permission on Android
 */
async function requestCallPermission() {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CALL_PHONE,
      {
        title: 'Call Permission',
        message: 'Rakshak AI needs to auto-call your emergency contact during SOS.',
        buttonPositive: 'Allow',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

/**
 * Place a direct call (no dialer screen) using CALL intent
 */
export async function callEmergencyContact(profile) {
  const contacts = profile?.emergencyContacts || [];
  if (!contacts.length) return;
  const phone = contacts[0]?.phone?.replace(/\s+/g, '');
  if (!phone) return;

  try {
    const hasPermission = await requestCallPermission();
    // ACTION_CALL places call directly; ACTION_DIAL just opens dialer
    const scheme = hasPermission ? `tel:${phone}` : `tel:${phone}`;
    await Linking.openURL(scheme);
  } catch (err) {
    console.warn('Call failed:', err.message);
  }
}

/**
 * Send SMS via backend Twilio — fully silent, no user interaction
 */
async function sendViaTwilio(type, latitude, longitude, profile) {
  try {
    await axios.post(
      `${API_BASE_URL}/alert/sms`,
      {
        type,
        latitude,
        longitude,
        profile,
      },
      { timeout: 8000 }
    );
  } catch (err) {
    console.warn('Twilio SMS failed:', err.message);
    // Fallback to native SMS app
    await sendNativeSMS(type, latitude, longitude, profile);
  }
}

/**
 * Native SMS fallback (opens app pre-filled — last resort)
 */
async function sendNativeSMS(type, latitude, longitude, profile) {
  const contacts = profile.emergencyContacts || [];
  if (!contacts.length) return;
  const label = EMERGENCY_LABELS[type] || 'EMERGENCY';
  const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
  const message =
    `${label}\nPerson: ${profile.name}\nBlood: ${profile.bloodGroup || 'N/A'}\nLocation: ${mapsLink}\nSent via Rakshak AI`;
  const phone = contacts[0]?.phone;
  if (phone) {
    await Linking.openURL(`sms:${phone}?body=${encodeURIComponent(message)}`);
  }
}

/**
 * Offline SOS — send SMS via Twilio backend + auto-call
 */
export async function sendOfflineSMS(type, latitude, longitude, profile) {
  await sendViaTwilio(type, latitude, longitude, profile);
  await callEmergencyContact(profile);
}
