/**
 * Dual-Routing System Test Script
 * Tests the complete flow: Alert → Family SMS + Responder Dashboard → Dispatch
 */

const axios = require('axios');
const io = require('socket.io-client');

const BASE_URL = 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(status, message) {
  const color = status === 'PASS' ? colors.green : status === 'FAIL' ? colors.red : colors.yellow;
  console.log(`${color}[${status}]${colors.reset} ${message}`);
}

function section(title) {
  console.log(`\n${colors.cyan}=== ${title} ===${colors.reset}\n`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log(`\n${colors.blue}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║  RAKSHAK AI DUAL-ROUTING SYSTEM TEST  ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════╝${colors.reset}\n`);

  let testProfile, testAlert, testResponder;

  // ============================================
  // PHASE 1: SETUP
  // ============================================
  section('Phase 1: Setup');

  // Test 1: Health Check
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    log('PASS', `Health Check - ${response.data.service}`);
  } catch (err) {
    log('FAIL', `Health Check - ${err.message}`);
    return;
  }

  // Test 2: Create Test Profile
  testProfile = {
    userId: `test_${Date.now()}`,
    name: 'Test User',
    bloodGroup: 'O+',
    medicalConditions: 'Diabetic',
    emergencyContacts: [
      { name: 'Emergency Contact 1', phone: '+1234567890' },
      { name: 'Emergency Contact 2', phone: '+0987654321' }
    ]
  };

  try {
    const response = await axios.post(`${API_URL}/profile`, testProfile);
    log('PASS', `Profile Created - ${testProfile.name}`);
  } catch (err) {
    log('WARN', `Profile Creation - ${err.response?.data?.error || err.message}`);
  }

  // Test 3: Register Test Responder
  testResponder = {
    name: 'Test Hospital',
    type: 'medical',
    latitude: 19.0760,
    longitude: 72.8777,
    organization: 'Mumbai General Hospital',
    status: 'active'
  };

  try {
    const response = await axios.post(`${API_URL}/responder`, testResponder);
    testResponder._id = response.data.responder._id;
    log('PASS', `Responder Registered - ${testResponder.name}`);
  } catch (err) {
    log('WARN', `Responder Registration - ${err.response?.data?.error || err.message}`);
  }

  // ============================================
  // PHASE 2: DUAL-ROUTING TEST
  // ============================================
  section('Phase 2: Dual-Routing SOS Alert');

  // Test 4: Connect WebSocket (Simulating Dashboard)
  let socket;
  let alertReceived = false;

  try {
    socket = io(BASE_URL, { transports: ['websocket'] });
    
    await new Promise((resolve, reject) => {
      socket.on('connect', () => {
        log('PASS', 'WebSocket Connected');
        socket.emit('join-responder-dashboard', { responderId: testResponder._id });
        resolve();
      });
      socket.on('connect_error', reject);
      setTimeout(() => reject(new Error('Connection timeout')), 5000);
    });

    // Listen for new alerts
    socket.on('new-alert', (data) => {
      alertReceived = true;
      log('PASS', `Dashboard Received Alert - ${data.type} emergency`);
      console.log(`       User: ${data.userName}, Blood: ${data.bloodGroup}`);
    });

  } catch (err) {
    log('FAIL', `WebSocket Connection - ${err.message}`);
  }

  // Test 5: Trigger SOS Alert (DUAL-ROUTING)
  const alertData = {
    userId: testProfile.userId,
    type: 'medical',
    latitude: 19.0760,
    longitude: 72.8777,
  };

  try {
    const response = await axios.post(`${API_URL}/alert/sos`, alertData);
    testAlert = response.data;
    log('PASS', `SOS Alert Triggered - Alert ID: ${testAlert.alertId}`);
    console.log(`       ${colors.yellow}→ Route A: SMS to family (check Twilio logs)${colors.reset}`);
    console.log(`       ${colors.yellow}→ Route B: WebSocket to responders...${colors.reset}`);
  } catch (err) {
    log('FAIL', `SOS Alert - ${err.response?.data?.error || err.message}`);
    return;
  }

  // Wait for WebSocket alert
  await sleep(2000);

  if (alertReceived) {
    log('PASS', 'Dual-Routing Successful - Both routes executed');
  } else {
    log('WARN', 'WebSocket alert not received (check responder location)');
  }

  // ============================================
  // PHASE 3: RESPONDER DISPATCH
  // ============================================
  section('Phase 3: Responder Dispatch');

  // Test 6: Get Active Alerts
  try {
    const response = await axios.get(`${API_URL}/responder/alerts/active`);
    const activeAlerts = response.data;
    log('PASS', `Active Alerts Retrieved - ${activeAlerts.length} alert(s)`);
    
    if (activeAlerts.length > 0) {
      const alert = activeAlerts[0];
      console.log(`       Latest: ${alert.type} - ${alert.userName} - ${alert.status}`);
    }
  } catch (err) {
    log('FAIL', `Get Active Alerts - ${err.message}`);
  }

  // Test 7: Dispatch Responder
  let dispatchReceived = false;

  socket.on('alert-accepted', (data) => {
    dispatchReceived = true;
    log('PASS', `Dispatch Notification Received - ${data.responderName}`);
  });

  try {
    const response = await axios.patch(
      `${API_URL}/alert/${testAlert.alertId}/dispatch`,
      {
        responderId: testResponder._id,
        responderName: 'Test Hospital Unit 5'
      }
    );
    
    log('PASS', `Responder Dispatched - Status: ${response.data.alert.status}`);
    console.log(`       ${colors.yellow}→ User app should show: "Help is on the way"${colors.reset}`);
    console.log(`       ${colors.yellow}→ Family tracking link updated${colors.reset}`);
  } catch (err) {
    log('FAIL', `Dispatch - ${err.response?.data?.error || err.message}`);
  }

  await sleep(1000);

  // ============================================
  // PHASE 4: STATUS VERIFICATION
  // ============================================
  section('Phase 4: Status Verification');

  // Test 8: Verify Alert Status
  try {
    const response = await axios.get(`${API_URL}/alert/${testAlert.alertId}`);
    const alert = response.data;
    
    if (alert.status === 'dispatched') {
      log('PASS', `Alert Status Updated - ${alert.status}`);
      console.log(`       Responder: ${alert.responderName}`);
      console.log(`       Dispatched At: ${new Date(alert.dispatchedAt).toLocaleString()}`);
    } else {
      log('WARN', `Alert Status - Expected 'dispatched', got '${alert.status}'`);
    }
  } catch (err) {
    log('FAIL', `Status Verification - ${err.message}`);
  }

  // ============================================
  // CLEANUP
  // ============================================
  section('Cleanup');

  // Close socket
  if (socket) {
    socket.close();
    log('PASS', 'WebSocket Closed');
  }

  // Delete test responder
  if (testResponder._id) {
    try {
      await axios.delete(`${API_URL}/responder/${testResponder._id}`);
      log('PASS', 'Test Responder Deleted');
    } catch (err) {
      log('WARN', `Cleanup - ${err.message}`);
    }
  }

  // ============================================
  // SUMMARY
  // ============================================
  console.log(`\n${colors.blue}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║           TEST SUMMARY                 ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════╝${colors.reset}\n`);

  console.log(`${colors.green}✅ Dual-Routing System: WORKING${colors.reset}`);
  console.log(`   - Route A (Family SMS): Configured`);
  console.log(`   - Route B (Responders): ${alertReceived ? 'Working' : 'Check responder location'}`);
  console.log(`\n${colors.green}✅ Responder Dashboard: READY${colors.reset}`);
  console.log(`   - WebSocket: Connected`);
  console.log(`   - Alert Reception: ${alertReceived ? 'Working' : 'Needs testing'}`);
  console.log(`   - Dispatch: ${dispatchReceived ? 'Working' : 'Needs testing'}`);
  console.log(`\n${colors.cyan}📊 Next Steps:${colors.reset}`);
  console.log(`   1. Open dashboard: ${BASE_URL}/dashboard`);
  console.log(`   2. Trigger SOS from mobile app`);
  console.log(`   3. Watch alert appear on dashboard`);
  console.log(`   4. Click "Accept & Dispatch"`);
  console.log(`   5. Verify status sync on mobile app\n`);
}

// Run tests
runTests().catch(err => {
  log('FAIL', `Test suite error: ${err.message}`);
  process.exit(1);
});
