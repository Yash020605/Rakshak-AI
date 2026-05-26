/**
 * Rakshak AI Backend API Test Script
 * Run: node test-api.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(status, message) {
  const color = status === 'PASS' ? colors.green : status === 'FAIL' ? colors.red : colors.yellow;
  console.log(`${color}[${status}]${colors.reset} ${message}`);
}

async function testEndpoint(name, method, url, data = null) {
  try {
    const config = { method, url, timeout: 5000 };
    if (data) config.data = data;
    
    const response = await axios(config);
    log('PASS', `${name} - Status: ${response.status}`);
    return { success: true, data: response.data };
  } catch (error) {
    const status = error.response?.status || 'NO_RESPONSE';
    const message = error.response?.data?.error || error.message;
    log('FAIL', `${name} - ${status}: ${message}`);
    return { success: false, error: message };
  }
}

async function runTests() {
  console.log(`\n${colors.blue}=== Rakshak AI Backend Tests ===${colors.reset}\n`);

  // Test 1: Health Check
  await testEndpoint('Health Check', 'GET', `${BASE_URL}/health`);

  // Test 2: Create Profile
  const testProfile = {
    userId: `test_${Date.now()}`,
    name: 'Test User',
    bloodGroup: 'O+',
    medicalConditions: 'None',
    emergencyContacts: [
      { name: 'Emergency Contact', phone: '+1234567890' }
    ]
  };
  
  const profileResult = await testEndpoint(
    'Create Profile',
    'POST',
    `${API_URL}/profile`,
    testProfile
  );

  // Test 3: Get Profile
  if (profileResult.success) {
    await testEndpoint(
      'Get Profile',
      'GET',
      `${API_URL}/profile/${testProfile.userId}`
    );
  }

  // Test 4: Create SOS Alert
  const testAlert = {
    userId: testProfile.userId,
    type: 'medical',
    latitude: 19.0760,
    longitude: 72.8777,
  };

  const alertResult = await testEndpoint(
    'Create SOS Alert',
    'POST',
    `${API_URL}/alert/sos`,
    testAlert
  );

  // Test 5: Get Alert
  if (alertResult.success && alertResult.data.alertId) {
    await testEndpoint(
      'Get Alert',
      'GET',
      `${API_URL}/alert/${alertResult.data.alertId}`
    );
  }

  // Test 6: Update Location
  await testEndpoint(
    'Update Location',
    'POST',
    `${API_URL}/location/update`,
    {
      userId: testProfile.userId,
      latitude: 19.0760,
      longitude: 72.8777,
    }
  );

  // Test 7: Get Live Location
  await testEndpoint(
    'Get Live Location',
    'GET',
    `${API_URL}/location/live/${testProfile.userId}`
  );

  // Test 8: Find Nearest Service
  await testEndpoint(
    'Find Nearest Service',
    'GET',
    `${API_URL}/location/nearest?lat=19.0760&lng=72.8777&type=medical`
  );

  console.log(`\n${colors.blue}=== Test Summary ===${colors.reset}`);
  console.log('If you see FAIL messages related to MongoDB, update your .env file.');
  console.log('See SETUP_GUIDE.md for detailed instructions.\n');
}

// Run tests
runTests().catch(err => {
  log('FAIL', `Test suite error: ${err.message}`);
  process.exit(1);
});
