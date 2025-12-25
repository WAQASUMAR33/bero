# Clock-Out API Documentation

## Endpoint
**POST** `/api/clock-in-out/clock-out`

## Overview
The clock-out API allows users to clock out from a shift. Once a user clocks out, the `clockOutTime` field is set in the database, which marks the record as inactive. This allows the user to clock in to new shifts.

## How It Works

### Clock-Out Process
1. User sends a POST request with `clockInOutId` (or without it to use the most recent active clock-in)
2. API verifies the user owns the clock-in record
3. API sets `clockOutTime` to the current timestamp
4. User is now marked as "free" and can clock in to new shifts

### Availability After Clock-Out
The clock-in API checks for active records using:
```javascript
where: {
  userId: decoded.userId,
  shiftAssignmentId: finalShiftAssignmentId,
  clockInTime: { not: null },
  clockOutTime: null  // ← This is the key: null means active
}
```

Once `clockOutTime` is set (not null), the record is no longer considered "active", so:
- ✅ User can clock in to a new shift
- ✅ User shows as "free" in the system
- ✅ Multiple shifts per day are supported

## Request

### Headers
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

### Request Body (all fields optional, but clockInOutId is recommended)
```json
{
  "clockInOutId": 8,
  "location": "51.5074, -0.1278",
  "notes": "Optional notes for clock-out"
}
```

### Parameters
- **clockInOutId** (integer, optional): ID of the clock-in record to clock out from. If not provided, the API finds the most recent active clock-in for the user.
- **location** (string, optional): GPS coordinates or address where the user is clocking out
- **notes** (string, optional): Optional notes about the clock-out

## Response

### Success Response (200)
```json
{
  "success": true,
  "data": {
    "id": 8,
    "userId": 14,
    "shiftAssignmentId": 42,
    "serviceSeekerId": 9,
    "date": "2025-12-24T00:00:00.000Z",
    "clockInTime": "2025-12-24T11:49:08.684Z",
    "clockOutTime": "2025-12-24T16:30:00.000Z",
    "workType": "REGULAR",
    "isLate": true,
    "isEarly": false,
    "clockInLocation": "51.5074,-0.1278",
    "clockOutLocation": "51.5074, -0.1278",
    "notes": "Clock-out notes",
    "createdAt": "2025-12-24T11:49:08.694Z",
    "updatedAt": "2025-12-24T16:30:00.000Z",
    "user": {
      "id": 14,
      "firstName": "care",
      "lastName": "3"
    },
    "serviceSeeker": {
      "id": 9,
      "firstName": "Zain",
      "lastName": "Ahmad",
      "preferredName": "Zain"
    },
    "shiftAssignment": {
      "id": 42,
      "shiftId": 9,
      "userId": 14,
      "date": "2025-12-24T00:00:00.000Z",
      "status": "SCHEDULED",
      "shift": {
        "id": 9,
        "startTime": "15:50",
        "endTime": "03:49",
        "shiftType": {
          "id": 2,
          "name": "Shadow 10am - 6pm"
        }
      }
    }
  },
  "message": "Clocked out successfully"
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized"
}
```
Missing or invalid JWT token.

#### 403 Forbidden
```json
{
  "success": false,
  "error": "Unauthorized to clock out this record",
  "details": "Clock-in record belongs to user 14, but token is for user 15"
}
```
The clock-in record belongs to a different user.

#### 404 Not Found
```json
{
  "success": false,
  "error": "Clock in record not found"
}
```
The specified `clockInOutId` does not exist.

#### 404 No Active Clock-In
```json
{
  "success": false,
  "error": "No active clock in found"
}
```
No active clock-in found when `clockInOutId` is not provided.

#### 400 Already Clocked Out
```json
{
  "success": false,
  "error": "Already clocked out"
}
```
The clock-in record already has a `clockOutTime` set.

## Complete Workflow Example

### Step 1: User Clocks In
```json
POST /api/clock-in-out/clock-in
{
  "shiftAssignmentId": 42,
  "serviceSeekerId": 9,
  "location": "51.5074, -0.1278"
}

Response:
{
  "success": true,
  "data": {
    "id": 8,
    "clockInTime": "2025-12-24T11:49:08.684Z",
    "clockOutTime": null  // ← No clock-out yet (active)
  }
}
```

### Step 2: User Clocks Out
```json
POST /api/clock-in-out/clock-out
{
  "clockInOutId": 8,
  "location": "51.5074, -0.1278",
  "notes": "Shift completed"
}

Response:
{
  "success": true,
  "data": {
    "id": 8,
    "clockInTime": "2025-12-24T11:49:08.684Z",
    "clockOutTime": "2025-12-24T16:30:00.000Z"  // ← Now set (inactive)
  },
  "message": "Clocked out successfully"
}
```

### Step 3: User Can Now Clock In to Next Shift
```json
POST /api/clock-in-out/clock-in
{
  "shiftAssignmentId": 43,  // ← New shift
  "serviceSeekerId": 10,
  "location": "51.5074, -0.1278"
}

Response:
{
  "success": true,
  "data": {
    "id": 9,  // ← New clock-in record
    "clockInTime": "2025-12-24T17:00:00.000Z",
    "clockOutTime": null  // ← Active again
  }
}
```

## Key Points

1. ✅ **Clock-out sets `clockOutTime`**: Once set, the record is inactive
2. ✅ **Clock-in checks for `clockOutTime: null`**: Only records without clock-out are considered active
3. ✅ **Multiple shifts supported**: Users can have multiple clock-in records per day, one per shift assignment
4. ✅ **User shows as free**: After clock-out, the user is available for new shift assignments
5. ✅ **Authorization checked**: Users can only clock out their own records

## Testing Checklist

- [ ] User can clock out from their own shift
- [ ] User cannot clock out from another user's shift (403 error)
- [ ] User cannot clock out twice from the same record (400 error)
- [ ] After clock-out, user can clock in to a new shift
- [ ] `clockOutTime` is properly set in the database
- [ ] Location and notes are saved correctly
- [ ] Early clock-out detection works correctly

