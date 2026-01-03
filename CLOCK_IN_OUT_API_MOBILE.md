# Clock In/Out API Documentation for Mobile App

## Base URL
```
https://your-domain.com/api/clock-in-out
```

## Authentication
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Important Note for Mobile App
**Mobile app users can ONLY view and manage their own clock in/out records.** They can:
- Clock in for their assigned shifts
- Clock out from their active clock in records
- View their clock in/out history
- See if they clocked in late or clocked out early

---

## 1. Clock In

### Endpoint
```
POST /api/clock-in-out/clock-in
```

### Description
Clock in for a shift. The system will automatically find or create a shift assignment if needed. Location is captured for attendance tracking.

### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `shiftAssignmentId` | integer | No* | ID of the shift assignment (obtained from shifts API) |
| `shiftId` | integer | No* | ID of the shift (alternative to shiftAssignmentId) |
| `serviceSeekerId` | integer | No | ID of the service seeker (auto-detected if not provided) |
| `date` | string | No | ISO date string (YYYY-MM-DD) - defaults to today |
| `workType` | string | No | Work type: `'REGULAR'` or `'STANDBY'` (default: `'REGULAR'`) |
| `location` | string | No | Location/address where clocking in (e.g., "51.5074, -0.1278" or "123 Main St, London") |
| `notes` | string | No | Optional notes for the clock in |

\* Either `shiftAssignmentId` or `shiftId` should be provided. If neither is provided, the system will try to auto-find your shift assignment for today.

### Request Examples

#### Using shiftAssignmentId (Recommended)
```json
{
  "shiftAssignmentId": 123,
  "location": "51.5074, -0.1278",
  "workType": "REGULAR",
  "notes": "Arrived on time"
}
```

#### Using shiftId
```json
{
  "shiftId": 45,
  "location": "123 Main St, London",
  "workType": "REGULAR"
}
```

#### Auto-find shift (No ID provided)
```json
{
  "location": "51.5074, -0.1278",
  "workType": "REGULAR"
}
```

### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "id": 789,
    "userId": 123,
    "shiftAssignmentId": 123,
    "serviceSeekerId": 5,
    "date": "2024-02-15T00:00:00.000Z",
    "clockInTime": "2024-02-15T09:05:00.000Z",
    "clockOutTime": null,
    "workType": "REGULAR",
    "clockInLocation": "51.5074, -0.1278",
    "clockOutLocation": null,
    "isLate": false,
    "isEarly": false,
    "notes": "Arrived on time",
    "createdAt": "2024-02-15T09:05:00.000Z",
    "updatedAt": "2024-02-15T09:05:00.000Z",
    "user": {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe"
    },
    "serviceSeeker": {
      "id": 5,
      "firstName": "Jane",
      "lastName": "Smith",
      "preferredName": "Jane"
    },
    "shiftAssignment": {
      "id": 123,
      "shiftId": 45,
      "userId": 123,
      "date": "2024-02-15T00:00:00.000Z",
      "status": "SCHEDULED",
      "shift": {
        "id": 45,
        "startTime": "09:00",
        "endTime": "17:00",
        "shiftType": {
          "id": 2,
          "name": "Regular Care"
        }
      }
    }
  },
  "message": "Clocked in successfully"
}
```

### Response (201 Created - Late Clock In)
```json
{
  "success": true,
  "data": {
    "id": 790,
    "userId": 123,
    "shiftAssignmentId": 123,
    "serviceSeekerId": 5,
    "date": "2024-02-15T00:00:00.000Z",
    "clockInTime": "2024-02-15T09:20:00.000Z",
    "clockOutTime": null,
    "workType": "REGULAR",
    "clockInLocation": "51.5074, -0.1278",
    "clockOutLocation": null,
    "isLate": true,
    "isEarly": false,
    "notes": null,
    "createdAt": "2024-02-15T09:20:00.000Z",
    "updatedAt": "2024-02-15T09:20:00.000Z",
    "user": {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe"
    },
    "serviceSeeker": {
      "id": 5,
      "firstName": "Jane",
      "lastName": "Smith",
      "preferredName": "Jane"
    },
    "shiftAssignment": {
      "id": 123,
      "shiftId": 45,
      "userId": 123,
      "date": "2024-02-15T00:00:00.000Z",
      "status": "SCHEDULED",
      "shift": {
        "id": 45,
        "startTime": "09:00",
        "endTime": "17:00",
        "shiftType": {
          "id": 2,
          "name": "Regular Care"
        }
      }
    }
  },
  "message": "Clocked in (Late)"
}
```

### Important Fields in Response
- `id`: Clock in/out record ID (use this for clock out)
- `clockInTime`: When you clocked in
- `isLate`: Boolean indicating if you clocked in late (15-minute grace period)
- `clockInLocation`: Location where you clocked in
- `shiftAssignmentId`: The shift assignment ID
- `serviceSeeker`: Information about the service user

### Error Responses
```json
// 400 Bad Request - Already clocked in
{
  "success": false,
  "error": "You have already clocked in for this shift. Please clock out first before clocking in again."
}

// 401 Unauthorized
{
  "success": false,
  "error": "Unauthorized"
}

// 401 Invalid Token
{
  "success": false,
  "error": "Invalid or expired token"
}

// 403 Forbidden - Shift assignment doesn't belong to you
{
  "success": false,
  "error": "This shift assignment does not belong to you"
}

// 404 Not Found - No shift assignment found
{
  "success": false,
  "error": "No valid shift assignment found. Please ensure you are assigned to a shift for this date."
}

// 500 Internal Server Error
{
  "success": false,
  "error": "Failed to clock in",
  "details": "Error message"
}
```

### Late Clock In Detection
- The system automatically detects if you clock in late
- A 15-minute grace period is allowed after the shift start time
- If you clock in more than 15 minutes after the shift start time, `isLate` will be `true`
- Example: If shift starts at 09:00, clocking in before 09:15 is not late, but 09:16+ is marked as late

---

## 2. Clock Out

### Endpoint
```
POST /api/clock-in-out/clock-out
```

### Description
Clock out from an active clock in record. The system will find your most recent active clock in if `clockInOutId` is not provided.

### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `clockInOutId` | integer | No | ID of the clock in/out record (from clock in response) |
| `location` | string | No | Location/address where clocking out |
| `notes` | string | No | Optional notes for the clock out |

### Request Examples

#### Using clockInOutId (Recommended)
```json
{
  "clockInOutId": 789,
  "location": "51.5074, -0.1278",
  "notes": "Shift completed"
}
```

#### Auto-find active clock in
```json
{
  "location": "51.5074, -0.1278",
  "notes": "Shift completed"
}
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": 789,
    "userId": 123,
    "shiftAssignmentId": 123,
    "serviceSeekerId": 5,
    "date": "2024-02-15T00:00:00.000Z",
    "clockInTime": "2024-02-15T09:05:00.000Z",
    "clockOutTime": "2024-02-15T17:10:00.000Z",
    "workType": "REGULAR",
    "clockInLocation": "51.5074, -0.1278",
    "clockOutLocation": "51.5074, -0.1278",
    "isLate": false,
    "isEarly": false,
    "notes": "Shift completed",
    "createdAt": "2024-02-15T09:05:00.000Z",
    "updatedAt": "2024-02-15T17:10:00.000Z",
    "user": {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe"
    },
    "serviceSeeker": {
      "id": 5,
      "firstName": "Jane",
      "lastName": "Smith",
      "preferredName": "Jane"
    },
    "shiftAssignment": {
      "id": 123,
      "shiftId": 45,
      "userId": 123,
      "date": "2024-02-15T00:00:00.000Z",
      "status": "SCHEDULED",
      "shift": {
        "id": 45,
        "startTime": "09:00",
        "endTime": "17:00",
        "shiftType": {
          "id": 2,
          "name": "Regular Care"
        }
      }
    }
  },
  "message": "Clocked out successfully"
}
```

### Response (200 OK - Early Clock Out)
```json
{
  "success": true,
  "data": {
    "id": 789,
    "userId": 123,
    "shiftAssignmentId": 123,
    "serviceSeekerId": 5,
    "date": "2024-02-15T00:00:00.000Z",
    "clockInTime": "2024-02-15T09:05:00.000Z",
    "clockOutTime": "2024-02-15T16:45:00.000Z",
    "workType": "REGULAR",
    "clockInLocation": "51.5074, -0.1278",
    "clockOutLocation": "51.5074, -0.1278",
    "isLate": false,
    "isEarly": true,
    "notes": "Left early due to emergency",
    "createdAt": "2024-02-15T09:05:00.000Z",
    "updatedAt": "2024-02-15T16:45:00.000Z",
    "user": {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe"
    },
    "serviceSeeker": {
      "id": 5,
      "firstName": "Jane",
      "lastName": "Smith",
      "preferredName": "Jane"
    },
    "shiftAssignment": {
      "id": 123,
      "shiftId": 45,
      "userId": 123,
      "date": "2024-02-15T00:00:00.000Z",
      "status": "SCHEDULED",
      "shift": {
        "id": 45,
        "startTime": "09:00",
        "endTime": "17:00",
        "shiftType": {
          "id": 2,
          "name": "Regular Care"
        }
      }
    }
  },
  "message": "Clocked out (Early)"
}
```

### Important Fields in Response
- `clockOutTime`: When you clocked out
- `isEarly`: Boolean indicating if you clocked out early (15-minute grace period before shift end)
- `clockOutLocation`: Location where you clocked out
- `notes`: Combined notes from clock in and clock out

### Error Responses
```json
// 400 Bad Request - Already clocked out
{
  "success": false,
  "error": "Already clocked out"
}

// 401 Unauthorized
{
  "success": false,
  "error": "Unauthorized"
}

// 403 Forbidden - Not your clock in record
{
  "success": false,
  "error": "Unauthorized to clock out this record",
  "details": "Clock-in record belongs to user X, but token is for user Y"
}

// 404 Not Found - No active clock in
{
  "success": false,
  "error": "No active clock in found"
}

// 404 Not Found - Clock in record not found
{
  "success": false,
  "error": "Clock in record not found"
}

// 500 Internal Server Error
{
  "success": false,
  "error": "Failed to clock out",
  "details": "Error message"
}
```

### Early Clock Out Detection
- The system automatically detects if you clock out early
- A 15-minute grace period is allowed before the shift end time
- If you clock out more than 15 minutes before the shift end time, `isEarly` will be `true`
- Example: If shift ends at 17:00, clocking out after 16:45 is not early, but 16:44 or earlier is marked as early

---

## 3. Get My Clock In/Out Records

### Endpoint
```
GET /api/clock-in-out?view=my
```

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `view` | string | **Yes** | Must be set to `'my'` to view only your records |
| `date` | string | No | ISO date string (YYYY-MM-DD) - Filter by specific date |
| `startDate` | string | No | ISO date string (YYYY-MM-DD) - Start of date range |
| `endDate` | string | No | ISO date string (YYYY-MM-DD) - End of date range |
| `workType` | string | No | Filter by work type: `'REGULAR'` or `'STANDBY'` |
| `isLate` | string | No | Filter by late clock ins: `'true'` or `'false'` |
| `isEarly` | string | No | Filter by early clock outs: `'true'` or `'false'` |

### Request Examples
```javascript
// Get all my clock in/out records
GET /api/clock-in-out?view=my

// Get my records for today
GET /api/clock-in-out?view=my&date=2024-02-15

// Get my records for a date range
GET /api/clock-in-out?view=my&startDate=2024-02-01&endDate=2024-02-29

// Get only my late clock ins
GET /api/clock-in-out?view=my&isLate=true

// Get only my early clock outs
GET /api/clock-in-out?view=my&isEarly=true
```

### Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": 789,
      "userId": 123,
      "shiftAssignmentId": 123,
      "serviceSeekerId": 5,
      "date": "2024-02-15T00:00:00.000Z",
      "clockInTime": "2024-02-15T09:05:00.000Z",
      "clockOutTime": "2024-02-15T17:10:00.000Z",
      "workType": "REGULAR",
      "clockInLocation": "51.5074, -0.1278",
      "clockOutLocation": "51.5074, -0.1278",
      "isLate": false,
      "isEarly": false,
      "notes": "Shift completed",
      "createdAt": "2024-02-15T09:05:00.000Z",
      "updatedAt": "2024-02-15T17:10:00.000Z",
      "user": {
        "id": 123,
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "serviceSeeker": {
        "id": 5,
        "firstName": "Jane",
        "lastName": "Smith",
        "preferredName": "Jane"
      },
      "shiftAssignment": {
        "id": 123,
        "shiftId": 45,
        "userId": 123,
        "date": "2024-02-15T00:00:00.000Z",
        "shift": {
          "id": 45,
          "startTime": "09:00",
          "endTime": "17:00",
          "shiftType": {
            "id": 2,
            "name": "Regular Care"
          },
          "serviceSeeker": {
            "id": 5,
            "firstName": "Jane",
            "lastName": "Smith",
            "preferredName": "Jane"
          }
        }
      }
    }
  ]
}
```

---

## 4. Get My Shifts with Clock In/Out Status

### Endpoint
```
GET /api/clock-in-out/my-shifts
```

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `date` | string | Yes | ISO date string (YYYY-MM-DD) - Get shifts for this date |

### Description
Get all your shift assignments for a specific date with their clock in/out status. This is useful for displaying which shifts you can clock in for.

### Request Example
```javascript
GET /api/clock-in-out/my-shifts?date=2024-02-15
```

### Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "shiftAssignmentId": 123,
      "shiftId": 45,
      "serviceSeeker": {
        "id": 5,
        "firstName": "Jane",
        "lastName": "Smith",
        "preferredName": "Jane"
      },
      "startTime": "09:00",
      "endTime": "17:00",
      "expectedStart": "2024-02-15T09:00:00.000Z",
      "expectedEnd": "2024-02-15T17:00:00.000Z",
      "clockedIn": true,
      "clockInTime": "2024-02-15T09:05:00.000Z",
      "clockOutTime": null,
      "isLate": false,
      "isEarly": false,
      "clockInOutId": 789,
      "workType": "REGULAR"
    },
    {
      "shiftAssignmentId": 124,
      "shiftId": 46,
      "serviceSeeker": {
        "id": 6,
        "firstName": "Bob",
        "lastName": "Johnson",
        "preferredName": "Bob"
      },
      "startTime": "18:00",
      "endTime": "22:00",
      "expectedStart": "2024-02-15T18:00:00.000Z",
      "expectedEnd": "2024-02-15T22:00:00.000Z",
      "clockedIn": false,
      "clockInTime": null,
      "clockOutTime": null,
      "isLate": false,
      "isEarly": false,
      "clockInOutId": null,
      "workType": "REGULAR"
    }
  ]
}
```

### Response Fields
- `shiftAssignmentId`: Use this for clock in
- `clockedIn`: Boolean indicating if you've clocked in
- `clockInTime`: When you clocked in (if clocked in)
- `clockOutTime`: When you clocked out (if clocked out)
- `isLate`: If you clocked in late
- `isEarly`: If you clocked out early
- `clockInOutId`: ID of the clock in/out record (use for clock out)

---

## Mobile App Integration Examples

### React Native Example

```javascript
import * as Location from 'expo-location';

// Get current location
const getCurrentLocation = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission denied');
  }
  
  const location = await Location.getCurrentPositionAsync({});
  return `${location.coords.latitude}, ${location.coords.longitude}`;
};

// Clock in
const clockIn = async (token, shiftAssignmentId) => {
  try {
    const location = await getCurrentLocation();
    
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
          location,
          workType: 'REGULAR',
          notes: 'Clocked in via mobile app'
        })
      }
    );
    
    if (response.ok) {
      const result = await response.json();
      return result.data;
    } else {
      const error = await response.json();
      throw new Error(error.error || 'Failed to clock in');
    }
  } catch (error) {
    console.error('Clock in error:', error);
    throw error;
  }
};

// Clock out
const clockOut = async (token, clockInOutId) => {
  try {
    const location = await getCurrentLocation();
    
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
          location,
          notes: 'Clocked out via mobile app'
        })
      }
    );
    
    if (response.ok) {
      const result = await response.json();
      return result.data;
    } else {
      const error = await response.json();
      throw new Error(error.error || 'Failed to clock out');
    }
  } catch (error) {
    console.error('Clock out error:', error);
    throw error;
  }
};

// Get my shifts for today with clock in/out status
const getMyShiftsToday = async (token) => {
  const today = new Date().toISOString().split('T')[0];
  const response = await fetch(
    `https://your-domain.com/api/clock-in-out/my-shifts?date=${today}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (response.ok) {
    const result = await response.json();
    return result.data;
  } else {
    throw new Error('Failed to fetch shifts');
  }
};

// Get my clock in/out history
const getMyClockInOutHistory = async (token, startDate, endDate) => {
  const response = await fetch(
    `https://your-domain.com/api/clock-in-out?view=my&startDate=${startDate}&endDate=${endDate}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (response.ok) {
    const result = await response.json();
    return result.data;
  } else {
    throw new Error('Failed to fetch clock in/out history');
  }
};
```

### Flutter Example

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:geolocator/geolocator.dart';

// Get current location
Future<String> getCurrentLocation() async {
  bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
  if (!serviceEnabled) {
    throw Exception('Location services are disabled');
  }
  
  LocationPermission permission = await Geolocator.checkPermission();
  if (permission == LocationPermission.denied) {
    permission = await Geolocator.requestPermission();
    if (permission == LocationPermission.denied) {
      throw Exception('Location permissions are denied');
    }
  }
  
  Position position = await Geolocator.getCurrentPosition();
  return '${position.latitude}, ${position.longitude}';
}

// Clock in
Future<Map<String, dynamic>> clockIn(
  String token,
  int shiftAssignmentId,
) async {
  try {
    final location = await getCurrentLocation();
    
    final response = await http.post(
      Uri.parse('https://your-domain.com/api/clock-in-out/clock-in'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        'shiftAssignmentId': shiftAssignmentId,
        'location': location,
        'workType': 'REGULAR',
        'notes': 'Clocked in via mobile app',
      }),
    );
    
    if (response.statusCode == 201) {
      final result = json.decode(response.body);
      return result['data'];
    } else {
      final error = json.decode(response.body);
      throw Exception(error['error'] ?? 'Failed to clock in');
    }
  } catch (e) {
    print('Clock in error: $e');
    rethrow;
  }
}

// Clock out
Future<Map<String, dynamic>> clockOut(
  String token,
  int clockInOutId,
) async {
  try {
    final location = await getCurrentLocation();
    
    final response = await http.post(
      Uri.parse('https://your-domain.com/api/clock-in-out/clock-out'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        'clockInOutId': clockInOutId,
        'location': location,
        'notes': 'Clocked out via mobile app',
      }),
    );
    
    if (response.statusCode == 200) {
      final result = json.decode(response.body);
      return result['data'];
    } else {
      final error = json.decode(response.body);
      throw Exception(error['error'] ?? 'Failed to clock out');
    }
  } catch (e) {
    print('Clock out error: $e');
    rethrow;
  }
}

// Get my shifts for today with clock in/out status
Future<List<dynamic>> getMyShiftsToday(String token) async {
  final today = DateTime.now().toIso8601String().split('T')[0];
  final response = await http.get(
    Uri.parse('https://your-domain.com/api/clock-in-out/my-shifts?date=$today'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
  );
  
  if (response.statusCode == 200) {
    final result = json.decode(response.body);
    return result['data'];
  } else {
    throw Exception('Failed to fetch shifts');
  }
}

// Get my clock in/out history
Future<List<dynamic>> getMyClockInOutHistory(
  String token,
  String startDate,
  String endDate,
) async {
  final response = await http.get(
    Uri.parse(
      'https://your-domain.com/api/clock-in-out?view=my&startDate=$startDate&endDate=$endDate'
    ),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
  );
  
  if (response.statusCode == 200) {
    final result = json.decode(response.body);
    return result['data'];
  } else {
    throw Exception('Failed to fetch clock in/out history');
  }
}
```

---

## Notes

1. **Location Format**: Location can be provided as:
   - GPS coordinates: `"51.5074, -0.1278"`
   - Address string: `"123 Main St, London"`
   - Or any location identifier

2. **Shift Assignment**: 
   - You can use `shiftAssignmentId` from the shifts API (`/api/shifts?view=my`)
   - Or use `shiftId` and the system will find/create the assignment
   - If neither is provided, the system will try to auto-find your shift for today

3. **Late/Early Detection**:
   - **Late Clock In**: More than 15 minutes after shift start time
   - **Early Clock Out**: More than 15 minutes before shift end time
   - Grace period: 15 minutes

4. **Work Types**:
   - `REGULAR`: Regular shift work
   - `STANDBY`: Standby/on-call work

5. **Clock In/Out Flow**:
   - Clock in creates a new record with `clockInTime`
   - Clock out updates the same record with `clockOutTime`
   - You cannot clock in twice for the same shift assignment without clocking out first

6. **Auto-find Shift**: If you don't provide `shiftAssignmentId` or `shiftId`, the system will:
   - Look for your shift assignment for today
   - If found, use it for clock in
   - If not found, return an error

7. **Multiple Shifts**: You can have multiple shifts per day. Each shift assignment can be clocked in/out independently.

8. **Required Parameter**: Always include `view=my` when fetching clock in/out records to ensure you only see your own records.

---

## Error Handling

### Common Errors

1. **400 Already Clocked In**: You've already clocked in for this shift
   - Solution: Clock out first, then clock in again if needed

2. **401 Unauthorized**: Token is missing or invalid
   - Solution: Re-authenticate and get a new token

3. **403 Forbidden**: Shift assignment doesn't belong to you
   - Solution: Use your own shift assignment ID

4. **404 Not Found**: No shift assignment found
   - Solution: Ensure you're assigned to a shift for the date

5. **500 Internal Server Error**: Server-side error
   - Solution: Retry the request after a few moments

---

## Support

For issues or questions, contact the development team.

