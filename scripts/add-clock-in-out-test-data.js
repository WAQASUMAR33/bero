/**
 * Script to add test clock in/out records using API endpoints
 * Run with: node scripts/add-clock-in-out-test-data.js
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// You'll need to update these with actual credentials
const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'password';

let authToken = '';

async function login() {
  try {
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
      console.log('✅ Login successful');
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

async function getUsers() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    const users = await response.json();
    if (Array.isArray(users)) {
      console.log(`✅ Found ${users.length} users`);
      return users;
    }
    return [];
  } catch (error) {
    console.error('❌ Error fetching users:', error.message);
    return [];
  }
}

async function getShifts() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/shifts?view=all`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    const shifts = await response.json();
    if (Array.isArray(shifts)) {
      console.log(`✅ Found ${shifts.length} shifts`);
      return shifts;
    }
    return [];
  } catch (error) {
    console.error('❌ Error fetching shifts:', error.message);
    return [];
  }
}

async function clockIn(userId, shiftAssignmentId, serviceSeekerId, date, workType = 'REGULAR') {
  try {
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
        workType,
        location: '51.5074,-0.1278', // London coordinates
        notes: 'Test clock in via script',
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Clocked in user ${userId} for date ${date}`);
      return data.data;
    } else {
      console.error(`❌ Clock in failed for user ${userId}:`, data.error);
      return null;
    }
  } catch (error) {
    console.error(`❌ Clock in error for user ${userId}:`, error.message);
    return null;
  }
}

async function clockOut(clockInOutId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/clock-in-out/clock-out`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        clockInOutId,
        location: '51.5074,-0.1278',
        notes: 'Test clock out via script',
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ Clocked out record ${clockInOutId}`);
      return data.data;
    } else {
      console.error(`❌ Clock out failed for record ${clockInOutId}:`, data.error);
      return null;
    }
  } catch (error) {
    console.error(`❌ Clock out error for record ${clockInOutId}:`, error.message);
    return null;
  }
}

// Helper to get dates
function getDateString(daysAgo = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

async function main() {
  console.log('🚀 Starting clock in/out test data creation...\n');

  // Step 1: Login
  console.log('Step 1: Logging in...');
  const loggedIn = await login();
  if (!loggedIn) {
    console.error('❌ Cannot proceed without authentication');
    process.exit(1);
  }
  console.log('');

  // Step 2: Get users
  console.log('Step 2: Fetching users...');
  const users = await getUsers();
  if (users.length === 0) {
    console.error('❌ No users found. Cannot create clock in/out records.');
    process.exit(1);
  }
  console.log('');

  // Step 3: Get shifts (optional, for shift assignments)
  console.log('Step 3: Fetching shifts...');
  const shifts = await getShifts();
  console.log('');

  // Step 4: Create clock in/out records
  console.log('Step 4: Creating clock in/out records...\n');

  const clockInRecords = [];

  // Create clock ins for the last 7 days for different users
  for (let day = 0; day < 7; day++) {
    const date = getDateString(day);
    const userIndex = day % users.length;
    const user = users[userIndex];

    // Try to find a shift assignment for this user
    let shiftAssignmentId = null;
    let serviceSeekerId = null;

    if (shifts.length > 0) {
      const shift = shifts[day % shifts.length];
      if (shift.assignments && shift.assignments.length > 0) {
        const assignment = shift.assignments.find(a => a.userId === user.id);
        if (assignment) {
          shiftAssignmentId = assignment.id;
          serviceSeekerId = shift.serviceSeekerId;
        }
      }
      if (!serviceSeekerId && shift.serviceSeeker) {
        serviceSeekerId = shift.serviceSeeker.id;
      }
    }

    // Clock in
    const clockInRecord = await clockIn(
      user.id,
      shiftAssignmentId,
      serviceSeekerId,
      date,
      day % 3 === 0 ? 'STANDBY' : 'REGULAR' // Every 3rd day is standby
    );

    if (clockInRecord) {
      clockInRecords.push(clockInRecord);

      // Clock out for records older than today (completed shifts)
      if (day > 0) {
        // Wait a bit before clocking out
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await clockOut(clockInRecord.id);
      }
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n✅ Created ${clockInRecords.length} clock in/out records`);
  console.log('\n🎉 Test data creation complete!');
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

