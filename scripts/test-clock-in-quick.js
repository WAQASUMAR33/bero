/**
 * Quick test script - Tests clock-in with sample JSON data
 * Run with: node scripts/test-clock-in-quick.js
 * 
 * Usage: Set environment variables:
 *   TEST_EMAIL=your-email@example.com
 *   TEST_PASSWORD=your-password
 *   SHIFT_ASSIGNMENT_ID=123 (optional, will fetch from my-shifts if not provided)
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'password';
const SHIFT_ASSIGNMENT_ID = process.env.SHIFT_ASSIGNMENT_ID ? parseInt(process.env.SHIFT_ASSIGNMENT_ID) : null;

let authToken = '';

async function login() {
  try {
    console.log('🔐 Logging in...');
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    });

    const data = await response.json();
    if (data.success && data.token) {
      authToken = data.token;
      console.log('✅ Login successful\n');
      return true;
    } else {
      console.error('❌ Login failed:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return false;
  }
}

async function getShifts() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await fetch(`${API_BASE_URL}/api/clock-in-out/my-shifts?date=${today}`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
    });

    const result = await response.json();
    if (result.success && result.data.length > 0) {
      return result.data;
    }
    return [];
  } catch (error) {
    console.error('❌ Error fetching shifts:', error.message);
    return [];
  }
}

async function testClockIn(requestBody) {
  console.log('📤 Sending clock-in request...');
  console.log('Request Body:', JSON.stringify(requestBody, null, 2));
  console.log('');

  try {
    const response = await fetch(`${API_BASE_URL}/api/clock-in-out/clock-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    
    console.log(`📥 Response Status: ${response.status}`);
    console.log('Response Body:', JSON.stringify(data, null, 2));
    console.log('');

    if (data.success) {
      console.log('✅ Clock-in successful!');
      console.log(`   Record ID: ${data.data.id}`);
      console.log(`   Shift Assignment ID: ${data.data.shiftAssignmentId}`);
      console.log(`   Clock In Time: ${data.data.clockInTime}`);
      console.log(`   Is Late: ${data.data.isLate}`);
      console.log(`   Message: ${data.message}`);
      return { success: true, data: data.data };
    } else {
      console.log('❌ Clock-in failed:', data.error);
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('❌ Request error:', error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Quick Clock-In API Test\n');
  console.log('='.repeat(60));

  // Login
  if (!await login()) {
    process.exit(1);
  }

  // Get shifts if needed
  let shiftAssignmentId = SHIFT_ASSIGNMENT_ID;
  let shiftId = null;
  let serviceSeekerId = null;

  if (!shiftAssignmentId) {
    console.log('📋 Fetching available shifts...');
    const shifts = await getShifts();
    
    if (shifts.length === 0) {
      console.error('❌ No shifts found. Please provide SHIFT_ASSIGNMENT_ID or ensure you have shifts assigned.');
      process.exit(1);
    }

    const firstShift = shifts[0];
    shiftAssignmentId = firstShift.shiftAssignmentId;
    shiftId = firstShift.shiftId;
    serviceSeekerId = firstShift.serviceSeeker?.id;
    
    console.log(`✅ Found ${shifts.length} shift(s)`);
    console.log(`   Using shift: ${firstShift.serviceSeeker?.preferredName || firstShift.serviceSeeker?.firstName} - ${firstShift.startTime} to ${firstShift.endTime}`);
    console.log(`   Shift Assignment ID: ${shiftAssignmentId}`);
    console.log(`   Shift ID: ${shiftId}\n`);
  }

  // Test clock-in with sample JSON data
  const today = new Date().toISOString().split('T')[0];
  
  const requestBody = {
    shiftAssignmentId: shiftAssignmentId,
    shiftId: shiftId, // Include as backup
    serviceSeekerId: serviceSeekerId,
    date: today,
    workType: 'REGULAR',
    location: '51.5074,-0.1278',
    notes: 'Test clock-in from quick test script'
  };

  const result = await testClockIn(requestBody);

  console.log('='.repeat(60));
  if (result.success) {
    console.log('🎉 Test completed successfully!');
    console.log(`\nYou can now test clock-out with:`);
    console.log(`  clockInOutId: ${result.data.id}`);
  } else {
    console.log('⚠️  Test completed with errors');
  }
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

