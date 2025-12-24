# Clock-In API Test Guide

This guide shows you how to test the clock-in API endpoint with JSON data.

## Test Scripts Created

1. **`test-clock-in-comprehensive.js`** - Full test suite covering all scenarios
2. **`test-clock-in-quick.js`** - Quick single test
3. **`clock-in-test-examples.json`** - Example JSON request/response data

## Quick Start

### Option 1: Run Comprehensive Tests

```bash
node scripts/test-clock-in-comprehensive.js
```

This will test:
- Clock-in with shiftAssignmentId
- Duplicate clock-in prevention
- Clock-out
- Multiple shifts per day
- Clock-in with shiftId only

### Option 2: Run Quick Test

```bash
# Set environment variables (optional)
$env:TEST_EMAIL="your-email@example.com"
$env:TEST_PASSWORD="your-password"

# Run test
node scripts/test-clock-in-quick.js
```

### Option 3: Manual cURL Test

#### Step 1: Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"your-password"}'
```

Save the token from response.

#### Step 2: Get Shifts
```bash
curl http://localhost:3000/api/clock-in-out/my-shifts?date=2025-01-20 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Step 3: Clock In (with shiftAssignmentId - Preferred)
```bash
curl -X POST http://localhost:3000/api/clock-in-out/clock-in \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "shiftAssignmentId": 123,
    "shiftId": 45,
    "serviceSeekerId": 12,
    "date": "2025-01-20",
    "workType": "REGULAR",
    "location": "51.5074,-0.1278",
    "notes": "Arrived on time"
  }'
```

#### Step 4: Clock In (with shiftId only - Fallback)
```bash
curl -X POST http://localhost:3000/api/clock-in-out/clock-in \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "shiftId": 45,
    "serviceSeekerId": 12,
    "date": "2025-01-20",
    "location": "51.5074,-0.1278"
  }'
```

#### Step 5: Clock Out
```bash
curl -X POST http://localhost:3000/api/clock-in-out/clock-out \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "clockInOutId": 789,
    "location": "51.5074,-0.1278",
    "notes": "Shift completed"
  }'
```

## Example JSON Request Bodies

### 1. Complete Clock-In Request (Recommended)
```json
{
  "shiftAssignmentId": 123,
  "shiftId": 45,
  "serviceSeekerId": 12,
  "date": "2025-01-20",
  "workType": "REGULAR",
  "location": "51.5074,-0.1278",
  "notes": "Arrived on time"
}
```

### 2. Minimal Clock-In Request
```json
{
  "shiftAssignmentId": 123,
  "date": "2025-01-20"
}
```

### 3. Clock-In with shiftId Only
```json
{
  "shiftId": 45,
  "serviceSeekerId": 12,
  "date": "2025-01-20",
  "location": "51.5074,-0.1278"
}
```

### 4. Clock-In for STANDBY Shift
```json
{
  "shiftAssignmentId": 123,
  "serviceSeekerId": 12,
  "date": "2025-01-20",
  "workType": "STANDBY",
  "location": "51.5074,-0.1278"
}
```

## Expected Success Response

```json
{
  "success": true,
  "data": {
    "id": 789,
    "userId": 21,
    "shiftAssignmentId": 123,
    "serviceSeekerId": 12,
    "date": "2025-01-20T00:00:00.000Z",
    "clockInTime": "2025-01-20T08:05:00.000Z",
    "clockOutTime": null,
    "workType": "REGULAR",
    "isLate": false,
    "clockInLocation": "51.5074,-0.1278",
    "notes": "Arrived on time",
    "user": {
      "id": 21,
      "firstName": "John",
      "lastName": "Doe"
    },
    "serviceSeeker": {
      "id": 12,
      "firstName": "Jane",
      "lastName": "Smith",
      "preferredName": "Jane"
    }
  },
  "message": "Clocked in successfully"
}
```

## Common Error Responses

### Already Clocked In
```json
{
  "success": false,
  "error": "You have already clocked in for this shift. Please clock out first before clocking in again."
}
```

### Shift Assignment Not Found
```json
{
  "success": false,
  "error": "Shift assignment not found. Please ensure you are assigned to this shift."
}
```

### Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

## Testing Checklist

- [x] Clock-in with shiftAssignmentId works
- [x] Clock-in with shiftId works (creates assignment if needed)
- [x] Duplicate clock-in is prevented
- [x] Multiple shifts per day supported
- [x] Clock-out works correctly
- [x] Late clock-in detection works
- [x] Early clock-out detection works
- [x] Error handling works correctly

## Notes

- Always use `shiftAssignmentId` when available (from my-shifts endpoint)
- Include `shiftId` as backup for auto-creation if assignment is missing
- The API automatically creates assignments when `shiftId` is provided
- Multiple shifts per day are now supported
- Clock-in checks are per shift assignment, not per day

