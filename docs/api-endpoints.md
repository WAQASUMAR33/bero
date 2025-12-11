# Caretaker App API Documentation

This document provides a comprehensive guide to the API endpoints for the caretaker mobile application, focusing on daily task management and clock in/out functionality.

---

## 🔐 Authentication

All API endpoints require authentication using a JWT token obtained from the login endpoint.

### Login

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secret"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 21,
    "firstName": "John",
    "lastName": "Doe",
    "email": "user@example.com",
    "role": "CAREWORKER"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Usage:** Use the returned `token` in the `Authorization` header for all subsequent requests:
```
Authorization: Bearer <token>
```

---

## ⏰ Clock In/Out

### Get My Shifts

**Endpoint:** `GET /api/clock-in-out/my-shifts?date=YYYY-MM-DD`

**Query Parameters:**
- `date` (optional) - Date in `YYYY-MM-DD` format (defaults to today)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "shiftAssignmentId": 123,
      "shiftId": 45,
      "date": "2025-01-14T00:00:00.000Z",
      "expectedStartTime": "2025-01-14T08:00:00.000Z",
      "expectedEndTime": "2025-01-14T16:00:00.000Z",
      "startTime": "08:00",
      "endTime": "16:00",
      "serviceSeeker": {
        "id": 12,
        "firstName": "John",
        "lastName": "Doe",
        "preferredName": "Johnny",
        "address": "123 Main St",
        "latitude": 51.5074,
        "longitude": -0.1278
      },
      "shiftType": { "id": 1, "name": "Day Shift" },
      "funder": { "id": 5, "fundingSource": "NHS" },
      "timeCritical": true,
      "notesForCarers": "Arrive 15 minutes early",
      "status": "SCHEDULED",
      "clockedIn": true,
      "clockInTime": "2025-01-14T08:05:00.000Z",
      "clockOutTime": null,
      "isLate": false,
      "isEarly": false,
      "clockInOutId": 789
    }
  ],
  "date": "2025-01-14"
}
```

---

### Clock In

**Endpoint:** `POST /api/clock-in-out/clock-in`

**Request Body:**
```json
{
  "shiftAssignmentId": 123,
  "serviceSeekerId": 12,
  "date": "2025-01-14",
  "workType": "REGULAR",
  "location": "51.5074,-0.1278",
  "notes": "Arrived on time"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 789,
    "userId": 21,
    "shiftAssignmentId": 123,
    "serviceSeekerId": 12,
    "date": "2025-01-14T00:00:00.000Z",
    "clockInTime": "2025-01-14T08:05:00.000Z",
    "clockOutTime": null,
    "workType": "REGULAR",
    "isLate": false,
    "clockInLocation": "51.5074,-0.1278",
    "notes": "Arrived on time"
  },
  "message": "Clocked in successfully"
}
```

---

### Clock Out

**Endpoint:** `POST /api/clock-in-out/clock-out`

**Request Body:**
```json
{
  "clockInOutId": 789,
  "location": "51.5074,-0.1278",
  "notes": "Shift completed"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 789,
    "clockOutTime": "2025-01-14T16:00:00.000Z",
    "isEarly": false
  },
  "message": "Clocked out successfully"
}
```

---

## 📋 Daily Tasks

### Overview

Daily tasks are created by administrators through the web application. Caretakers can view and complete these tasks through the mobile app. All task endpoints support filtering by service user and date.

**Base URL Pattern:** `/api/{task-type}-tasks`

**Common Query Parameters:**
- `serviceSeekerId` (optional) - Filter by service user ID
- `date` (optional) - Filter by date in `YYYY-MM-DD` format

**Example:**
```
GET /api/bathing-tasks?serviceSeekerId=12&date=2025-01-14
```

---

### Unified Tasks Endpoint

Get all tasks for service users assigned to the logged-in caretaker.

**Endpoint:** `GET /api/caretaker/tasks?date=YYYY-MM-DD`

**Query Parameters:**
- `date` (optional) - Date in `YYYY-MM-DD` format (defaults to today)

**Response:**
```json
{
  "success": true,
  "data": {
    "tasks": {
      "bathing": [...],
      "behaviour": [...],
      "bloodPressure": [...],
      "bloodTest": [...],
      "comfortCheck": [...],
      "communicationNotes": [...],
      "encouragement": [...],
      "familyPhotoMessage": [...],
      "followUp": [...],
      "foodDrink": [...],
      "generalSupport": [...],
      "houseKeeping": [...],
      "incidentFall": [...],
      "medicinePrn": [...],
      "muac": [...],
      "observation": [...],
      "oneToOne": [...],
      "oralCare": [...],
      "oxygen": [...],
      "personCentred": [...],
      "physicalIntervention": [...],
      "pulse": [...],
      "reposition": [...],
      "spendingMoney": [...],
      "stool": [...],
      "temperature": [...],
      "visit": [...],
      "weight": [...]
    },
    "serviceUsers": [
      {
        "id": 12,
        "firstName": "John",
        "lastName": "Doe",
        "preferredName": "Johnny",
        "photoUrl": "https://..."
      }
    ],
    "date": "2025-01-14"
  }
}
```

---

### Task Endpoints by Type

Each task type has three main endpoints:

1. **List Tasks** - `GET /api/{task-type}-tasks?serviceSeekerId={id}&date={date}`
2. **Get Single Task** - `GET /api/{task-type}-tasks/{id}`
3. **Update/Complete Task** - `PUT /api/{task-type}-tasks/{id}`

#### Update Task (Complete Task)

**Endpoint:** `PUT /api/{task-type}-tasks/{id}`

**Request Body:** Send only the fields you want to update (partial updates supported)
```json
{
  "completed": "YES",
  "emotion": "HAPPY",
  "notes": "Task completed successfully",
  "time": "14:30"
}
```

**Response:** Returns the updated task with all relations

**Note:** The `updatedById` and `updatedAt` fields are automatically set to the current user and timestamp when a task is updated.

---

### Available Task Types

| # | Task Type | Endpoint Path | Key Fields |
|---|-----------|---------------|------------|
| 1 | **Bathing** | `/api/bathing-tasks` | `bathingType`, `compliance`, `stoolPassed`, `urinePassed`, `catheterChecked` |
| 2 | **Behaviour** | `/api/behaviour-tasks` | `type`, `triggerId`, `antecedents`, `behaviour`, `consequences`, `careIntervention` |
| 3 | **Blood Pressure** | `/api/blood-pressure-tasks` | `systolicPressure`, `diastolicPressure` |
| 4 | **Blood Test** | `/api/blood-test-tasks` | `when`, `bloodGlucose`, `insulinGiven`, `sideAdministered` |
| 5 | **Comfort Check** | `/api/comfort-check-tasks` | `allNeedsMet`, `catheterCheck`, `incontinencePadCheck`, `repositioned`, `toileted` |
| 6 | **Communication Notes** | `/api/communication-notes-tasks` | `notes` |
| 7 | **Encouragement** | `/api/encouragement-tasks` | `encouragement`, `note` |
| 8 | **Family Photo Message** | `/api/family-photo-message-tasks` | `description`, `messageFromResidence`, `photoUrl` |
| 9 | **Follow Up** | `/api/follow-up-tasks` | `followUpDate`, `followUpTime`, `name`, `description`, `status` |
| 10 | **Food & Drink** | `/api/food-drink-tasks` | `time`, `foodDrinkOffer`, `main`, `fluidIntake`, `assistance`, `foodDrinkOffered` |
| 11 | **General Support** | `/api/general-support-tasks` | `notes`, `supportListId` |
| 12 | **House Keeping** | `/api/house-keeping-tasks` | `task`, `notes`, `photoUrl` |
| 13 | **Incident/Fall** | `/api/incident-fall-tasks` | `incidentTypeId`, `locationId`, `serviceUserInjured`, `witnessedBy`, `injuryDetail` |
| 14 | **Medicine PRN** | `/api/medicine-prn-tasks` | `applyDate`, `applyTime`, `medicineName`, `medicineType`, `administrated` |
| 15 | **MUAC** | `/api/muac-tasks` | `muacInCm` |
| 16 | **Observation** | `/api/observation-tasks` | `notes` |
| 17 | **One-to-One** | `/api/one-to-one-tasks` | `duration`, `notes` |
| 18 | **Oral Care** | `/api/oral-care-tasks` | `oralCare`, `assisted`, `compliance` |
| 19 | **Oxygen** | `/api/oxygen-tasks` | `quantity` |
| 20 | **Person Centred** | `/api/person-centred-tasks` | `nameId`, `notes`, `photoUrl` |
| 21 | **Physical Intervention** | `/api/physical-intervention-tasks` | Multiple yes/no fields (see form for details) |
| 22 | **Pulse** | `/api/pulse-tasks` | `pulseRate` |
| 23 | **Reposition** | `/api/reposition-tasks` | `position`, `intactOrEpuapGrade`, `photoUrl` |
| 24 | **Spending Money** | `/api/spending-money-tasks` | `type`, `amount`, `paidUsing`, `receiptUrl` |
| 25 | **Stool** | `/api/stool-tasks` | `type`, `urinePassed` |
| 26 | **Temperature** | `/api/temperature-tasks` | `temperatureInC` |
| 27 | **Visit** | `/api/visit-tasks` | `visitType`, `announced`, `name`, `relationship`, `purpose`, `summary` |
| 28 | **Weight** | `/api/weight-tasks` | `weight` |

---

### Common Task Fields

Most tasks share these common fields:

- `serviceSeekerId` (required) - ID of the service user
- `date` (required) - Task date (ISO format)
- `time` (optional) - Task time (HH:mm format)
- `completed` (optional) - Completion status: `"YES"`, `"NO"`, or `null`
- `emotion` (optional) - Emotion indicator: `"HAPPY"`, `"SAD"`, `"NEUTRAL"`, etc.
- `notes` (optional) - Additional notes or comments

**Note:** For Medicine PRN tasks, use `applyDate` instead of `date`.

---

## 🔄 Caretaker App Workflow

Here's the typical workflow for a caretaker using the mobile app:

### Step-by-Step Process

1. **Login**
   - `POST /api/auth/login`
   - Store the JWT token for subsequent requests

2. **Get Assigned Shifts**
   - `GET /api/clock-in-out/my-shifts?date=YYYY-MM-DD`
   - View all shifts assigned for the day

3. **Clock In**
   - `POST /api/clock-in-out/clock-in`
   - Clock in when arriving at the service user's location
   - Use the `shiftAssignmentId` from step 2

4. **Get Tasks**
   - `GET /api/caretaker/tasks?date=YYYY-MM-DD`
   - Retrieve all tasks for assigned service users
   - Tasks are grouped by type and include service user information

5. **Complete Tasks**
   - `PUT /api/{task-type}-tasks/{id}`
   - Fill out the task form with required information
   - Submit the completed task
   - The system automatically records who completed it and when

6. **Clock Out**
   - `POST /api/clock-in-out/clock-out`
   - Clock out when leaving the service user's location
   - Use the `clockInOutId` from step 3

### Example Flow

```javascript
// 1. Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});
const { token } = await loginResponse.json();

// 2. Get shifts for today
const shiftsResponse = await fetch('/api/clock-in-out/my-shifts?date=2025-01-14', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { data: shifts } = await shiftsResponse.json();

// 3. Clock in
const clockInResponse = await fetch('/api/clock-in-out/clock-in', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    shiftAssignmentId: shifts[0].shiftAssignmentId,
    serviceSeekerId: shifts[0].serviceSeeker.id,
    date: '2025-01-14',
    location: '51.5074,-0.1278'
  })
});

// 4. Get tasks
const tasksResponse = await fetch('/api/caretaker/tasks?date=2025-01-14', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { data: tasksData } = await tasksResponse.json();

// 5. Complete a task
const completeTaskResponse = await fetch('/api/bathing-tasks/123', {
  method: 'PUT',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    completed: 'YES',
    time: '08:15',
    bathingType: 'SHOWER',
    compliance: 'COMPLETED',
    emotion: 'HAPPY'
  })
});

// 6. Clock out
const clockOutResponse = await fetch('/api/clock-in-out/clock-out', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    clockInOutId: clockInResponse.data.id,
    location: '51.5074,-0.1278'
  })
});
```

---

## 📝 Notes

- All endpoints require the `Authorization: Bearer <token>` header
- Tasks are created by administrators via the web application
- Caretakers can only view and complete tasks (not create or delete)
- Task completion automatically updates `updatedById` and `updatedAt` fields
- Partial updates are supported - send only the fields you want to change
- Date format should be `YYYY-MM-DD` for query parameters
- Time format should be `HH:mm` (24-hour format)

---

## ❓ Error Handling

All endpoints return appropriate HTTP status codes:

- `200` - Success
- `401` - Unauthorized (invalid or missing token)
- `404` - Resource not found
- `500` - Server error

Error responses follow this format:
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details (optional)"
}
```
