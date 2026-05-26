import { Linking } from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

const EMERGENCY_LABELS = {
  medical: 'MEDICAL EMERGENCY',
  fire:    'FIRE EMERGENCY',
  police:  'CRIME/THREAT EMERGENCY',
};

export async function callEmergencyContact(profile) {
  const phone = profile?.emergencyContacts?.[0]?.phone?.replace(/\s+/g, '');
  if (phone) {
    await Linking.openURL(`tel:${phone}`).catch(() => {});
  }
}

async function sendViaTwilio(type, latitude, longitude, profile) {
  try {
    await axios.post(`${API_BASE_URL}/alert/sms`, { type, latitude, longitude, profile }, { timeout: 8000 });
  } catch {
    await sendNativeSMS(type, latitude, longitude, profile);
  }
}

async function sendNativeSMS(type, latitude, longitude, profile) {
  const contacts = profile.emergencyContacts || [];
  if (!contacts.length) return;
  const label = EMERGENCY_LABELS[type] || 'EMERGENCY';
  const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
  const message = `${label}\nPerson: ${profile.name}\nBlood: ${profile.bloodGroup || 'N/A'}\nLocation: ${mapsLink}\nSent via Rakshak AI`;
  const phone = contacts[0]?.phone;
  if (phone) await Linking.openURL(`sms:${phone}?body=${encodeURIComponent(message)}`).catch(() => {});
}

export async function sendOfflineSMS(type, latitude, longitude, profile) {
  await sendViaTwilio(type, latitude, longitude, profile);
  await callEmergencyContact(profile);
}
