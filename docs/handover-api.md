# Handover API Documentation

## Overview

The Handover API allows care workers to record and view shift handovers. Handovers occur when one care worker hands over their shift to another care worker at the same location (service user).

## Requirements

- **Location Match**: Both shifts must be at the same location (same `serviceSeekerId`)
- **Mobile Primary**: Handovers are primarily created through the mobile app
- **Web View**: Web application is for viewing and managing handover records only

## API Endpoints

### 1. Get All Handovers

**Endpoint:** `GET /api/handovers`

**Query Parameters:**
- `serviceSeekerId` (optional) - Filter by service user ID
- `date` (optional) - Filter by date (YYYY-MM-DD)
- `userId` (optional) - Filter by user ID (shows handovers where user is from or to)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "fromShiftAssignmentId": 123,
      "toShiftAssignmentId": 124,
      "serviceSeekerId": 5,
      "handoverNotes": "Service user was calm today. Medication given at 2pm.",
      "remainingTasks": [
        {
          "taskType": "bathing",
          "tasks": [
            { "id": 456, "date": "2025-01-15", "time": "14:00" }
          ]
        }
      ],
      "visits": [
        {
          "id": 789,
          "date": "2025-01-15",
          "time": "16:00",
          "visitType": "FAMILY",
          "name": "John Doe",
          "purpose": "Family visit"
        }
      ],
      "issues": "Service user mentioned feeling tired today. No immediate concerns.",
      "createdAt": "2025-01-15T15:30:00.000Z",
      "updatedAt": "2025-01-15T15:30:00.000Z",
      "createdById": 10,
      "fromShiftAssignment": {
        "id": 123,
        "user": {
          "id": 8,
          "firstName": "Sarah",
          "lastName": "Johnson"
        },
        "shift": {
          "serviceSeeker": {
            "id": 5,
            "firstName": "John",
            "lastName": "Smith",
            "preferredName": "Johnny",
            "address": "123 Main St"
          }
        }
      },
      "toShiftAssignment": {
        "id": 124,
        "user": {
          "id": 9,
          "firstName": "Mike",
          "lastName": "Wilson"
        },
        "shift": {
          "serviceSeeker": {
            "id": 5,
            "firstName": "John",
            "lastName": "Smith",
            "preferredName": "Johnny",
            "address": "123 Main St"
          }
        }
      },
      "serviceSeeker": {
        "id": 5,
        "firstName": "John",
        "lastName": "Smith",
        "preferredName": "Johnny"
      },
      "createdBy": {
        "id": 10,
        "firstName": "Admin",
        "lastName": "User"
      }
    }
  ]
}
```

---

### 2. Get Single Handover

**Endpoint:** `GET /api/handovers/[id]`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    // Same structure as single handover in GET /api/handovers response
  }
}
```

---

### 3. Create Handover

**Endpoint:** `POST /api/handovers`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "fromShiftAssignmentId": 123,
  "toShiftAssignmentId": 124,
  "handoverNotes": "Service user was calm today. Medication given at 2pm.",
  "remainingTasks": [
    {
      "taskType": "bathing",
      "tasks": [
        { "id": 456, "date": "2025-01-15", "time": "14:00" }
      ]
    },
    {
      "taskType": "foodDrink",
      "tasks": [
        { "id": 457, "date": "2025-01-15", "time": "18:00" }
      ]
    }
  ],
  "visits": [
    {
      "id": 789,
      "date": "2025-01-15",
      "time": "16:00",
      "visitType": "FAMILY",
      "name": "John Doe",
      "purpose": "Family visit"
    }
  ],
  "issues": "Service user mentioned feeling tired today. No immediate concerns."
}
```

**Notes:**
- `fromShiftAssignmentId` and `toShiftAssignmentId` are required
- Location validation: Both shift assignments must be at the same location (same `serviceSeekerId`)
- `handoverNotes` is optional (string)
- `remainingTasks` is optional (array of objects with `taskType` and `tasks` array)
- `visits` is optional (array of visit objects with `id`, `date`, `time`, `visitType`, `name`, `purpose`)
- `issues` is optional (string)

**Task Type Values:**
The `taskType` field in `remainingTasks` should use one of these values:
- `bathing`, `behaviour`, `bloodPressure`, `bloodTest`, `comfortCheck`
- `communicationNotes`, `encouragement`, `familyPhotoMessage`, `followUp`
- `foodDrink`, `generalSupport`, `houseKeeping`, `incidentFall`
- `medicinePrn`, `muac`, `observation`, `oneToOne`, `oralCare`
- `oxygen`, `personCentred`, `physicalIntervention`, `pulse`
- `reposition`, `spendingMoney`, `stool`, `temperature`, `visit`, `weight`

**Response:**
```json
{
  "success": true,
  "data": {
    // Created handover object with all relations
  }
}
```

**Error Responses:**
- `400`: Validation error (e.g., location mismatch, missing required fields)
- `404`: Shift assignment not found
- `401`: Unauthorized

---

### 4. Get Available Shifts for Handover

**Endpoint:** `GET /api/handovers/available?fromShiftAssignmentId=123&date=2025-01-15`

**Query Parameters:**
- `fromShiftAssignmentId` (required) - The shift assignment being handed over from
- `date` (optional) - Date filter (defaults to the from shift assignment's date)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fromAssignment": {
      "id": 123,
      "user": {
        "id": 8,
        "firstName": "Sarah",
        "lastName": "Johnson"
      },
      "shift": {
        "serviceSeekerId": 5,
        "startTime": "08:00",
        "endTime": "16:00"
      }
    },
    "availableAssignments": [
      {
        "id": 124,
        "user": {
          "id": 9,
          "firstName": "Mike",
          "lastName": "Wilson"
        },
        "shift": {
          "serviceSeeker": {
            "id": 5,
            "firstName": "John",
            "lastName": "Smith",
            "preferredName": "Johnny",
            "address": "123 Main St"
          },
          "shiftType": {
            "id": 1,
            "name": "Day Shift"
          },
          "startTime": "16:00",
          "endTime": "00:00"
        }
      }
    ]
  }
}
```

**Notes:**
- Returns only shifts at the same location (same `serviceSeekerId`)
- Excludes the current shift assignment
- Excludes shifts assigned to the same user
- Only returns shifts with status 'SCHEDULED'

---

### 5. Get Handover Data (Helper Endpoint)

**Endpoint:** `GET /api/handovers/handover-data?serviceSeekerId=5&date=2025-01-15`

**Query Parameters:**
- `serviceSeekerId` (required) - Service user ID
- `date` (optional) - Date (defaults to today, YYYY-MM-DD format)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "serviceSeekerId": 5,
    "date": "2025-01-15",
    "remainingTasks": [],
    "visits": [
      {
        "id": 789,
        "date": "2025-01-15",
        "time": "16:00",
        "visitType": "FAMILY",
        "name": "John Doe",
        "purpose": "Family visit"
      }
    ]
  }
}
```

**Notes:**
- For remaining tasks, use `GET /api/caretaker/tasks?date=YYYY-MM-DD` instead
- That endpoint returns all tasks with completion status, filter for incomplete ones
- This endpoint mainly provides visits information

---

### 6. Delete Handover

**Endpoint:** `DELETE /api/handovers/[id]`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Handover deleted successfully"
}
```

---

## Mobile App Integration Guide

### Step 1: Get Available Shifts

When a care worker wants to create a handover:
```
GET /api/handovers/available?fromShiftAssignmentId={currentShiftAssignmentId}&date={date}
```

This will show all shifts at the same location where handover can occur.

### Step 2: Get Remaining Tasks and Visits

To populate the handover form:
```
GET /api/caretaker/tasks?date={date}
```
Filter tasks where `completed` is `NO` or `ATTEMPTED` to get remaining tasks.

For visits:
```
GET /api/service-seekers/{serviceSeekerId}/calendar/visits?date={date}
```
Or use the handover-data endpoint which includes visits.

### Step 3: Create Handover

```
POST /api/handovers
{
  "fromShiftAssignmentId": 123,
  "toShiftAssignmentId": 124,
  "handoverNotes": "General notes about the shift...",
  "remainingTasks": [
    {
      "taskType": "bathing",
      "tasks": [{ "id": 456, "date": "2025-01-15", "time": "14:00" }]
    }
  ],
  "visits": [
    {
      "id": 789,
      "date": "2025-01-15",
      "time": "16:00",
      "visitType": "FAMILY",
      "name": "John Doe",
      "purpose": "Family visit"
    }
  ],
  "issues": "Any concerns or issues..."
}
```

## Data Structure

### Remaining Tasks Format

```json
[
  {
    "taskType": "bathing",
    "tasks": [
      { "id": 456, "date": "2025-01-15", "time": "14:00" }
    ]
  },
  {
    "taskType": "foodDrink",
    "tasks": [
      { "id": 457, "date": "2025-01-15", "time": "18:00" },
      { "id": 458, "date": "2025-01-15", "time": "20:00" }
    ]
  }
]
```

### Visits Format

```json
[
  {
    "id": 789,
    "date": "2025-01-15",
    "time": "16:00",
    "visitType": "FAMILY",
    "name": "John Doe",
    "purpose": "Family visit"
  }
]
```

Visit types: `FAMILY`, `PROFESSIONAL`

