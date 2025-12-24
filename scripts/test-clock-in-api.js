/**
 * Test script for clock-in API endpoint
 * Run with: node scripts/test-clock-in-api.js
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Test credentials - update these if needed
const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'password';

let authToken = '';
let testUserId = null;

async function login() {
  try {
    console.log('🔐 Attempting to login...');
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    const data = await response.json();
    
    if (data.success && data.token) {
      authToken = data.token;
      testUserId = data.user.id;
      console.log('✅ Login successful');
      console.log(`   User ID: ${testUserId}`);
      console.log(`   Email: ${data.user.email}`);
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

async function getMyShifts(date = null) {
  try {
    const dateParam = date || new Date().toISOString().split('T')[0];
    const response = await fetch(`${API_BASE_URL}/api/clock-in-out/my-shifts?date=${dateParam}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Found ${result.data.length} shifts for ${dateParam}`);
      return result.data;
    } else {
      console.error('❌ Failed to fetch shifts:', result.error);
      return [];
    }
  } catch (error) {
    console.error('❌ Error fetching shifts:', error.message);
    return [];
  }
}

async function testClockIn(shiftAssignmentId, serviceSeekerId, date, testName) {
  try {
    console.log(`\n🧪 Test: ${testName}`);
    console.log(`   Shift Assignment ID: ${shiftAssignmentId}`);
    console.log(`   Service Seeker ID: ${serviceSeekerId}`);
    console.log(`   Date: ${date}`);
    
    const response = await fetch(`${API_BASE_URL}/api/clock-in-out/clock-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        shiftAssignmentId,
        serviceSeekerId,
        date,
        workType: 'REGULAR',
        location: '51.5074,-0.1278',
        notes: `Test clock in - ${testName}`,
      }),
    });

    const data = await response.json();
    const status = response.status;
    
    console.log(`   Status: ${status}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log(`   ✅ SUCCESS - Clock in successful`);
      if (data.data) {
        console.log(`      Clock In Record ID: ${data.data.id}`);
        console.log(`      User ID: ${data.data.userId}`);
        console.log(`      Shift Assignment ID: ${data.data.shiftAssignmentId}`);
        console.log(`      Clock In Time: ${data.data.clockInTime}`);
        console.log(`      Is Late: ${data.data.isLate}`);
      }
      return { success: true, data: data.data };
    } else {
      console.log(`   ❌ FAILED - ${data.error}`);
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error(`   ❌ ERROR - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting Clock-In API Tests\n');
  console.log('='.repeat(60));
  
  // Step 1: Login
  console.log('\n📋 Step 1: Authentication');
  console.log('-'.repeat(60));
  const loggedIn = await login();
  if (!loggedIn) {
    console.error('\n❌ Cannot proceed without authentication');
    process.exit(1);
  }
  
  // Step 2: Get available shifts
  console.log('\n📋 Step 2: Fetching Available Shifts');
  console.log('-'.repeat(60));
  const shifts = await getMyShifts();
  
  if (shifts.length === 0) {
    console.log('\n⚠️  No shifts found for today. Testing with invalid data...\n');
  }
  
  // Step 3: Test Cases
  console.log('\n📋 Step 3: Running Test Cases');
  console.log('='.repeat(60));
  
  const results = [];
  
  // Test Case 1: Clock in with valid shift assignment
  if (shifts.length > 0) {
    const firstShift = shifts[0];
    const result1 = await testClockIn(
      firstShift.shiftAssignmentId,
      firstShift.serviceSeeker?.id || null,
      new Date().toISOString().split('T')[0],
      'Valid Shift Assignment'
    );
    results.push({ test: 'Valid Shift Assignment', ...result1 });
    
    // Wait a bit before next test
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test Case 2: Try to clock in again (should fail - already clocked in)
    const result2 = await testClockIn(
      firstShift.shiftAssignmentId,
      firstShift.serviceSeeker?.id || null,
      new Date().toISOString().split('T')[0],
      'Duplicate Clock In (Should Fail)'
    );
    results.push({ test: 'Duplicate Clock In', ...result2 });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Test Case 3: Invalid shift assignment ID (should return 404)
  const result3 = await testClockIn(
    999999,
    null,
    new Date().toISOString().split('T')[0],
    'Invalid Shift Assignment ID (Should Fail)'
  );
  results.push({ test: 'Invalid Shift Assignment', ...result3 });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test Case 4: Missing shift assignment (should auto-find if available)
  const result4 = await testClockIn(
    null,
    null,
    new Date().toISOString().split('T')[0],
    'No Shift Assignment ID (Auto-find)'
  );
  results.push({ test: 'Auto-find Shift Assignment', ...result4 });
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('='.repeat(60));
  results.forEach((result, index) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${index + 1}. ${result.test}: ${status}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  console.log(`\nTotal: ${results.length} tests | Passed: ${passed} | Failed: ${failed}`);
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Testing Complete!');
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

