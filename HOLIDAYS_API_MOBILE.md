# Holidays API Documentation for Mobile App

## Base URL
```
https://your-domain.com/api/holidays
```

## Authentication
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Important Note for Mobile App
**Mobile app users can ONLY view and manage their own holidays.** They can:
- View their holidays (with status: PENDING, APPROVED, REJECTED)
- Request new holidays
- See rejection reasons for rejected holidays
- View approved holidays on calendar with date ranges

---

## 1. Get My Holidays

### Endpoint
```
GET /api/holidays/my
```

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `startDate` | string | No | ISO date string (YYYY-MM-DD) - Filter holidays starting from this date |
| `endDate` | string | No | ISO date string (YYYY-MM-DD) - Filter holidays ending before this date |
| `status` | string | No | Filter by status: `'PENDING'`, `'APPROVED'`, or `'REJECTED'` |

### Request Examples
```javascript
// Get all my holidays
GET /api/holidays/my

// Get my holidays for a specific month
GET /api/holidays/my?startDate=2024-01-01&endDate=2024-01-31

// Get only my approved holidays
GET /api/holidays/my?status=APPROVED

// Get only my pending holidays
GET /api/holidays/my?status=PENDING

// Get only my rejected holidays
GET /api/holidays/my?status=REJECTED
```

### Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "holidayType": {
        "id": 1,
        "name": "Annual Leave",
        "description": "Paid annual leave",
        "isPaid": true,
        "color": "#3B82F6"
      },
      "startDate": "2024-02-15",
      "endDate": "2024-02-20",
      "startTime": null,
      "endTime": null,
      "includeWeekends": false,
      "description": "Family vacation",
      "holidayHours": 40,
      "status": "APPROVED",
      "approvedBy": {
        "id": 5,
        "name": "Manager Name"
      },
      "approvedAt": "2024-01-20T10:30:00.000Z",
      "rejectionReason": null,
      "createdAt": "2024-01-15T09:00:00.000Z",
      "updatedAt": "2024-01-20T10:30:00.000Z"
    },
    {
      "id": 2,
      "holidayType": {
        "id": 2,
        "name": "Sick Leave",
        "description": "Medical leave",
        "isPaid": true,
        "color": "#EF4444"
      },
      "startDate": "2024-03-10",
      "endDate": "2024-03-12",
      "startTime": null,
      "endTime": null,
      "includeWeekends": false,
      "description": "Medical appointment",
      "holidayHours": 24,
      "status": "REJECTED",
      "approvedBy": {
        "id": 5,
        "name": "Manager Name"
      },
      "approvedAt": "2024-03-05T14:20:00.000Z",
      "rejectionReason": "Insufficient notice period. Please request at least 2 weeks in advance.",
      "createdAt": "2024-03-01T08:00:00.000Z",
      "updatedAt": "2024-03-05T14:20:00.000Z"
    },
    {
      "id": 3,
      "holidayType": {
        "id": 1,
        "name": "Annual Leave",
        "description": "Paid annual leave",
        "isPaid": true,
        "color": "#3B82F6"
      },
      "startDate": "2024-04-01",
      "endDate": "2024-04-05",
      "startTime": null,
      "endTime": null,
      "includeWeekends": false,
      "description": "Easter break",
      "holidayHours": 40,
      "status": "PENDING",
      "approvedBy": null,
      "approvedAt": null,
      "rejectionReason": null,
      "createdAt": "2024-03-20T11:00:00.000Z",
      "updatedAt": "2024-03-20T11:00:00.000Z"
    }
  ],
  "count": 3
}
```

### Response Fields
- `id`: Holiday ID
- `holidayType`: Type of holiday (Annual Leave, Sick Leave, etc.)
  - `id`: Holiday type ID
  - `name`: Holiday type name
  - `description`: Description of the holiday type
  - `isPaid`: Whether this holiday type is paid
  - `color`: Color code for calendar display
- `startDate`: Start date (YYYY-MM-DD format)
- `endDate`: End date (YYYY-MM-DD format)
- `startTime`: Start time (HH:mm format) or null for full day
- `endTime`: End time (HH:mm format) or null for full day
- `includeWeekends`: Whether weekends are included in the calculation
- `description`: User's description/notes for the holiday
- `holidayHours`: Total hours calculated for the holiday
- `status`: Status of the holiday (`PENDING`, `APPROVED`, `REJECTED`)
- `approvedBy`: Information about who approved/rejected (null if pending)
  - `id`: Approver's user ID
  - `name`: Approver's full name
- `approvedAt`: Date/time when approved/rejected (null if pending)
- `rejectionReason`: Reason for rejection (null if approved or pending)
- `createdAt`: When the holiday request was created
- `updatedAt`: When the holiday was last updated

### Error Responses
```json
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

// 500 Internal Server Error
{
  "success": false,
  "error": "Failed to fetch holidays",
  "details": "Error message"
}
```

---

## 2. Get Single Holiday

### Endpoint
```
GET /api/holidays/[id]
```

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Holiday ID (must be your own holiday) |

### Request Example
```javascript
GET /api/holidays/1
```

### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 123,
    "holidayTypeId": 1,
    "startDate": "2024-02-15T00:00:00.000Z",
    "endDate": "2024-02-20T00:00:00.000Z",
    "startTime": null,
    "endTime": null,
    "includeWeekends": false,
    "description": "Family vacation",
    "holidayHours": 40,
    "status": "APPROVED",
    "createdAt": "2024-01-15T09:00:00.000Z",
    "updatedAt": "2024-01-20T10:30:00.000Z",
    "approvedAt": "2024-01-20T10:30:00.000Z",
    "rejectionReason": null,
    "user": {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "holidayType": {
      "id": 1,
      "name": "Annual Leave",
      "description": "Paid annual leave",
      "isPaid": true,
      "color": "#3B82F6"
    },
    "approvedBy": {
      "id": 5,
      "firstName": "Manager",
      "lastName": "Name"
    },
    "createdBy": {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe"
    },
    "updatedBy": {
      "id": 5,
      "firstName": "Manager",
      "lastName": "Name"
    }
  }
}
```

### Error Responses
```json
// 401 Unauthorized
{
  "success": false,
  "error": "Unauthorized"
}

// 404 Not Found
{
  "success": false,
  "error": "Holiday not found"
}

// 500 Internal Server Error
{
  "success": false,
  "error": "Failed to fetch holiday",
  "details": "Error message"
}
```

---

## 3. Request a Holiday

### Endpoint
```
POST /api/holidays
```

### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | integer | Yes | Your user ID (must match authenticated user) |
| `holidayTypeId` | integer | Yes | ID of the holiday type |
| `startDate` | string | Yes | ISO date string (YYYY-MM-DD) for start date |
| `endDate` | string | Yes | ISO date string (YYYY-MM-DD) for end date |
| `startTime` | string | No | Start time in HH:mm format (optional, for partial day) |
| `endTime` | string | No | End time in HH:mm format (optional, for partial day) |
| `includeWeekends` | boolean | No | Whether to include weekends in calculation (default: false) |
| `description` | string | No | Description or notes for the holiday request |
| `holidayHours` | number | No | Total hours (auto-calculated if not provided) |

### Request Example
```json
{
  "userId": 123,
  "holidayTypeId": 1,
  "startDate": "2024-05-15",
  "endDate": "2024-05-20",
  "includeWeekends": false,
  "description": "Family vacation to Spain"
}
```

### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "id": 4,
    "userId": 123,
    "holidayTypeId": 1,
    "startDate": "2024-05-15T00:00:00.000Z",
    "endDate": "2024-05-20T00:00:00.000Z",
    "startTime": null,
    "endTime": null,
    "includeWeekends": false,
    "description": "Family vacation to Spain",
    "holidayHours": 40,
    "status": "PENDING",
    "createdAt": "2024-04-10T10:00:00.000Z",
    "updatedAt": "2024-04-10T10:00:00.000Z",
    "approvedAt": null,
    "rejectionReason": null,
    "user": {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "holidayType": {
      "id": 1,
      "name": "Annual Leave",
      "description": "Paid annual leave",
      "isPaid": true,
      "color": "#3B82F6"
    },
    "createdBy": {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

### Error Responses
```json
// 400 Bad Request
{
  "success": false,
  "error": "userId, holidayTypeId, startDate, and endDate are required"
}

// 401 Unauthorized
{
  "success": false,
  "error": "Unauthorized"
}

// 500 Internal Server Error
{
  "success": false,
  "error": "Failed to create holiday",
  "details": "Error message"
}
```

---

## 4. Get Holiday Types

### Endpoint
```
GET /api/holiday-types
```

### Description
Get list of available holiday types to use when requesting a holiday.

### Request Example
```javascript
GET /api/holiday-types
```

### Response (200 OK)
```json
[
  {
    "id": 1,
    "name": "Annual Leave",
    "description": "Paid annual leave",
    "isPaid": true,
    "color": "#3B82F6",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  {
    "id": 2,
    "name": "Sick Leave",
    "description": "Medical leave",
    "isPaid": true,
    "color": "#EF4444",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  {
    "id": 3,
    "name": "Unpaid Leave",
    "description": "Unpaid time off",
    "isPaid": false,
    "color": "#F59E0B",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

## Calendar View Implementation

### Getting Approved Holidays for Calendar

To display approved holidays on a calendar, filter by `status=APPROVED` and use the `startDate` and `endDate` fields:

```javascript
// Get approved holidays for a specific month
GET /api/holidays/my?status=APPROVED&startDate=2024-02-01&endDate=2024-02-29
```

### Calendar Data Structure

Each approved holiday in the response contains:
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)
- `holidayType.color`: Color for calendar display
- `holidayType.name`: Holiday type name for display
- `description`: Additional notes

### Example Calendar Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "holidayType": {
        "name": "Annual Leave",
        "color": "#3B82F6"
      },
      "startDate": "2024-02-15",
      "endDate": "2024-02-20",
      "description": "Family vacation",
      "status": "APPROVED"
    }
  ]
}
```

---

## Mobile App Integration Examples

### React Native Example

```javascript
// Get all my holidays
const getMyHolidays = async (token) => {
  const response = await fetch(
    'https://your-domain.com/api/holidays/my',
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
    throw new Error('Failed to fetch holidays');
  }
};

// Get my approved holidays for calendar
const getApprovedHolidaysForCalendar = async (token, startDate, endDate) => {
  const response = await fetch(
    `https://your-domain.com/api/holidays/my?status=APPROVED&startDate=${startDate}&endDate=${endDate}`,
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
    throw new Error('Failed to fetch holidays');
  }
};

// Get rejected holidays with reasons
const getRejectedHolidays = async (token) => {
  const response = await fetch(
    'https://your-domain.com/api/holidays/my?status=REJECTED',
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
    throw new Error('Failed to fetch rejected holidays');
  }
};

// Request a new holiday
const requestHoliday = async (token, userId, holidayData) => {
  const response = await fetch(
    'https://your-domain.com/api/holidays',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        holidayTypeId: holidayData.holidayTypeId,
        startDate: holidayData.startDate,
        endDate: holidayData.endDate,
        startTime: holidayData.startTime || null,
        endTime: holidayData.endTime || null,
        includeWeekends: holidayData.includeWeekends || false,
        description: holidayData.description || null
      })
    }
  );
  
  if (response.ok) {
    const result = await response.json();
    return result.data;
  } else {
    const error = await response.json();
    throw new Error(error.error || 'Failed to request holiday');
  }
};

// Get holiday types
const getHolidayTypes = async (token) => {
  const response = await fetch(
    'https://your-domain.com/api/holiday-types',
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  if (response.ok) {
    return await response.json();
  } else {
    throw new Error('Failed to fetch holiday types');
  }
};
```

### Flutter Example

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

// Get all my holidays
Future<List<dynamic>> getMyHolidays(String token) async {
  final response = await http.get(
    Uri.parse('https://your-domain.com/api/holidays/my'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
  );
  
  if (response.statusCode == 200) {
    final result = json.decode(response.body);
    return result['data'];
  } else {
    throw Exception('Failed to fetch holidays');
  }
}

// Get approved holidays for calendar
Future<List<dynamic>> getApprovedHolidaysForCalendar(
  String token,
  String startDate,
  String endDate,
) async {
  final response = await http.get(
    Uri.parse(
      'https://your-domain.com/api/holidays/my?status=APPROVED&startDate=$startDate&endDate=$endDate'
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
    throw Exception('Failed to fetch holidays');
  }
}

// Get rejected holidays with reasons
Future<List<dynamic>> getRejectedHolidays(String token) async {
  final response = await http.get(
    Uri.parse('https://your-domain.com/api/holidays/my?status=REJECTED'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
  );
  
  if (response.statusCode == 200) {
    final result = json.decode(response.body);
    return result['data'];
  } else {
    throw Exception('Failed to fetch rejected holidays');
  }
}

// Request a new holiday
Future<Map<String, dynamic>> requestHoliday(
  String token,
  int userId,
  Map<String, dynamic> holidayData,
) async {
  final response = await http.post(
    Uri.parse('https://your-domain.com/api/holidays'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: json.encode({
      'userId': userId,
      'holidayTypeId': holidayData['holidayTypeId'],
      'startDate': holidayData['startDate'],
      'endDate': holidayData['endDate'],
      'startTime': holidayData['startTime'],
      'endTime': holidayData['endTime'],
      'includeWeekends': holidayData['includeWeekends'] ?? false,
      'description': holidayData['description'],
    }),
  );
  
  if (response.statusCode == 201) {
    final result = json.decode(response.body);
    return result['data'];
  } else {
    final error = json.decode(response.body);
    throw Exception(error['error'] ?? 'Failed to request holiday');
  }
}

// Get holiday types
Future<List<dynamic>> getHolidayTypes(String token) async {
  final response = await http.get(
    Uri.parse('https://your-domain.com/api/holiday-types'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
  );
  
  if (response.statusCode == 200) {
    return json.decode(response.body);
  } else {
    throw Exception('Failed to fetch holiday types');
  }
}
```

---

## Status Values

- `PENDING`: Holiday request is waiting for approval
- `APPROVED`: Holiday has been approved by a manager
- `REJECTED`: Holiday has been rejected (check `rejectionReason` field)

---

## Notes

1. **User ID**: When requesting a holiday, the `userId` in the request body must match the authenticated user's ID from the JWT token.

2. **Date Format**: All dates are in ISO 8601 format (YYYY-MM-DD).

3. **Time Format**: Times are in 24-hour format (HH:mm), e.g., "09:00", "17:30".

4. **Rejection Reason**: The `rejectionReason` field is only populated when `status` is `REJECTED`. It contains the reason provided by the manager who rejected the holiday.

5. **Calendar Display**: 
   - Use `status=APPROVED` to get only approved holidays for calendar view
   - Use `startDate` and `endDate` query parameters to filter by date range
   - The `holidayType.color` field can be used to color-code holidays on the calendar
   - Display holidays from `startDate` to `endDate` as date ranges

6. **Holiday Hours**: The system automatically calculates `holidayHours` based on the date range, times, and `includeWeekends` setting. You can also provide it manually.

7. **Editing Holidays**: Mobile app users can only edit holidays with `PENDING` status. Once approved or rejected, holidays cannot be edited.

8. **Weekend Calculation**: If `includeWeekends` is `false`, weekends (Saturday and Sunday) are excluded from the holiday hours calculation.

---

## Error Handling

### Common Errors

1. **401 Unauthorized**: Token is missing or invalid
   - Solution: Re-authenticate and get a new token

2. **400 Bad Request**: Missing required fields
   - Solution: Ensure all required fields are provided (userId, holidayTypeId, startDate, endDate)

3. **404 Not Found**: Holiday ID doesn't exist or doesn't belong to you
   - Solution: Verify you're using the correct holiday ID

4. **500 Internal Server Error**: Server-side error
   - Solution: Retry the request after a few moments

---

## Support

For issues or questions, contact the development team.

