const twilio = require('twilio');

// Lazy-initialize — only create the client when actually sending,
// so missing Twilio env vars don't crash the server on startup.
function getClient() {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    throw new Error('Twilio credentials not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN missing)');
  }
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

const EMERGENCY_LABELS = {
  medical: '🚑 MEDICAL EMERGENCY',
  fire: '🔥 FIRE EMERGENCY',
  police: '🚓 CRIME/THREAT EMERGENCY',
};

/**
 * Build the SOS SMS message body
 */
function buildSMSMessage(alert, profile) {
  const label = EMERGENCY_LABELS[alert.type] || 'EMERGENCY';
  const mapsLink = `https://www.openstreetmap.org/?mlat=${alert.latitude}&mlon=${alert.longitude}#map=16/${alert.latitude}/${alert.longitude}`;
  const time = new Date(alert.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  let msg = `${label}\n`;
  msg += `Person: ${profile.name}\n`;
  if (profile.bloodGroup) msg += `Blood Group: ${profile.bloodGroup}\n`;
  if (profile.medicalConditions) msg += `Medical Info: ${profile.medicalConditions}\n`;
  msg += `Time: ${time}\n`;
  msg += `Location: ${mapsLink}\n`;
  msg += `\nSent via Rakshak AI`;
  return msg;
}

/**
 * Send SMS to all emergency contacts
 * Returns array of results (success/failure per contact)
 */
async function sendSOSAlerts(alert, profile) {
  const contacts = profile.emergencyContacts || [];
  const validContacts = contacts.filter(c => c && c.phone);
  if (!validContacts.length) return [];

  const message = buildSMSMessage(alert, profile);
  const client = getClient();

  const results = await Promise.allSettled(
    validContacts.map((contact) =>
      client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: contact.phone.toString().startsWith('+') ? contact.phone : `+91${contact.phone.toString().replace(/\D/g, '')}`,
      })
    )
  );

  return results.map((r, i) => ({
    contact: contacts[i].name,
    phone: contacts[i].phone,
    status: r.status === 'fulfilled' ? 'sent' : 'failed',
    error: r.reason?.message,
  }));
}

module.exports = { sendSOSAlerts, buildSMSMessage };
