import { Linking, NativeModules, PermissionsAndroid, Platform } from 'react-native';
import axios from 'axios';
const { DirectSms } = NativeModules;
import { API_BASE_URL } from '../config/constants';

const EMERGENCY_LABELS = {
  medical: 'MEDICAL EMERGENCY',
  fire:    'FIRE EMERGENCY',
  police:  'CRIME/THREAT EMERGENCY',
};

export async function callEmergencyContact(profile) {
  // Removed manual phone dialer popup
}

async function sendViaTwilio(type, latitude, longitude, profile) {
  try {
    await axios.post(`${API_BASE_URL}/alert/sms`, { type, latitude, longitude, profile }, { timeout: 8000 });
  } catch {
    await sendNativeSMS(type, latitude, longitude, profile);
  }
}

async function sendNativeSMS(type, latitude, longitude, profile) {
  if (Platform.OS !== 'android' || !DirectSms) return;

  const contacts = profile.emergencyContacts || [];
  const validContacts = contacts.filter(c => c && c.phone);
  if (!validContacts.length) return;

  const label = EMERGENCY_LABELS[type] || 'EMERGENCY';
  const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
  const message = `${label}\nPerson: ${profile.name}\nLocation: ${mapsLink}`;

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.SEND_SMS,
      {
        title: 'SMS Permission',
        message: 'Rakshak AI needs permission to send offline SOS texts.',
        buttonPositive: 'OK'
      }
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      for (const c of validContacts) {
        await DirectSms.sendSMS(c.phone, message);
      }
    } else {
      console.warn('SMS permission denied');
    }
  } catch (err) {
    console.warn('sendNativeSMS Error:', err);
  }
}

export async function sendOfflineSMS(type, latitude, longitude, profile) {
  await sendViaTwilio(type, latitude, longitude, profile);
  await callEmergencyContact(profile);
}
