# Daily Tasks API for Mobile App

## Overview

This document provides the API endpoints for the mobile app to interact with daily tasks. Mobile app users can:
- ✅ **View/List** tasks (GET)
- ✅ **Update/Fill** task fields (PUT)
- ❌ **Cannot Create** new tasks (POST not available)
- ❌ **Cannot Delete** tasks (DELETE not available)

**Base URL:** `/api`

**Authentication:** All requests require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Unified Tasks Endpoint (Recommended)

Get all tasks for service users assigned to the logged-in caretaker in a single request.

### Get All Tasks

**Endpoint:** `GET /api/caretaker/tasks`

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

## Individual Task Type Endpoints

Each task type follows the same pattern:

1. **List Tasks** - `GET /api/{task-type}-tasks?serviceSeekerId={id}&date={date}`
2. **Get Single Task** - `GET /api/{task-type}-tasks/{id}`
3. **Update Task** - `PUT /api/{task-type}-tasks/{id}`

### Common Query Parameters (for List endpoints)
- `serviceSeekerId` (optional) - Filter by service user ID
- `date` (optional) - Filter by date in `YYYY-MM-DD` format

### Common Task Fields

Most tasks include these common fields that can be updated:
- `time` (optional) - Task time in `HH:mm` format
- `completed` (optional) - Completion status: `"YES"`, `"NO"`, `"ATTEMPTED"`, `"NOT_REQUIRED"`
- `emotion` (optional) - Emotion indicator: `"HAPPY"`, `"SAD"`, `"NEUTRAL"`
- `notes` (optional) - Additional notes or comments

**Note:** When updating a task, you only need to send the fields you want to update (partial updates are supported). The `updatedById` and `updatedAt` fields are automatically set.

---

## Task Types and Updateable Fields

### 1. Bathing Tasks

**Endpoint Base:** `/api/bathing-tasks`

**Updateable Fields:**
- `time` (String) - Time in HH:mm format
- `bathingType` (Enum) - `BATH`, `BEDWASH`, `FULL_BODY_WASH`, `LOWER_BODY_WASH`, `SHOWER`, `STRIP_WASH`
- `compliance` (Enum) - `COMPLETED`, `DECLINED`
- `stoolPassed` (Boolean)
- `urinePassed` (Boolean)
- `bathNotes` (String, optional)
- `catheterChecked` (Boolean)
- `completed` (Enum) - `YES`, `NO`, `ATTEMPTED`, `NOT_REQUIRED`
- `emotion` (Enum) - `SAD`, `NEUTRAL`, `HAPPY`

**Example PUT Request:**
```json
{
  "time": "14:30",
  "bathingType": "SHOWER",
  "compliance": "COMPLETED",
  "stoolPassed": false,
  "urinePassed": true,
  "bathNotes": "Completed successfully",
  "catheterChecked": true,
  "completed": "YES",
  "emotion": "HAPPY"
}
```

---

### 2. Behaviour Tasks

**Endpoint Base:** `/api/behaviour-tasks`

**Updateable Fields:**
- `time` (String)
- `type` (Enum) - `AGGRESSION_HITTING_BITING`, `CRYING`, `HAPPY_APPRECIATING`, `ISOLATION`, `SELF_INJURIOUS_BEHAVIOUR`, `SEXUALIZED_BEHAVIOUR_IN_PUBLIC`, `SHOUTING_SWEARING`, `SOILING_SMEARING`, `STARVATION`, `THROWING_BREAKING_ITEMS`
- `triggerId` (Int, optional) - ID of the behaviour trigger
- `antecedents` (String, optional)
- `behaviour` (String, optional)
- `consequences` (String, optional)
- `careIntervention` (String, optional)
- `completed` (Enum)
- `emotion` (Enum)

---

### 3. Blood Pressure Tasks

**Endpoint Base:** `/api/blood-pressure-tasks`

**Updateable Fields:**
- `time` (String)
- `systolicPressure` (Int)
- `diastolicPressure` (Int)
- `notes` (String, optional)
- `completed` (Enum)
- `emotion` (Enum)

**Example PUT Request:**
```json
{
  "time": "09:00",
  "systolicPressure": 120,
  "diastolicPressure": 80,
  "notes": "Normal reading",
  "completed": "YES",
  "emotion": "NEUTRAL"
}
```

---

### 4. Blood Test Tasks

**Endpoint Base:** `/api/blood-test-tasks`

**Updateable Fields:**
- `time` (String)
- `when` (Enum) - `BEFORE_BREAKFAST`, `AFTER_BREAKFAST`, `BEFORE_LUNCH`, `AFTER_LUNCH`, `BEFORE_DINNER`, `AFTER_DINNER`, `BEDTIME`, `OTHER`
- `bloodGlucose` (Float, optional)
- `insulinGiven` (String, optional)
- `sideAdministered` (Enum, optional) - `LEFT_UPPER`, `RIGHT_UPPER`, `LEFT_LOWER`, `RIGHT_LOWER`
- `note` (String, optional)
- `completed` (Enum)
- `emotion` (Enum)

---

### 5. Comfort Check Tasks

**Endpoint Base:** `/api/comfort-check-tasks`

**Updateable Fields:**
- `time` (String)
- `allNeedsMet` (Boolean)
- `catheterCheck` (Boolean)
- `incontinencePadCheck` (Boolean)
- `repositioned` (Boolean)
- `toileted` (Boolean)
- `notes` (String, optional)
- `completed` (Enum)
- `emotion` (Enum)

---

### 6. Communication Notes Tasks

**Endpoint Base:** `/api/communication-notes-tasks`

**Updateable Fields:**
- `time` (String, optional)
- `notes` (String)
- `completed` (Enum)
- `emotion` (Enum)

---

### 7. Encouragement Tasks

**Endpoint Base:** `/api/encouragement-tasks`

**Updateable Fields:**
- `time` (String, optional)
- `encouragement` (String)
- `note` (String, optional)
- `completed` (Enum)
- `emotion` (Enum)

---

### 8. Family Photo Message Tasks

**Endpoint Base:** `/api/family-photo-message-tasks`

**Updateable Fields:**
- `time` (String, optional)
- `description` (String, optional)
- `messageFromResidence` (String, optional)
- `photoUrl` (String, optional)
- `completed` (Enum)
- `emotion` (Enum)

---

### 9. Follow Up Tasks

**Endpoint Base:** `/api/follow-up-tasks`

**Updateable Fields:**
- `time` (String, optional)
- `followUpDate` (DateTime)
- `followUpTime` (String, optional)
- `name` (String)
- `description` (String, optional)
- `status` (Enum) - Check schema for available values
- `completed` (Enum)
- `emotion` (Enum)

---

### 10. Food & Drink Tasks

**Endpoint Base:** `/api/food-drink-tasks`

**Updateable Fields:**
- `time` (String)
- `foodDrinkOffer` (String, optional)
- `main` (String, optional)
- `fluidIntake` (Int, optional)
- `comments` (String, optional)
- `assistance` (Enum, optional)
- `foodDrinkOffered` (Boolean)
- `pictureUrl` (String, optional)
- `completed` (Enum)
- `emotion` (Enum)

**Example PUT Request:**
```json
{
  "time": "12:30",
  "foodDrinkOffer": "Full meal",
  "main": "Chicken and rice",
  "fluidIntake": 250,
  "comments": "Ate well",
  "foodDrinkOffered": true,
  "completed": "YES",
  "emotion": "HAPPY"
}
```

---

### 11. General Support Tasks

**Endpoint Base:** `/api/general-support-tasks`

**Updateable Fields:**
- `time` (String, optional)
- `notes` (String, optional)
- `supportListId` (Int, optional)
- `completed` (Enum)
- `emotion` (Enum)

---

### 12. House Keeping Tasks

**Endpoint Base:** `/api/house-keeping-tasks`

**Updateable Fields:**
- `time` (String, optional)
- `task` (String, optional)
- `notes` (String, optional)
- `photoUrl` (String, optional)
- `completed` (Enum)
- `emotion` (Enum)

---

### 13. Incident/Fall Tasks

**Endpoint Base:** `/api/incident-fall-tasks`

**Updateable Fields:**
- `time` (String)
- `incidentTypeId` (Int, optional)
- `locationId` (Int, optional)
- `serviceUserInjured` (Boolean)
- `witnessedBy` (Int, optional) - Staff ID
- `injuryDetail` (String, optional)
- `notes` (String, optional)
- `completed` (Enum)
- `emotion` (Enum)

---

### 14. Medicine PRN Tasks

**Endpoint Base:** `/api/medicine-prn-tasks`

**Note:** This task type uses `applyDate` instead of `date` for filtering.

**Updateable Fields:**
- `applyDate` (DateTime)
- `applyTime` (String)
- `medicineName` (String)
- `medicineType` (String, optional)
- `administrated` (Boolean)
- `completed` (Enum)
- `emotion` (Enum)
- `notes` (String, optional)

---

### 15. MUAC Tasks

**Endpoint Base:** `/api/muac-tasks`

**Updateable Fields:**
- `time` (String)
- `muacInCm` (Float)
- `notes` (String, optional)
- `completed` (Enum)
- `emotion` (Enum)

---

### 16. Observation Tasks

**Endpoint Base:** `/api/observation-tasks`

**Updateable Fields:**
- `time` (String, optional)
- `notes` (String)
- `completed` (Enum)
- `emotion` (Enum)

---

### 17. One-to-One Tasks

**Endpoint Base:** `/api/one-to-one-tasks`

**Updateable Fields:**
- `time` (String, optional)
- `duration` (String, optional)
- `notes` (String, optional)
- `completed` (Enum)
- `emotion` (Enum)

---

### 18. Oral Care Tasks

**Endpoint Base:** `/api/oral-care-tasks`

**Updateable Fields:**
- `time` (String, optional)
- `oralCare` (Enum) - Check schema for available values
- `assisted` (Enum) - Check schema for available values
- `notes` (String, optional)
- `compliance` (Enum) - `COMPLETED`, `DECLINED`
- `completed` (Enum)
- `emotion` (Enum)

---

### 19. Oxygen Tasks

**Endpoint Base:** `/api/oxygen-tasks`

**Updateable Fields:**
- `time` (String)
- `quantity` (String)
- `notes` (String, optional)
- `completed` (Enum)
- `emotion` (Enum)

---

### 20. Person Centred Tasks

**Endpoint Base:** `/api/person-centred-tasks`

**Updateable Fields:**
- `time` (String, optional)
- `nameId` (Int, optional) - Person centred task name ID
- `notes` (String, optional)
- `photoUrl` (String, optional)
- `completed` (Enum)
- `emotion` (Enum)

---

### 21. Physical Intervention Tasks

**Endpoint Base:** `/api/physical-intervention-tasks`

**Updateable Fields:**
- `time` (String, optional)
- Multiple yes/no fields (check schema for complete list)
- `notes` (String, optional)
- `completed` (Enum)
- `emotion` (Enum)

---

### 22. Pulse Tasks

**Endpoint Base:** `/api/pulse-tasks`

**Updateable Fields:**
- `time` (String)
- `pulseRate` (Int)
- `notes` (String, optional)
- `completed` (Enum)
- `emotion` (Enum)

---

### 23. Reposition Tasks

**Endpoint Base:** `/api/reposition-tasks`

**Updateable Fields:**
- `time` (String, optional)
- `position` (String, optional)
- `intactOrEpuapGrade` (String, optional)
- `photoUrl` (String, optional)
- `completed` (Enum)
- `emotion` (Enum)
- `notes` (String, optional)

---

### 24. Spending Money Tasks

**Endpoint Base:** `/api/spending-money-tasks`

**Updateable Fields:**
- `time` (String, optional)
- `type` (Enum, optional) - Check schema for available values
- `amount` (Float, optional)
- `paidUsing` (String, optional)
- `receiptUrl` (String, optional)
- `completed` (Enum)
- `emotion` (Enum)
- `notes` (String, optional)

---

### 25. Stool Tasks

**Endpoint Base:** `/api/stool-tasks`

**Updateable Fields:**
- `time` (String)
- `type` (Enum, optional) - Check schema for available values
- `urinePassed` (Boolean)
- `notes` (String, optional)
- `completed` (Enum)
- `emotion` (Enum)

---

### 26. Temperature Tasks

**Endpoint Base:** `/api/temperature-tasks`

**Updateable Fields:**
- `time` (String)
- `temperatureInC` (Float)
- `notes` (String, optional)
- `completed` (Enum)
- `emotion` (Enum)

**Example PUT Request:**
```json
{
  "time": "08:00",
  "temperatureInC": 36.5,
  "notes": "Normal temperature",
  "completed": "YES",
  "emotion": "NEUTRAL"
}
```

---

### 27. Visit Tasks

**Endpoint Base:** `/api/visit-tasks`

**Updateable Fields:**
- `time` (String)
- `visitType` (Enum) - Check schema for available values
- `announced` (Enum) - Check schema for available values
- `name` (String)
- `relationship` (String, optional) - For family visits
- `role` (Enum, optional) - For professional visits
- `purpose` (String)
- `summary` (String, optional)
- `completed` (Enum) - Uses VisitCompletion enum (check schema)

---

### 28. Weight Tasks

**Endpoint Base:** `/api/weight-tasks`

**Updateable Fields:**
- `time` (String)
- `weight` (Float)
- `notes` (String, optional)
- `completed` (Enum)
- `emotion` (Enum)

**Example PUT Request:**
```json
{
  "time": "07:00",
  "weight": 70.5,
  "notes": "Morning weight check",
  "completed": "YES",
  "emotion": "NEUTRAL"
}
```

---

## Example Usage

### 1. Get All Tasks for Today

```bash
GET /api/caretaker/tasks?date=2025-01-14
Authorization: Bearer <token>
```

### 2. Get Specific Task Type

```bash
GET /api/temperature-tasks?serviceSeekerId=12&date=2025-01-14
Authorization: Bearer <token>
```

### 3. Get Single Task

```bash
GET /api/temperature-tasks/123
Authorization: Bearer <token>
```

### 4. Update Task (Partial Update)

```bash
PUT /api/temperature-tasks/123
Authorization: Bearer <token>
Content-Type: application/json

{
  "temperatureInC": 37.2,
  "completed": "YES",
  "emotion": "HAPPY",
  "notes": "Slightly elevated, monitoring"
}
```

---

## Response Format

All successful responses return the updated task object with related data:

```json
{
  "id": 123,
  "serviceSeekerId": 12,
  "date": "2025-01-14T00:00:00.000Z",
  "time": "08:00",
  "temperatureInC": 37.2,
  "notes": "Slightly elevated, monitoring",
  "completed": "YES",
  "emotion": "HAPPY",
  "createdAt": "2025-01-14T07:00:00.000Z",
  "updatedAt": "2025-01-14T08:05:00.000Z",
  "serviceSeeker": {
    "id": 12,
    "firstName": "John",
    "lastName": "Doe",
    "preferredName": "Johnny"
  },
  "createdBy": {
    "id": 1,
    "firstName": "Admin",
    "lastName": "User"
  },
  "updatedBy": {
    "id": 5,
    "firstName": "Care",
    "lastName": "Worker"
  }
}
```

---

## Error Responses

### Unauthorized (401)
```json
{
  "error": "Unauthorized"
}
```

### Not Found (404)
```json
{
  "error": "Temperature task not found"
}
```

### Validation Error (400/500)
```json
{
  "error": "Failed to update task",
  "details": "Error message details"
}
```

---

## Important Notes

1. **Partial Updates**: You can send only the fields you want to update. You don't need to send all fields.

2. **Auto-set Fields**: The following fields are automatically set by the server:
   - `updatedById` - Set to the current user's ID
   - `updatedAt` - Set to the current timestamp

3. **Read-only Fields**: The following fields cannot be changed:
   - `id`
   - `serviceSeekerId` (usually)
   - `date` (usually)
   - `createdById`
   - `createdAt`

4. **Date Format**: Use ISO 8601 format for dates: `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ss.sssZ`

5. **Time Format**: Use 24-hour format: `HH:mm` (e.g., "14:30" for 2:30 PM)

6. **Enum Values**: Make sure to use exact enum values as specified in the schema. The API will return validation errors for invalid enum values.

