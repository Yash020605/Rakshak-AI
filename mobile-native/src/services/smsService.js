import { Linking } from 'react-native';

const EMERGENCY_LABELS = {
  medical: 'MEDICAL EMERGENCY',
  fire: 'FIRE EMERGENCY',
  police: 'CRIME/THREAT EMERGENCY',
};

/**
 * Offline SMS fallback — opens native SMS app pre-filled
 * Works without internet using device SMS
 */
export async function sendOfflineSMS(type, latitude, longitude, profile) {
  const contacts = profile.emergencyContacts || [];
  if (!contacts.length) return;

  const label = EMERGENCY_LABELS[type] || 'EMERGENCY';
  const mapsLink = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;
  const body = encodeURIComponent(
    `${label}\nPerson: ${profile.name}\nBlood Group: ${profile.bloodGroup || 'N/A'}\nLocation: ${mapsLink}\nSent via Rakshak AI`
  );

  // Send to first contact via SMS intent (opens SMS app)
  const phone = contacts[0]?.phone;
  if (phone) {
    await Linking.openURL(`sms:${phone}?body=${body}`);
  }
}
