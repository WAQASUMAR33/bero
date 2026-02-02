# Mobile App: Care Worker Visits API Documentation

This document outlines the API implementation for the **Visits (Calendar)** feature in the mobile app and care worker dashboard. This feature allows care workers to view upcoming visits for the service user they are currently clocked in with, mark visits as completed, and report unscheduled visits.

**INTEGRATION NOTE:** This API interacts with the `ServiceSeekerCalendarEntry` model to ensure full compatibility with the Admin Dashboard's Calendar.

## Implementation Status: ✅ COMPLETE

### Files Created:
- **API Routes:**
  - `src/app/api/mobile/visits/route.js` - GET (list visits) & POST (report visit)
  - `src/app/api/mobile/visits/[id]/route.js` - GET (single visit) & PATCH (update status)
- **Frontend:**
  - `src/app/care-worker/visits/page.js` - Care worker visits page
- **Navigation:**
  - Updated `src/app/care-worker/layout.js` - Added "Visits" to navigation

---

## 1. Prerequisites & Schema Verification

The system uses the `ServiceSeekerCalendarEntry` table.
- **Model:** `ServiceSeekerCalendarEntry`
- **Key Enum:** `CalendarEntryType` (`FAMILY_VISIT`, `PROFESSIONAL_VISIT`)
- **Key Enum:** `VisitAnnounced` (`YES`, `NO`)
- **Key Enum:** `VisitCompletion` (`YES`, `NO`) - *Nullable in schema implies Pending/Scheduled.*

No schema updates are strictly required if `completed` is already nullable in `ServiceSeekerCalendarEntry`.

---

## 2. Authentication & Context

All endpoints require the standard **Bearer Token** authentication used in the app.

### Service User Context
Since the care worker can only see visits for the service user they are **currently clocked in with**, the backend must:
1.  Identify the `userId` from the JWT token.
2.  Query the `ClockInOut` table to find the **active** clock-in record (where `clockOutTime` is `null`).
3.  Extract the `serviceSeekerId` from that active record.
4.  Use this `serviceSeekerId` to filter `ServiceSeekerCalendarEntry` records.

**Error Handling:**
If the user is not clocked in, endpoints requiring service user context should return:
- **Status:** `403 Forbidden`
- **Body:** `{ "error": "User is not clocked in. Please clock in to view visits." }`

---

## 3. API Endpoints

### A. Get Visits
Fetches visits for the currently clocked-in service user.

- **Endpoint:** `GET /api/mobile/visits`
- **Description:** Returns upcoming visits (scheduled) and recent history for the current service user.

**Query Parameters:**
- `status`: `upcoming` (default), `history` (past 7 days), or `all`.

**Backend Logic:**
1.  Verify User.
2.  Find Active Clock-In -> Get `serviceSeekerId`.
3.  Query `ServiceSeekerCalendarEntry`:
    - `where`:
        - `serviceSeekerId`: (active id)
        - `entryType`: `in: ['FAMILY_VISIT', 'PROFESSIONAL_VISIT']`
    - **Filters:**
        - If `status=upcoming`: `date` >= Today AND (`completed` is NULL).
        - If `status=history`: `date` < Today OR `completed` is NOT NULL.

**Response (200 OK):**
```json
[
  {
    "id": 255,
    "serviceSeekerId": 5,
    "entryType": "PROFESSIONAL_VISIT",
    "date": "2024-02-20T00:00:00.000Z",
    "time": "14:30",
    "announced": "YES",
    "name": "Dr. Sarah Smith",
    "role": "GP",
    "purpose": "Routine Checkup",
    "summary": null,
    "completed": null, // null indicates Scheduled/Pending
    "createdAt": "2024-02-15T10:00:00.000Z"
  }
]
```

### B. Mark Visit Status
Allows the care worker to mark a scheduled visit as "Completed" (Visitor came) or "Missed" (Visitor didn't come).

- **Endpoint:** `PATCH /api/mobile/visits/:id`
- **Description:** Updates the status of a specific visit.

**Request Body:**
```json
{
  "completed": "YES", // or "NO"
  "summary": "Dr. Smith arrived on time. Routine checkup went well.",
  "time": "14:35" // Optional: update time to actual arrival
}
```

**Backend Logic:**
1.  Verify User & Active `serviceSeekerId`.
2.  Find `ServiceSeekerCalendarEntry` by `:id`.
3.  **Security Check:** Ensure entry belongs to the active `serviceSeekerId`.
4.  Update fields: `completed`, `summary`, and optionally `time`.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Visit marked as completed.",
  "data": { "id": 255, "completed": "YES", "summary": "..." }
}
```

### C. Report Unscheduled Visit (The "Unannounced" Feature)
Allows reporting a visitor that arrives **without** a prior schedule.
*These correspond to the "Unannounced" filter in the Admin Dashboard.*

- **Endpoint:** `POST /api/mobile/visits/report`
- **Description:** Creates a new visit record that is immediately marked as completed and unannounced.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "visitType": "FAMILY", // Maps to entryType: FAMILY_VISIT
  // OR "PROFESSIONAL" -> PROFESSIONAL_VISIT
  "role": null, // Required if PROFFESIONAL (e.g. "SOCIAL_WORKER")
  "relationship": "Daughter", // Required if FAMILY
  "purpose": "Bringing groceries",
  "summary": "Dropped off food for the week.",
  "time": "10:15",
  "date": "2024-02-20" // Defaults to Today
}
```

**Backend Logic:**
1.  Verify User & Active `serviceSeekerId`.
2.  Determine `entryType`:
    - If `visitType == 'FAMILY'` -> `FAMILY_VISIT`
    - If `visitType == 'PROFESSIONAL'` -> `PROFESSIONAL_VISIT`
3.  Create `ServiceSeekerCalendarEntry`:
    - `serviceSeekerId`: (active id)
    - `entryType`: (from above)
    - `announced`: `"NO"` (Crucial: This flags it as Unannounced for Admin)
    - `completed`: `"YES"` (Immediately completed)
    - `createdById`: (Current User)
    - `date`/`time`: Provided or Now.

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Unscheduled visit reported successfully.",
  "data": {
    "id": 256,
    "entryType": "FAMILY_VISIT",
    "announced": "NO",
    "completed": "YES",
    "name": "Jane Doe"
  }
}
```

---

## 4. Admin Dashboard Integration

By using the `ServiceSeekerCalendarEntry` table:
1.  **View:** All visits reported here will appear in the Admin Dashboard's Calendar.
2.  **Filter:** Admins can filter by "Unannounced" to see the specific reports created via the endpoint above.
3.  **Recent Visits:** The "Recent Visits" modal in the Admin Dashboard will automatically list these new entries.

---

## 5. Automated System (Auto-Mark)

A generic cron job/scheduled task should run periodically.

**Logic:**
1.  Find `ServiceSeekerCalendarEntry` records where:
    - `entryType` is `FAMILY_VISIT` or `PROFESSIONAL_VISIT`.
    - `date` < Current Date/Time.
    - `completed` is `NULL`.
2.  Update these records:
    - Set `completed` = `NO`.
    - Set `summary` = "System: Auto-marked as missed."

**Algorithm:**
```javascript
await prisma.serviceSeekerCalendarEntry.updateMany({
    where: {
        entryType: { in: ['FAMILY_VISIT', 'PROFESSIONAL_VISIT'] },
        date: { lt: new Date() },
        completed: null
    },
    data: {
        completed: 'NO',
        summary: "System: Auto-marked as missed."
    }
});
```

---

## 6. Notifications System ✅ IMPLEMENTED

### A. Upcoming Visit Notifications (Care Worker)
When a care worker is clocked in based on the `/api/notifications/check` polling:
- The system checks for upcoming visits (today/tomorrow) for the service user they are clocked in with.
- Creates notifications with title: `"Upcoming Visit: [Visitor Name]"`
- Links to `/care-worker/visits`

**Trigger:** Automatic polling via `POST /api/notifications/check` (called periodically by frontend).

### B. Unannounced Visit Alert (Admin)
When a care worker reports an unscheduled/unannounced visit:
- The system automatically sends a notification to **all Admin and Super Admin users**.
- Notification type: `WARNING`
- Title: `"Unannounced [Family/Professional] Visit Reported"`
- Message includes: Care worker name, visitor name, service user name.
- Links to `/admin/calendar`

**Trigger:** Immediate, upon `POST /api/mobile/visits` (report unscheduled visit).

### Files Updated:
- `src/app/api/notifications/check/route.js` - Added upcoming visit checks for care workers
- `src/app/api/mobile/visits/route.js` - Added admin notification on unannounced visit report

