# Shifts API Documentation for Mobile App

## Base URL
```
https://your-domain.com/api/shifts
```

## Authentication
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Important Note for Mobile App
**Mobile app users can ONLY view their own assigned shifts.** All shift queries must use `view=my` parameter to retrieve only shifts assigned to the authenticated user.

---

## 1. Get My Shifts

### Endpoint
```
GET /api/shifts?view=my
```

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `view` | string | **Yes** | Must be set to `'my'` to view only shifts assigned to current user |
| `date` | string | No | ISO date string (YYYY-MM-DD) to filter shifts for a specific date |
| `week` | string | No | ISO date string (YYYY-MM-DD) for week start to filter shifts for a week |

### Request Examples
```javascript
// Get all my shifts
GET /api/shifts?view=my

// Get my shifts for today
GET /api/shifts?view=my&date=2024-01-15

// Get my shifts for a week (starting from Monday)
GET /api/shifts?view=my&week=2024-01-15
```

### Response - Enhanced with Clock In/Out Status
```json
[
  {
    "id": 1,
    "serviceSeekerId": 5,
    "fromDate": "2024-01-15T00:00:00.000Z",
    "untilDate": "2024-12-31T00:00:00.000Z",
    "recurrence": "DAILY",
    "startTime": "09:00",
    "endTime": "17:00",
    "shiftTypeId": 2,
    "totalStaffRequired": 1,
    "funderId": 3,
    "timeCritical": false,
    "shiftRunId": null,
    "notesForCarers": "Please arrive on time",
    "notesForManager": "Regular shift",
    "createdAt": "2024-01-10T10:00:00.000Z",
    "updatedAt": "2024-01-10T10:00:00.000Z",
    "shiftAssignmentId": 10,
    "assignmentDate": "2024-01-15T00:00:00.000Z",
    "assignmentStatus": "ASSIGNED",
    "clockedIn": true,
    "clockInTime": "2024-01-15T08:55:00.000Z",
    "clockOutTime": null,
    "isLate": false,
    "isEarly": false,
    "clockInOutId": 25,
    "serviceSeeker": {
      "id": 5,
      "firstName": "John",
      "lastName": "Doe",
      "preferredName": "Johnny",
      "address": "123 Main St, London",
      "latitude": 51.5074,
      "longitude": -0.1278
    },
    "shiftType": {
      "id": 2,
      "name": "Regular Care",
      "description": "Standard care shift"
    },
    "funder": {
      "id": 3,
      "fundingSource": "NHS",
      "contractNumber": "NHS-2024-001"
    },
    "shiftRun": {
      "id": 1,
      "name": "Morning Run"
    },
    "createdBy": {
      "id": 1,
      "firstName": "Admin",
      "lastName": "User"
    },
    "updatedBy": {
      "id": 1,
      "firstName": "Admin",
      "lastName": "User"
    },
    "assignments": [
      {
        "id": 10,
        "shiftId": 1,
        "userId": 8,
        "date": "2024-01-15T00:00:00.000Z",
        "status": "ASSIGNED",
        "user": {
          "id": 8,
          "firstName": "Jane",
          "lastName": "Smith",
          "profilePic": "https://example.com/photos/jane.jpg"
        }
      }
    ]
  }
]
```

### Additional Fields Included in Response
The response includes additional fields specific to your assigned shifts:
- `shiftAssignmentId`: ID of the shift assignment for the current user
- `assignmentDate`: Date of the assignment
- `assignmentStatus`: Status of the assignment (ASSIGNED, COMPLETED, CANCELLED, etc.)
- `clockedIn`: Boolean indicating if user has clocked in
- `clockInTime`: Clock in timestamp (if clocked in)
- `clockOutTime`: Clock out timestamp (if clocked out)
- `isLate`: Boolean indicating if clock in was late
- `isEarly`: Boolean indicating if clock out was early
- `clockInOutId`: ID of the clock in/out record (if exists)

### Error Responses
```json
// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 500 Internal Server Error
{
  "error": "Failed to fetch shifts",
  "details": "Error message"
}

// 503 Service Unavailable (Database connection issues)
{
  "error": "Database connection limit reached. Please try again in a few minutes.",
  "details": "The database user has exceeded the allowed number of connections per hour."
}
```

---

## 2. Get Single Shift (My Shifts Only)

### Endpoint
```
GET /api/shifts/[id]
```

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Shift ID (must be a shift assigned to the current user) |

### Request Example
```javascript
GET /api/shifts/1
```

### Note
This endpoint will only return shift details if the shift is assigned to the authenticated user. If the shift is not assigned to you, you will receive a 404 error.

### Response
```json
{
  "id": 1,
  "serviceSeekerId": 5,
  "fromDate": "2024-01-15T00:00:00.000Z",
  "untilDate": "2024-12-31T00:00:00.000Z",
  "recurrence": "DAILY",
  "startTime": "09:00",
  "endTime": "17:00",
  "shiftTypeId": 2,
  "totalStaffRequired": 1,
  "funderId": 3,
  "timeCritical": false,
  "shiftRunId": null,
  "notesForCarers": "Please arrive on time",
  "notesForManager": "Regular shift",
  "createdAt": "2024-01-10T10:00:00.000Z",
  "updatedAt": "2024-01-10T10:00:00.000Z",
  "serviceSeeker": {
    "id": 5,
    "firstName": "John",
    "lastName": "Doe",
    "preferredName": "Johnny",
    "photoUrl": "https://example.com/photos/john.jpg"
  },
  "shiftType": {
    "id": 2,
    "name": "Regular Care",
    "description": "Standard care shift"
  },
  "funder": {
    "id": 3,
    "fundingSource": "NHS",
    "contractNumber": "NHS-2024-001"
  },
  "shiftRun": {
    "id": 1,
    "name": "Morning Run"
  },
  "createdBy": {
    "id": 1,
    "firstName": "Admin",
    "lastName": "User"
  },
  "updatedBy": {
    "id": 1,
    "firstName": "Admin",
    "lastName": "User"
  },
  "assignments": [
    {
      "id": 10,
      "shiftId": 1,
      "userId": 8,
      "date": "2024-01-15T00:00:00.000Z",
      "status": "ASSIGNED",
      "user": {
        "id": 8,
        "firstName": "Jane",
        "lastName": "Smith",
        "profilePic": "https://example.com/photos/jane.jpg"
      }
    }
  ]
}
```

### Error Responses
```json
// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 404 Not Found
{
  "error": "Shift not found"
}

// 500 Internal Server Error
{
  "error": "Failed to fetch shift"
}
```

---

## 3. Create Shift

### Endpoint
```
POST /api/shifts
```

### Note for Mobile App
**Mobile app users typically cannot create shifts.** This endpoint is primarily for web portal administrators and managers. If your mobile app needs to create shifts, ensure proper role-based permissions are implemented.

### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceSeekerId` | integer | Yes | ID of the service seeker |
| `fromDate` | string | Yes | ISO date string (YYYY-MM-DD) for start date |
| `untilDate` | string | No | ISO date string (YYYY-MM-DD) for end date (null for recurring without end) |
| `recurrence` | string | Yes | Recurrence pattern: `'NONE'`, `'DAILY'`, `'WEEKLY'`, `'FORTNIGHTLY'`, `'MONTHLY'` |
| `startTime` | string | Yes | Start time in HH:mm format (e.g., "09:00") |
| `endTime` | string | Yes | End time in HH:mm format (e.g., "17:00") |
| `shiftTypeId` | integer | Yes | ID of the shift type |
| `totalStaffRequired` | integer | No | Number of staff required (default: 1) |
| `funderId` | integer | No | ID of the funder |
| `timeCritical` | boolean | No | Whether the shift is time critical (default: false) |
| `shiftRunId` | integer | No | ID of the shift run |
| `notesForCarers` | string | No | Notes visible to care workers |
| `notesForManager` | string | No | Notes visible to managers only |
| `assignedUserIds` | array | No | Array of user IDs to assign to the shift |

### Request Example
```json
{
  "serviceSeekerId": 5,
  "fromDate": "2024-01-15",
  "untilDate": "2024-12-31",
  "recurrence": "DAILY",
  "startTime": "09:00",
  "endTime": "17:00",
  "shiftTypeId": 2,
  "totalStaffRequired": 1,
  "funderId": 3,
  "timeCritical": false,
  "shiftRunId": null,
  "notesForCarers": "Please arrive on time",
  "notesForManager": "Regular shift",
  "assignedUserIds": [8, 9]
}
```

### Response (201 Created)
```json
{
  "id": 1,
  "serviceSeekerId": 5,
  "fromDate": "2024-01-15T00:00:00.000Z",
  "untilDate": "2024-12-31T00:00:00.000Z",
  "recurrence": "DAILY",
  "startTime": "09:00",
  "endTime": "17:00",
  "shiftTypeId": 2,
  "totalStaffRequired": 1,
  "funderId": 3,
  "timeCritical": false,
  "shiftRunId": null,
  "notesForCarers": "Please arrive on time",
  "notesForManager": "Regular shift",
  "createdAt": "2024-01-10T10:00:00.000Z",
  "updatedAt": "2024-01-10T10:00:00.000Z",
  "serviceSeeker": {
    "id": 5,
    "firstName": "John",
    "lastName": "Doe",
    "preferredName": "Johnny"
  },
  "shiftType": {
    "id": 2,
    "name": "Regular Care",
    "description": "Standard care shift"
  },
  "funder": {
    "id": 3,
    "fundingSource": "NHS",
    "contractNumber": "NHS-2024-001"
  },
  "shiftRun": {
    "id": 1,
    "name": "Morning Run"
  },
  "createdBy": {
    "id": 1,
    "firstName": "Admin",
    "lastName": "User"
  },
  "updatedBy": {
    "id": 1,
    "firstName": "Admin",
    "lastName": "User"
  },
  "assignments": [
    {
      "id": 10,
      "shiftId": 1,
      "userId": 8,
      "date": "2024-01-15T00:00:00.000Z",
      "status": "ASSIGNED",
      "user": {
        "id": 8,
        "firstName": "Jane",
        "lastName": "Smith",
        "profilePic": "https://example.com/photos/jane.jpg"
      }
    }
  ]
}
```

### Error Responses
```json
// 400 Bad Request
{
  "error": "serviceSeekerId, fromDate, recurrence, startTime, endTime, and shiftTypeId are required"
}

// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 500 Internal Server Error
{
  "error": "Failed to create shift"
}
```

---

## 4. Update Shift

### Endpoint
```
PUT /api/shifts/[id]
```

### Note for Mobile App
**Mobile app users typically cannot update shifts.** This endpoint is primarily for web portal administrators and managers. If your mobile app needs to update shifts, ensure proper role-based permissions are implemented.

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Shift ID |

### Request Body
All fields are optional. Only include fields you want to update.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceSeekerId` | integer | No | ID of the service seeker |
| `fromDate` | string | No | ISO date string (YYYY-MM-DD) for start date |
| `untilDate` | string | No | ISO date string (YYYY-MM-DD) for end date (null to remove end date) |
| `recurrence` | string | No | Recurrence pattern: `'NONE'`, `'DAILY'`, `'WEEKLY'`, `'FORTNIGHTLY'`, `'MONTHLY'` |
| `startTime` | string | No | Start time in HH:mm format |
| `endTime` | string | No | End time in HH:mm format |
| `shiftTypeId` | integer | No | ID of the shift type |
| `totalStaffRequired` | integer | No | Number of staff required |
| `funderId` | integer | No | ID of the funder (null to remove) |
| `timeCritical` | boolean | No | Whether the shift is time critical |
| `shiftRunId` | integer | No | ID of the shift run (null to remove) |
| `notesForCarers` | string | No | Notes visible to care workers |
| `notesForManager` | string | No | Notes visible to managers only |
| `assignedUserIds` | array | No | Array of user IDs to assign (replaces all existing assignments) |

### Request Example
```json
{
  "startTime": "10:00",
  "endTime": "18:00",
  "notesForCarers": "Updated notes",
  "assignedUserIds": [8, 9, 10]
}
```

### Response
Same structure as GET /api/shifts/[id]

### Error Responses
```json
// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 500 Internal Server Error
{
  "error": "Failed to update shift"
}
```

---

## 5. Delete Shift

### Endpoint
```
DELETE /api/shifts/[id]
```

### Note for Mobile App
**Mobile app users cannot delete shifts.** This endpoint is only available to web portal administrators and managers.

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Shift ID |

### Request Example
```javascript
DELETE /api/shifts/1
```

### Response (200 OK)
```json
{
  "message": "Shift deleted successfully"
}
```

### Error Responses
```json
// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 500 Internal Server Error
{
  "error": "Failed to delete shift"
}
```

---

## 6. Get Available Staff

### Endpoint
```
GET /api/shifts/available-staff
```

### Note for Mobile App
**Mobile app users typically cannot view available staff.** This endpoint is primarily for web portal administrators and managers who need to assign staff to shifts.

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `date` | string | Yes | ISO date string (YYYY-MM-DD) |
| `startTime` | string | Yes | Start time in HH:mm format |
| `endTime` | string | Yes | End time in HH:mm format |
| `shiftId` | integer | No | Shift ID (to exclude from availability check) |

### Request Example
```javascript
GET /api/shifts/available-staff?date=2024-01-15&startTime=09:00&endTime=17:00&shiftId=1
```

### Response
```json
[
  {
    "id": 8,
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    "phoneNo": "+44 123 456 7890",
    "profilePic": "https://example.com/photos/jane.jpg",
    "role": {
      "id": 3,
      "name": "CAREWORKER",
      "displayName": "Care Worker"
    }
  }
]
```

### Error Responses
```json
// 400 Bad Request
{
  "error": "date, startTime, and endTime are required"
}

// 401 Unauthorized
{
  "error": "Unauthorized"
}

// 500 Internal Server Error
{
  "error": "Failed to fetch available staff"
}
```

---

## Recurrence Patterns

The `recurrence` field accepts the following values:

- `'NONE'`: Single occurrence (no recurrence)
- `'DAILY'`: Every day
- `'WEEKLY'`: Every week
- `'FORTNIGHTLY'`: Every two weeks
- `'MONTHLY'`: Every month

When `recurrence` is set and `untilDate` is provided, the system automatically creates shift assignments for all occurrences between `fromDate` and `untilDate`. If `untilDate` is null, the system creates up to 60 occurrences by default.

---

## Mobile App Integration Examples

### React Native Example

```javascript
// Get all my shifts
const getMyShifts = async (token) => {
  const response = await fetch(
    'https://your-domain.com/api/shifts?view=my',
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (response.ok) {
    const shifts = await response.json();
    return shifts;
  } else {
    throw new Error('Failed to fetch shifts');
  }
};

// Get my shifts for today
const getMyShiftsToday = async (token) => {
  const today = new Date().toISOString().split('T')[0];
  const response = await fetch(
    `https://your-domain.com/api/shifts?view=my&date=${today}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (response.ok) {
    const shifts = await response.json();
    return shifts;
  } else {
    throw new Error('Failed to fetch shifts');
  }
};

// Get my shifts for current week
const getMyShiftsThisWeek = async (token) => {
  // Get Monday of current week
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(today.setDate(diff));
  const weekStart = monday.toISOString().split('T')[0];
  
  const response = await fetch(
    `https://your-domain.com/api/shifts?view=my&week=${weekStart}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (response.ok) {
    const shifts = await response.json();
    return shifts;
  } else {
    throw new Error('Failed to fetch shifts');
  }
};

// Get single shift details (must be assigned to user)
const getMyShiftDetails = async (token, shiftId) => {
  const response = await fetch(
    `https://your-domain.com/api/shifts/${shiftId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (response.ok) {
    const shift = await response.json();
    return shift;
  } else if (response.status === 404) {
    throw new Error('Shift not found or not assigned to you');
  } else {
    throw new Error('Failed to fetch shift');
  }
};

// Clock in for a shift
const clockIn = async (token, shiftAssignmentId, latitude, longitude) => {
  const response = await fetch(
    'https://your-domain.com/api/clock-in-out/clock-in',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        shiftAssignmentId,
        latitude,
        longitude
      })
    }
  );
  
  return response.json();
};

// Clock out for a shift
const clockOut = async (token, clockInOutId, latitude, longitude) => {
  const response = await fetch(
    'https://your-domain.com/api/clock-in-out/clock-out',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        clockInOutId,
        latitude,
        longitude
      })
    }
  );
  
  return response.json();
};
```

### Flutter Example

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

// Get all my shifts
Future<List<dynamic>> getMyShifts(String token) async {
  final response = await http.get(
    Uri.parse('https://your-domain.com/api/shifts?view=my'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
  );
  
  if (response.statusCode == 200) {
    return json.decode(response.body);
  } else {
    throw Exception('Failed to fetch shifts');
  }
}

// Get my shifts for today
Future<List<dynamic>> getMyShiftsToday(String token) async {
  final today = DateTime.now().toIso8601String().split('T')[0];
  final response = await http.get(
    Uri.parse('https://your-domain.com/api/shifts?view=my&date=$today'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
  );
  
  if (response.statusCode == 200) {
    return json.decode(response.body);
  } else {
    throw Exception('Failed to fetch shifts');
  }
}

// Get my shifts for current week
Future<List<dynamic>> getMyShiftsThisWeek(String token) async {
  // Get Monday of current week
  final today = DateTime.now();
  final day = today.weekday;
  final monday = today.subtract(Duration(days: day - 1));
  final weekStart = monday.toIso8601String().split('T')[0];
  
  final response = await http.get(
    Uri.parse('https://your-domain.com/api/shifts?view=my&week=$weekStart'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
  );
  
  if (response.statusCode == 200) {
    return json.decode(response.body);
  } else {
    throw Exception('Failed to fetch shifts');
  }
}

// Get single shift details (must be assigned to user)
Future<Map<String, dynamic>> getMyShiftDetails(String token, int shiftId) async {
  final response = await http.get(
    Uri.parse('https://your-domain.com/api/shifts/$shiftId'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
  );
  
  if (response.statusCode == 200) {
    return json.decode(response.body);
  } else if (response.statusCode == 404) {
    throw Exception('Shift not found or not assigned to you');
  } else {
    throw Exception('Failed to fetch shift');
  }
}

// Clock in for a shift
Future<Map<String, dynamic>> clockIn(
  String token,
  int shiftAssignmentId,
  double latitude,
  double longitude,
) async {
  final response = await http.post(
    Uri.parse('https://your-domain.com/api/clock-in-out/clock-in'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: json.encode({
      'shiftAssignmentId': shiftAssignmentId,
      'latitude': latitude,
      'longitude': longitude,
    }),
  );
  
  return json.decode(response.body);
}

// Clock out for a shift
Future<Map<String, dynamic>> clockOut(
  String token,
  int clockInOutId,
  double latitude,
  double longitude,
) async {
  final response = await http.post(
    Uri.parse('https://your-domain.com/api/clock-in-out/clock-out'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: json.encode({
      'clockInOutId': clockInOutId,
      'latitude': latitude,
      'longitude': longitude,
    }),
  );
  
  return json.decode(response.body);
}
```

---

## Notes

1. **Mobile App Access**: Mobile app users can ONLY view their own assigned shifts using `view=my` parameter. They cannot view all shifts, create, update, or delete shifts.

2. **Time Format**: All times are in 24-hour format (HH:mm), e.g., "09:00", "17:30"

3. **Date Format**: All dates are in ISO 8601 format (YYYY-MM-DD)

4. **Timezone**: All dates and times are stored in UTC. Convert to local time in your mobile app

5. **Clock In/Out**: Use the Clock In/Out API endpoints (`/api/clock-in-out/clock-in` and `/api/clock-in-out/clock-out`) to record attendance for shifts. You'll need the `shiftAssignmentId` from the shift response.

6. **Assignment Status**: The `assignmentStatus` field indicates the status of your assignment:
   - `ASSIGNED`: Shift is assigned to you
   - `COMPLETED`: Shift has been completed
   - `CANCELLED`: Shift assignment has been cancelled
   - `PENDING`: Shift assignment is pending confirmation

7. **Clock In/Out Status**: The response includes `clockedIn`, `clockInTime`, `clockOutTime`, `isLate`, and `isEarly` fields to help you track your attendance status for each shift.

8. **Recurring Shifts**: If a shift is recurring, you'll see multiple shift assignments in the response, one for each occurrence that's assigned to you.

9. **Required Parameter**: Always include `view=my` when fetching shifts from the mobile app. Without this parameter, you may receive an error or empty results.

---

## Support

For issues or questions, contact the development team.

