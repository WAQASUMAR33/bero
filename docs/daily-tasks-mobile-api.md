# Daily Tasks API for Mobile App

## Overview

This document provides the API endpoints for the mobile app to interact with daily tasks. Mobile app users (care workers and support workers) can:
- ✅ **View/List** tasks (GET) - **Only for service users they are assigned to via shifts**
- ✅ **Update/Fill** task fields (PUT)
- ❌ **Cannot Create** new tasks (POST blocked for care workers/support workers)
- ❌ **Cannot Delete** tasks (DELETE blocked for care workers/support workers)

**Important Security Notes:**
- Care workers and support workers can only view tasks for service users they have shift assignments for
- Tasks are automatically created from schedules by administrators/managers
- Care workers can only update task completion status and fill in task details, not create or delete tasks

**Base URL:** `/api`

**Authentication:** All requests require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Unified Tasks Endpoint (Recommended)

Get all tasks for service users assigned to the logged-in caretaker in a single request.

**Important:** For care workers and support workers, this endpoint **ONLY** returns tasks for service users they have shift assignments for on the specified date. This ensures care workers only see tasks for service users they are actually working with.

### Get All Tasks

**Endpoint:** `GET /api/caretaker/tasks`

**Query Parameters:**
- `date` (optional) - Date in `YYYY-MM-DD` format (defaults to today)
- `serviceSeekerId` (optional) - For admins/managers only: Filter by specific service user ID

**Behavior:**
- **Care Workers/Support Workers**: Automatically filters by shift assignments. The `serviceSeekerId` parameter is ignored.
- **Admins/Managers**: Can optionally filter by `serviceSeekerId`. If not provided, returns all tasks for the date.

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
    "date": "2025-01-14",
    "message": "No shift assignments found for this date. You will only see tasks for service users you are assigned to." // Only present if no assignments found
  }
}
```

**Note for Care Workers:**
- If you have no shift assignments for the specified date, the response will return empty tasks and serviceUsers arrays with a helpful message.
- You will **ONLY** see tasks for service users you have active shift assignments for on that date.
- This ensures you don't see tasks for service users you're not assigned to work with.

---

## Individual Task Type Endpoints

Each task type follows the same pattern:

1. **List Tasks** - `GET /api/{task-type}-tasks?serviceSeekerId={id}&date={date}`
2. **Get Single Task** - `GET /api/{task-type}-tasks/{id}`
3. **Update Task** - `PUT /api/{task-type}-tasks/{id}`

### Common Query Parameters (for List endpoints)
- `serviceSeekerId` (optional) - Filter by service user ID (only works for admins/managers, not care workers)
- `date` (optional) - Filter by date in `YYYY-MM-DD` format

**Note for Care Workers:** When care workers or support workers call GET endpoints, they automatically only see tasks for service users they have shift assignments for on the specified date (or today if no date provided). The `serviceSeekerId` parameter is ignored for care workers - they can only see tasks for their assigned service users.

### Common Task Fields

Most tasks include these common fields that can be updated:
- `time` (optional) - Task time in `HH:mm` format
- `completed` (optional) - Completion status: `"YES"`, `"NO"`, `"ATTEMPTED"`, `"NOT_REQUIRED"`
- `emotion` (optional) - Emotion indicator: `"HAPPY"`, `"SAD"`, `"NEUTRAL"`
- `notes` (optional) - Additional notes or comments

**Note:** When updating a task, you only need to send the fields you want to update (partial updates are supported). The `updatedById` and `updatedAt` fields are automatically set.

**Important Field Restrictions for Care Workers:**
- Care workers **CAN** update:
  - Task-specific data (e.g., `systolicPressure`, `diastolicPressure` for blood pressure tasks)
  - `notes` - Additional notes or reasons
  - `completed` - Completion status
  - `emotion` - Emotion indicator
  - Task-specific fields (e.g., `bathingType`, `oralCare`, `temperatureInC`, etc.)
  - `time` - Task completion time (for most task types)
- Care workers **CANNOT** update:
  - `serviceSeekerId` - Service user assignment (set by admin) - **BLOCKED**
  - `date` - Task date (set by admin) - **BLOCKED**
  - Admin-controlled fields (e.g., `incidentTypeId`, `locationId`, `supportListId`, `triggerId`, etc.) - **BLOCKED**
- Care workers **CANNOT** create or delete tasks - **POST and DELETE endpoints return 403 Forbidden**

---

## Task Types and Updateable Fields

### 1. Bathing Tasks

**Endpoint Base:** `/api/bathing-tasks`

**Care Worker Updateable Fields:**
- `time` (String) - Time in HH:mm format
- `bathingType` (Enum) - `BATH`, `BEDWASH`, `FULL_BODY_WASH`, `LOWER_BODY_WASH`, `SHOWER`, `STRIP_WASH`
- `compliance` (Enum) - `COMPLETED`, `DECLINED`
- `stoolPassed` (Boolean)
- `urinePassed` (Boolean)
- `bathNotes` (String, optional)
- `catheterChecked` (Boolean)
- `completed` (Enum) - `YES`, `NO`, `ATTEMPTED`, `NOT_REQUIRED`
- `emotion` (Enum) - `SAD`, `NEUTRAL`, `HAPPY`

**Admin/Manager Only Fields (Cannot be updated by Care Worker):**
- `serviceSeekerId`
- `date`

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

**Care Worker Updateable Fields:**
- `type` (Enum) - `AGGRESSION_HITTING_BITING`, `CRYING`, `HAPPY_APPRECIATING`, `ISOLATION`, `SELF_INJURIOUS_BEHAVIOUR`, `SEXUALIZED_BEHAVIOUR_IN_PUBLIC`, `SHOUTING_SWEARING`, `SOILING_SMEARING`, `STARVATION`, `THROWING_BREAKING_ITEMS`
- `triggerId` (Int, optional) - ID of the behaviour trigger
- `othersInvolved` (Boolean)
- `othersInvolvedDetails` (String, optional)
- `antecedents` (String, optional)
- `behaviour` (String, optional)
- `consequences` (String, optional)
- `careIntervention` (String, optional)
- `emotion` (Enum)

**Admin/Manager Only Fields (Cannot be updated by Care Worker):**
- `serviceSeekerId`
- `date`
- `time`

---

### 3. Blood Pressure Tasks

**Endpoint Base:** `/api/blood-pressure-tasks`

**Care Worker Updateable Fields:**
- `systolicPressure` (Int)
- `diastolicPressure` (Int)
- `notes` (String, optional)
- `completed` (Enum)
- `emotion` (Enum)
- `time` (String)

**Admin/Manager Only Fields (Cannot be updated by Care Worker):**
- `serviceSeekerId`
- `date`

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

**Care Worker Updateable Fields:**
- `bloodGlucose` (Float, optional)
- `insulinGiven` (String, optional)
- `sideAdministered` (Enum, optional) - `LEFT_UPPER`, `RIGHT_UPPER`, `LEFT_LOWER`, `RIGHT_LOWER`
- `note` (String, optional)
- `completed` (Enum)
- `emotion` (Enum)

**Admin/Manager Only Fields (Cannot be updated by Care Worker):**
- `serviceSeekerId`
- `date`
- `time`
- `when`

---

### 5. Comfort Check Tasks

**Endpoint Base:** `/api/comfort-check-tasks`

**Care Worker Updateable Fields:**
- `time` (String)
- `allNeedsMet` (Boolean)
- `catheterCheck` (Boolean)
- `incontinencePadCheck` (Boolean)
- `repositioned` (Boolean)
- `toileted` (Boolean)
- `stoolPassed` (Boolean)
- `urinePassed` (Boolean)
- `sleep` (Boolean)
- `stomaCheck` (Boolean)
- `personalHygiene` (Boolean)
- `notes` (String, optional)
- `completed` (Enum)
- `emotion` (Enum)

**Admin/Manager Only Fields (Cannot be updated by Care Worker):**
- `serviceSeekerId`
- `date`

---

### 6. Communication Notes Tasks

**Endpoint Base:** `/api/communication-notes-tasks`

**Care Worker Updateable Fields:**
- `notes` (String)
- `emotion` (Enum)

**Admin/Manager Only Fields (Cannot be updated by Care Worker):**
- `serviceSeekerId`
- `date`
- `time`

---

### 7. Encouragement Tasks

**Endpoint Base:** `/api/encouragement-tasks`

**Care Worker Updateable Fields:**
- `time` (String, optional)
- `encouragement` (String)
- `note` (String, optional)
- `completed` (Enum)
- `emotion` (Enum)

**Admin/Manager Only Fields (Cannot be updated by Care Worker):**
- `serviceSeekerId`
- `date`

---

### 8. Family Photo Message Tasks

**Endpoint Base:** `/api/family-photo-message-tasks`

**Care Worker Updateable Fields:**
- `description` (String, optional)
- `messageFromResidence` (String, optional)
- `photoUrl` (String, optional)
- `emotion` (Enum)

**Admin/Manager Only Fields (Cannot be updated by Care Worker):**
- `serviceSeekerId`
- `date`
- `time`

---

### 9. Follow Up Tasks

**Endpoint Base:** `/api/follow-up-tasks`

**Care Worker Updateable Fields:**
- `followUpDate` (DateTime)
- `followUpTime` (String, optional)
- `name` (String)
- `description` (String, optional)
- `status` (Enum) - Check schema for available values
- `emotion` (Enum)

**Admin/Manager Only Fields (Cannot be updated by Care Worker):**
- `serviceSeekerId`
- `date`
- `time`

---

### 10. Food & Drink Tasks

**Endpoint Base:** `/api/food-drink-tasks`

**Care Worker Updateable Fields:**
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

**Admin/Manager Only Fields (Cannot be updated by Care Worker):**
- `serviceSeekerId`
- `date`

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

**Care Worker Updateable Fields:**
- `notes` (String, optional)
- `emotion` (Enum)

**Admin/Manager Only Fields (Cannot be updated by Care Worker):**
- `serviceSeekerId`
- `date`
- `time`
- `supportListId`

---

### 12. House Keeping Tasks

**Endpoint Base:** `/api/house-keeping-tasks`

**Care Worker Updateable Fields:**
- `task` (String, optional)
- `notes` (String, optional)
- `photoUrl` (String, optional)
- `completed` (Enum)
- `emotion` (Enum)

**Admin/Manager Only Fields (Cannot be updated by Care Worker):**
- `serviceSeekerId`
- `date`
- `time`

---

### 13. Incident/Fall Tasks

**Endpoint Base:** `/api/incident-fall-tasks`

**Care Worker Updateable Fields:**
- `incidentLasted` (String, optional)
- `othersInvolved` (Boolean)
- `othersInvolvedDetails` (String, optional)
- `injuryDetail` (String, optional)
- `serviceUserInjured` (Boolean)
- `witnessedBy` (Enum, optional)
- `witnessedByStaffId` (Int, optional)
- `witnessDetail` (String, optional)
- `photoConsent` (Boolean)
- `photoUrl` (String, optional)
- `residentInfoProvided` (Boolean)
- `whatResidentDoing` (String, optional)
- `howIncidentHappened` (String, optional)
- `dateReportedToSeniorStaff` (DateTime, optional)
- `equipmentInvolved` (Boolean)
- `relativesInformed` (Boolean)
- `contactsCalled` (String, optional)
- `notes` (String, optional)
- `emotion` (Enum)
- `signatureUrl` (String, optional)

**Admin/Manager Only Fields (Cannot be updated by Care Worker):**
- `serviceSeekerId`
- `date`
- `time`
- `incidentTypeId`
- `locationId`

---

### 14. Medicine PRN Tasks

**Endpoint Base:** `/api/medicine-prn-tasks`

**Note:** This task type uses `applyDate` instead of `date` for filtering.

**Care Worker Updateable Fields:**
- `administrated` (Boolean)
- `notes` (String, optional)
- `completed` (Enum)
- `emotion` (Enum)

**Admin/Manager Only Fields (Cannot be updated by Care Worker):**
- `serviceSeekerId`
- `applyDate`
- `applyTime`
- `prn`
- `medicineName`
- `medicineType`
- `requestSignoffBy`
- `signoffByStaffId`

---

### 15. MUAC Tasks

**Endpoint Base:** `/api/muac-tasks`

**Care Worker Updateable Fields:**
- `time` (String)
- `muacInCm` (Float)
- `notes` (String, optional)
- `completed` (Enum)
- `emotion` (Enum)

**Admin/Manager Only Fields (Cannot be updated by Care Worker):**
- `serviceSeekerId`
- `date`

---

### 16. Observation Tasks

**Endpoint Base:** `/api/observation-tasks`

**Care Worker Updateable Fields:**
- `time` (String, optional)
- `notes` (String)
- `emotion` (Enum)

**Admin/Manager Only Fields (Cannot be updated by Care Worker):**
- `serviceSeekerId`
- `date`

---

### 17. One-to-One Tasks

**Endpoint Base:** `/api/one-to-one-tasks`

**Care Worker Updateable Fields:**
- `time` (String, optional)
- `duration` (String, optional)
- `notes` (String, optional)
- `emotion` (Enum)

**Admin/Manager Only Fields (Cannot be updated by Care Worker):**
- `serviceSeekerId`
- `date`

---

### 18. Oral Care Tasks

**Endpoint Base:** `/api/oral-care-tasks`

**Care Worker Updateable Fields:**
- `time` (String, optional)
- `oralCare` (Enum) - Check schema for available values
- `assisted` (Enum) - Check schema for available values
- `notes` (String, optional)
- `compliance` (Enum) - `COMPLETED`, `DECLINED`
- `completed` (Enum)
- `emotion` (Enum)

**Admin/Manager Only Fields (Cannot be updated by Care Worker):**
- `serviceSeekerId`
- `date`

---

### 19. Oxygen Tasks

**Endpoint Base:** `/api/oxygen-tasks`

**Care Worker Updateable Fields:**
- `time` (String)
- `quantity` (String)
- `notes` (String, optional)
- `completed` (Enum)
- `emotion` (Enum)

**Admin/Manager Only Fields (Cannot be updated by Care Worker):**
- `serviceSeekerId`
- `date`

---

### 20. Person Centred Tasks

**Endpoint Base:** `/api/person-centred-tasks`

**Care Worker Updateable Fields:**
- `time` (String, optional)
- `nameId` (Int, optional) - Person centred task name ID
- `notes` (String, optional)
- `photoUrl` (String, optional)
- `completed` (Enum)
- `emotion` (Enum)

**Admin/Manager Only Fields (Cannot be updated by Care Worker):**
- `serviceSeekerId`
- `date`

---

### 21. Physical Intervention Tasks

**Endpoint Base:** `/api/physical-intervention-tasks`

**Care Worker Updateable Fields:**
- `location` (String)
- `wereOtherStaffInvolved` (Boolean)
- `otherStaffNames` (String, optional)
- `wereOtherResidenceInvolved` (Boolean)
- `otherResidenceNamesExplanation` (String, optional)
- `wereAnyInjuriesSustained` (Boolean)
- `injuriesExplanation` (String, optional)
- `didResidenceStaffRequireMedication` (Boolean)
- `medicationExplanation` (String, optional)
- `hasAccidentBeenFilled` (Boolean)
- `accidentFilledExplanation` (String, optional)
- `accidentBookDateTime` (DateTime, optional)
- `accidentBookNumber` (String, optional)
- `detailOfPhysicalIntervention` (String)
- `techniquesUsed` (String)
- `positionOfStaffMembers` (String)
- `durationOfPhysicalIntervention` (String)
- `wereRestraintsUsed` (Boolean)
- `durationOfWholeIncident` (String)
- `wasReportedToManager` (Boolean)
- `reportedToManagerExplanation` (String, optional)
- `managerReportTime` (DateTime, optional)
- `emotion` (Enum)
- `cqcNotified` (Boolean)
- `safeguardingNotified` (Boolean)
- `familyMemberNotified` (Boolean)
- `externalProfessional` (String, optional)
- `signatureUrl` (String, optional)

**Admin/Manager Only Fields (Cannot be updated by Care Worker):**
- `serviceSeekerId`
- `date`
- `time`

---

### 22. Pulse Tasks

**Endpoint Base:** `/api/pulse-tasks`

**Care Worker Updateable Fields:**
- `time` (String)
- `pulseRate` (Int)
- `notes` (String, optional)
- `completed` (Enum)
- `emotion` (Enum)

**Admin/Manager Only Fields (Cannot be updated by Care Worker):**
- `serviceSeekerId`
- `date`

---

### 23. Reposition Tasks

**Endpoint Base:** `/api/reposition-tasks`

**Care Worker Updateable Fields:**
- `time` (String, optional)
- `position` (String, optional)
- `intactOrEpuapGrade` (String, optional)
- `photoUrl` (String, optional)
- `notes` (String, optional)
- `completed` (Enum)
- `emotion` (Enum)

**Admin/Manager Only Fields (Cannot be updated by Care Worker):**
- `serviceSeekerId`
- `date`

---

### 24. Spending Money Tasks

**Endpoint Base:** `/api/spending-money-tasks`

**Care Worker Updateable Fields:**
- `type` (Enum, optional) - Check schema for available values
- `amount` (Float, optional)
- `paidUsing` (String, optional)
- `receiptUrl` (String, optional)
- `notes` (String, optional)
- `emotion` (Enum)

**Admin/Manager Only Fields (Cannot be updated by Care Worker):**
- `serviceSeekerId`
- `date`
- `time`

---

### 25. Stool Tasks

**Endpoint Base:** `/api/stool-tasks`

**Care Worker Updateable Fields:**
- `time` (String)
- `type` (Enum, optional) - Check schema for available values
- `consistency` (Enum, optional)
- `amount` (Enum, optional)
- `notes` (String, optional)
- `completed` (Enum)
- `emotion` (Enum)

**Admin/Manager Only Fields (Cannot be updated by Care Worker):**
- `serviceSeekerId`
- `date`

---

### 26. Temperature Tasks

**Endpoint Base:** `/api/temperature-tasks`

**Care Worker Updateable Fields:**
- `time` (String)
- `temperatureInC` (Float)
- `notes` (String, optional)
- `completed` (Enum)
- `emotion` (Enum)

**Admin/Manager Only Fields (Cannot be updated by Care Worker):**
- `serviceSeekerId`
- `date`

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

**Care Worker Updateable Fields:**
- `time` (String)
- `visitType` (Enum) - Check schema for available values
- `announced` (Enum) - Check schema for available values
- `name` (String)
- `relationship` (String, optional) - For family visits
- `role` (Enum, optional) - For professional visits
- `purpose` (String)
- `summary` (String, optional)
- `completed` (Enum) - Uses VisitCompletion enum (check schema)

**Admin/Manager Only Fields (Cannot be updated by Care Worker):**
- `serviceSeekerId`
- `date`

---

### 28. Weight Tasks

**Endpoint Base:** `/api/weight-tasks`

**Care Worker Updateable Fields:**
- `time` (String)
- `weightInKg` (Float)
- `notes` (String, optional)
- `completed` (Enum)
- `emotion` (Enum)

**Admin/Manager Only Fields (Cannot be updated by Care Worker):**
- `serviceSeekerId`
- `date`

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

### Forbidden (403) - Care Worker Restrictions
```json
{
  "error": "Care workers and support workers cannot create tasks. Tasks are created automatically from schedules."
}
```

```json
{
  "error": "Care workers and support workers cannot delete tasks."
}
```

```json
{
  "error": "You do not have permission to update this task. You are not assigned to this service user."
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

3. **Read-only Fields for Care Workers**: Care workers and support workers **CANNOT** update:
   - `id`
   - `serviceSeekerId` - **BLOCKED** (set by admin)
   - `date` / `applyDate` - **BLOCKED** (set by admin)
   - `time` / `applyTime` - **BLOCKED** for some task types (check individual task documentation)
   - Admin-controlled fields (e.g., `incidentTypeId`, `locationId`, `supportListId`, `triggerId`, `medicineName`, `prn`, etc.)

4. **Role-Based Restrictions**:
   - **Care Workers/Support Workers**: Cannot create (POST) or delete (DELETE) tasks - returns 403 Forbidden
   - **Care Workers/Support Workers**: Can only view tasks for service users they have shift assignments for
   - **Care Workers/Support Workers**: Can only update task-specific data fields (completion status, notes, task measurements, emotion)

5. **Date Format**: Use ISO 8601 format for dates: `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ss.sssZ`

6. **Time Format**: Use 24-hour format: `HH:mm` (e.g., "14:30" for 2:30 PM)

7. **Enum Values**: Make sure to use exact enum values as specified in the schema. The API will return validation errors for invalid enum values.

8. **Error Responses for Care Workers**:
   - Attempting to update `serviceSeekerId`, `date`, or other blocked fields will result in a 403 Forbidden error
   - Attempting to create or delete tasks will result in a 403 Forbidden error with message: "Care workers and support workers cannot create/delete tasks"

