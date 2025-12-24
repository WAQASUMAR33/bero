/**
 * Comprehensive test script for clock-in API endpoint
 * Tests all scenarios to ensure clock-in works smoothly
 * Run with: node scripts/test-clock-in-comprehensive.js
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Test credentials - update these with valid credentials
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

async function testClockIn(requestBody, testName) {
  try {
    console.log(`\n🧪 Test: ${testName}`);
    console.log(`   Request Body:`, JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`${API_BASE_URL}/api/clock-in-out/clock-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(requestBody),
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
        console.log(`      Service Seeker ID: ${data.data.serviceSeekerId}`);
        console.log(`      Date: ${data.data.date}`);
        console.log(`      Clock In Time: ${data.data.clockInTime}`);
        console.log(`      Is Late: ${data.data.isLate}`);
        console.log(`      Work Type: ${data.data.workType}`);
        console.log(`      Message: ${data.message}`);
      }
      return { success: true, data: data.data, status };
    } else {
      console.log(`   ❌ FAILED - ${data.error}`);
      return { success: false, error: data.error, status };
    }
  } catch (error) {
    console.error(`   ❌ ERROR - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testClockOut(clockInOutId, testName) {
  try {
    console.log(`\n🧪 Test: ${testName}`);
    console.log(`   Clock In Out ID: ${clockInOutId}`);
    
    const response = await fetch(`${API_BASE_URL}/api/clock-in-out/clock-out`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        clockInOutId,
        location: '51.5074,-0.1278',
        notes: 'Test clock out'
      }),
    });

    const data = await response.json();
    const status = response.status;
    
    console.log(`   Status: ${status}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log(`   ✅ SUCCESS - Clock out successful`);
      return { success: true, data: data.data, status };
    } else {
      console.log(`   ❌ FAILED - ${data.error}`);
      return { success: false, error: data.error, status };
    }
  } catch (error) {
    console.error(`   ❌ ERROR - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting Comprehensive Clock-In API Tests\n');
  console.log('='.repeat(70));
  
  // Step 1: Login
  console.log('\n📋 Step 1: Authentication');
  console.log('-'.repeat(70));
  const loggedIn = await login();
  if (!loggedIn) {
    console.error('\n❌ Cannot proceed without authentication');
    console.error('Please set TEST_EMAIL and TEST_PASSWORD environment variables');
    process.exit(1);
  }
  
  // Step 2: Get available shifts
  console.log('\n📋 Step 2: Fetching Available Shifts');
  console.log('-'.repeat(70));
  const today = new Date().toISOString().split('T')[0];
  const shifts = await getMyShifts(today);
  
  // Step 3: Run Test Cases
  console.log('\n📋 Step 3: Running Test Cases');
  console.log('='.repeat(70));
  
  const results = [];
  let clockInOutId = null;
  
  // Test Case 1: Clock in with shiftAssignmentId (Preferred method)
  if (shifts.length > 0) {
    const firstShift = shifts[0];
    const result1 = await testClockIn({
      shiftAssignmentId: firstShift.shiftAssignmentId,
      shiftId: firstShift.shiftId,
      serviceSeekerId: firstShift.serviceSeeker?.id,
      date: today,
      workType: 'REGULAR',
      location: '51.5074,-0.1278',
      notes: 'Test clock in with shiftAssignmentId'
    }, 'Clock In with shiftAssignmentId (Preferred)');
    results.push({ test: 'Clock In with shiftAssignmentId', ...result1 });
    if (result1.success && result1.data) {
      clockInOutId = result1.data.id;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test Case 2: Try to clock in again (should fail - already clocked in)
    const result2 = await testClockIn({
      shiftAssignmentId: firstShift.shiftAssignmentId,
      serviceSeekerId: firstShift.serviceSeeker?.id,
      date: today
    }, 'Duplicate Clock In (Should Fail)');
    results.push({ test: 'Duplicate Clock In', ...result2 });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test Case 3: Clock out the first shift
    if (clockInOutId) {
      const result3 = await testClockOut(clockInOutId, 'Clock Out');
      results.push({ test: 'Clock Out', ...result3 });
      clockInOutId = null;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Test Case 4: Clock in again after clocking out (should work for different shift)
    if (shifts.length > 1) {
      const secondShift = shifts[1];
      const result4 = await testClockIn({
        shiftAssignmentId: secondShift.shiftAssignmentId,
        shiftId: secondShift.shiftId,
        serviceSeekerId: secondShift.serviceSeeker?.id,
        date: today,
        location: '51.5074,-0.1278'
      }, 'Clock In for Second Shift (After Clocking Out First)');
      results.push({ test: 'Clock In Second Shift', ...result4 });
      if (result4.success && result4.data) {
        clockInOutId = result4.data.id;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Test Case 5: Clock in with only shiftId (fallback method)
    if (shifts.length > 0) {
      // First clock out if needed
      if (clockInOutId) {
        await testClockOut(clockInOutId, 'Clock Out Before shiftId Test');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      const testShift = shifts[0];
      const result5 = await testClockIn({
        shiftId: testShift.shiftId,
        serviceSeekerId: testShift.serviceSeeker?.id,
        date: today,
        location: '51.5074,-0.1278',
        notes: 'Test clock in with shiftId only'
      }, 'Clock In with shiftId Only (Fallback)');
      results.push({ test: 'Clock In with shiftId only', ...result5 });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } else {
    console.log('\n⚠️  No shifts found for today. Testing with invalid data...\n');
    
    // Test Case: Invalid shift assignment (should fail gracefully)
    const resultInvalid = await testClockIn({
      shiftAssignmentId: 999999,
      date: today
    }, 'Invalid Shift Assignment ID (Should Fail Gracefully)');
    results.push({ test: 'Invalid Shift Assignment', ...resultInvalid });
  }
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('='.repeat(70));
  results.forEach((result, index) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const statusCode = result.status ? ` (HTTP ${result.status})` : '';
    console.log(`${index + 1}. ${result.test}: ${status}${statusCode}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  console.log(`\nTotal: ${results.length} tests | Passed: ${passed} | Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Clock-in API is working smoothly.');
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed. Please review the errors above.`);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('🎉 Testing Complete!');
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

