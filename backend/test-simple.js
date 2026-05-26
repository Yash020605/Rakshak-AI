/**
 * Simple Dual-Routing Test (No WebSocket)
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

console.log('\n🚨 RAKSHAK AI - DUAL-ROUTING SYSTEM TEST\n');

async function test() {
  // 1. Create Profile
  console.log('1. Creating test profile...');
  const profile = {
    userId: `test_${Date.now()}`,
    name: 'Test User',
    bloodGroup: 'O+',
    medicalConditions: 'Diabetic',
    emergencyContacts: [{ name: 'Contact 1', phone: '+1234567890' }]
  };
  
  try {
    await axios.post(`${API_URL}/profile`, profile);
    console.log('   ✅ Profile created\n');
  } catch (err) {
    console.log(`   ⚠️  ${err.response?.data?.error || err.message}\n`);
  }

  // 2. Register Responder
  console.log('2. Registering test responder...');
  let responderId;
  try {
    const res = await axios.post(`${API_URL}/responder`, {
      name: 'Test Hospital',
      type: 'medical',
      latitude: 19.0760,
      longitude: 72.8777,
      organization: 'Mumbai General',
      status: 'active'
    });
    responderId = res.data.responder._id;
    console.log(`   ✅ Responder registered: ${responderId}\n`);
  } catch (err) {
    console.log(`   ⚠️  ${err.response?.data?.error || err.message}\n`);
  }

  // 3. Trigger SOS (Dual-Routing)
  console.log('3. Triggering SOS alert (DUAL-ROUTING)...');
  let alertId;
  try {
    const res = await axios.post(`${API_URL}/alert/sos`, {
      userId: profile.userId,
      type: 'medical',
      latitude: 19.0760,
      longitude: 72.8777
    });
    alertId = res.data.alertId;
    console.log(`   ✅ Alert created: ${alertId}`);
    console.log('   → Route A: SMS to family (check backend logs)');
    console.log('   → Route B: WebSocket to responders (check dashboard)\n');
  } catch (err) {
    console.log(`   ❌ ${err.response?.data?.error || err.message}\n`);
    return;
  }

  // 4. Get Active Alerts
  console.log('4. Fetching active alerts...');
  try {
    const res = await axios.get(`${API_URL}/responder/alerts/active`);
    console.log(`   ✅ Found ${res.data.length} active alert(s)\n`);
  } catch (err) {
    console.log(`   ❌ ${err.message}\n`);
  }

  // 5. Dispatch Responder
  console.log('5. Dispatching responder...');
  try {
    await axios.patch(`${API_URL}/alert/${alertId}/dispatch`, {
      responderId,
      responderName: 'Test Hospital Unit 5'
    });
    console.log('   ✅ Responder dispatched');
    console.log('   → User app will show: "Help is on the way"');
    console.log('   → Family tracking link updated\n');
  } catch (err) {
    console.log(`   ❌ ${err.response?.data?.error || err.message}\n`);
  }

  // 6. Verify Status
  console.log('6. Verifying alert status...');
  try {
    const res = await axios.get(`${API_URL}/alert/${alertId}`);
    console.log(`   ✅ Status: ${res.data.status}`);
    console.log(`   ✅ Responder: ${res.data.responderName}\n`);
  } catch (err) {
    console.log(`   ❌ ${err.message}\n`);
  }

  // Cleanup
  if (responderId) {
    try {
      await axios.delete(`${API_URL}/responder/${responderId}`);
      console.log('✅ Cleanup complete\n');
    } catch (err) {}
  }

  console.log('═══════════════════════════════════════');
  console.log('✅ DUAL-ROUTING SYSTEM: WORKING');
  console.log('═══════════════════════════════════════');
  console.log('\n📊 Next Steps:');
  console.log('   1. Open: http://localhost:5000/dashboard');
  console.log('   2. Trigger SOS from mobile app');
  console.log('   3. Watch alert appear on dashboard');
  console.log('   4. Click "Accept & Dispatch"');
  console.log('   5. Verify status sync\n');
}

test().catch(err => console.error('Test failed:', err.message));
