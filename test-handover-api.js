// Test script for Handover API endpoints
// Run with: node test-handover-api.js

const BASE_URL = 'http://localhost:3000';

// Test data - Using default seed credentials
const TEST_EMAIL = 'admin@gmail.com'; // From seed.js
const TEST_PASSWORD = '786@786'; // From seed.js

let authToken = '';

async function login() {
  try {
    console.log('🔐 Testing Login...');
    console.log(`   URL: ${BASE_URL}/api/auth/login`);
    console.log(`   Email: ${TEST_EMAIL}`);
    
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.log('❌ Login failed - Response status:', response.status);
      console.log('   Response:', text);
      return false;
    }

    const data = await response.json();
    if (data.token || data.success) {
      authToken = data.token || (data.success ? data.token : null);
      console.log('✅ Login successful');
      console.log('   User:', data.user?.firstName, data.user?.lastName);
      console.log('   User ID:', data.user?.id);
      return true;
    } else {
      console.log('❌ Login failed:', data.error || data);
      return false;
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   Server is not running. Please start your Next.js server with: npm run dev');
    }
    return false;
  }
}

async function testGetHandovers() {
  try {
    console.log('\n📋 Testing GET /api/handovers...');
    const response = await fetch(`${BASE_URL}/api/handovers`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();
    if (response.ok) {
      console.log('✅ GET handovers successful');
      console.log(`Found ${data.data?.length || 0} handovers`);
      if (data.data && data.data.length > 0) {
        console.log('Sample handover:', JSON.stringify(data.data[0], null, 2));
      }
      return data.data || [];
    } else {
      console.log('❌ GET handovers failed:', data.error || data);
      return [];
    }
  } catch (error) {
    console.error('❌ GET handovers error:', error.message);
    return [];
  }
}

async function testGetAvailableShifts() {
  try {
    console.log('\n🔍 Testing GET /api/handovers/available...');
    // You'll need to provide a real fromShiftAssignmentId
    const fromShiftAssignmentId = 1; // Update with real ID
    
    const response = await fetch(`${BASE_URL}/api/handovers/available?fromShiftAssignmentId=${fromShiftAssignmentId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();
    if (response.ok) {
      console.log('✅ GET available shifts successful');
      console.log('From assignment:', JSON.stringify(data.data?.fromAssignment, null, 2));
      console.log(`Found ${data.data?.availableAssignments?.length || 0} available assignments`);
      return data.data;
    } else {
      console.log('❌ GET available shifts failed:', data.error || data);
      return null;
    }
  } catch (error) {
    console.error('❌ GET available shifts error:', error.message);
    return null;
  }
}

async function testGetHandoverData() {
  try {
    console.log('\n📊 Testing GET /api/handovers/handover-data...');
    const serviceSeekerId = 1; // Update with real ID
    const date = new Date().toISOString().split('T')[0];
    
    const response = await fetch(`${BASE_URL}/api/handovers/handover-data?serviceSeekerId=${serviceSeekerId}&date=${date}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();
    if (response.ok) {
      console.log('✅ GET handover data successful');
      console.log('Data:', JSON.stringify(data.data, null, 2));
      return data.data;
    } else {
      console.log('❌ GET handover data failed:', data.error || data);
      return null;
    }
  } catch (error) {
    console.error('❌ GET handover data error:', error.message);
    return null;
  }
}

async function testCreateHandover() {
  try {
    console.log('\n➕ Testing POST /api/handovers...');
    
    // Example handover data - Update with real IDs
    const handoverData = {
      fromShiftAssignmentId: 1, // Update with real ID
      toShiftAssignmentId: 2, // Update with real ID (must be at same location)
      handoverNotes: "Test handover notes - Service user was calm today. Medication given at 2pm.",
      remainingTasks: [
        {
          taskType: "bathing",
          tasks: [
            { id: 1, date: new Date().toISOString().split('T')[0], time: "14:00" }
          ]
        }
      ],
      visits: [
        {
          id: 1,
          date: new Date().toISOString().split('T')[0],
          time: "16:00",
          visitType: "FAMILY",
          name: "John Doe",
          purpose: "Family visit"
        }
      ],
      issues: "Service user mentioned feeling tired today. No immediate concerns."
    };

    const response = await fetch(`${BASE_URL}/api/handovers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(handoverData)
    });

    const data = await response.json();
    if (response.ok) {
      console.log('✅ POST handover successful');
      console.log('Created handover:', JSON.stringify(data.data, null, 2));
      return data.data;
    } else {
      console.log('❌ POST handover failed:', data.error || data);
      console.log('Status:', response.status);
      return null;
    }
  } catch (error) {
    console.error('❌ POST handover error:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting Handover API Tests\n');
  console.log('⚠️  Make sure your Next.js server is running on http://localhost:3000');
  console.log('⚠️  Update TEST_EMAIL and TEST_PASSWORD with real credentials\n');

  // Login first
  const loggedIn = await login();
  if (!loggedIn) {
    console.log('\n❌ Cannot proceed without authentication');
    return;
  }

  // Run tests
  await testGetHandovers();
  await testGetAvailableShifts();
  await testGetHandoverData();
  
  // Test create (commented out by default - uncomment when you have real IDs)
  // await testCreateHandover();

  console.log('\n✅ Tests completed!');
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ This script requires Node.js 18+ or you need to install node-fetch');
  console.log('   Install: npm install node-fetch');
  process.exit(1);
}

runTests().catch(console.error);

