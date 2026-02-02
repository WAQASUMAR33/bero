# Admin Notification System Documentation

This document outlines all implemented notification triggers for both Admin/Manager users and Care Workers.

## Implementation Status: ✅ COMPLETE

---

## 1. High Priority Notifications

### A. 🚨 Emergency Alert (Admin)
**Trigger:** When a care worker triggers an emergency alert  
**Recipients:** All ADMIN, DIRECTOR, HR, REGISTER_MANAGER users  
**File:** `src/app/api/emergency/route.js`  
**Link:** `/admin/emergency-reports`  
**Type:** ERROR (Red)

### B. ⏰ Late Clock-In Alert (Admin)
**Trigger:** When a care worker clocks in more than 15 minutes after their shift was scheduled to start  
**Recipients:** All ADMIN, DIRECTOR, HR, REGISTER_MANAGER users  
**File:** `src/app/api/clock-in-out/clock-in/route.js`  
**Link:** `/admin/clock-in-out`  
**Type:** WARNING (Amber)

### C. ⏰ Missed Shift Alert (Admin)
**Trigger:** Automatically detected when a shift started 30+ minutes ago with no clock-in  
**Recipients:** Admin/Manager who is logged in  
**File:** `src/app/api/notifications/admin-check/route.js`  
**Link:** `/admin/clock-in-out`  
**Type:** WARNING (Amber)

### D. 📝 Handover Submitted (Admin & Care Worker)
**Trigger:** When a care worker submits a handover note  
**Recipients:**
- Receiving care worker (INFO)
- All ADMIN, DIRECTOR, REGISTER_MANAGER users (INFO)

**File:** `src/app/api/handovers/route.js`  
**Links:** `/care-worker/handover`, `/admin/handovers`  
**Type:** INFO (Blue)

### E. 👤 New Staff Member Registered (Admin/HR)
**Trigger:** When a new user/staff member is created  
**Recipients:** All ADMIN, HR, DIRECTOR users  
**File:** `src/app/api/users/route.js`  
**Link:** `/admin/staff-management`  
**Type:** INFO (Blue)

---

## 2. Medium Priority Notifications

### A. 📋 New Policy Uploaded (Care Workers)
**Trigger:** When an admin uploads a new policy  
**Recipients:** All CARE_WORKER users  
**File:** `src/app/api/policies/route.js`  
**Link:** `/care-worker/policies`  
**Type:** INFO (Blue)

### B. 📋 Pending Policy Signature Reminder (Care Worker)
**Trigger:** Automatic daily check for unsigned policies  
**Recipients:** Each care worker with unsigned policies (once per day)  
**File:** `src/app/api/notifications/check/route.js`  
**Link:** `/care-worker/policies`  
**Type:** WARNING (Amber)

### C. 🗓️ New Shift Assigned (Care Worker)
**Trigger:** When a shift is created with assigned care workers  
**Recipients:** All assigned care workers  
**File:** `src/app/api/shifts/route.js`  
**Link:** `/care-worker/rota`  
**Type:** INFO (Blue)

### D. 📅 Pending Holiday Requests (Admin)
**Trigger:** Automatic check for pending holiday approvals  
**Recipients:** Admin/Manager who is logged in  
**File:** `src/app/api/notifications/admin-check/route.js`  
**Link:** `/admin/holidays`  
**Type:** INFO (Blue)

### E. 🚨 Active Emergency Alerts (Admin)
**Trigger:** Automatic check for unresolved emergencies  
**Recipients:** Admin/Manager who is logged in  
**File:** `src/app/api/notifications/admin-check/route.js`  
**Link:** `/admin/emergency-reports`  
**Type:** ERROR (Red)

---

## 3. Existing Notifications (Previously Implemented)

### A. 📅 Upcoming Shift Reminder (Care Worker)
**Trigger:** Shift starting within 2 hours  
**Recipients:** Assigned care worker  
**File:** `src/app/api/notifications/check/route.js`  
**Link:** `/care-worker/rota`

### B. 📅 Upcoming Visit Reminder (Care Worker)
**Trigger:** Visit scheduled for today/tomorrow when clocked in with service user  
**Recipients:** Clocked-in care worker  
**File:** `src/app/api/notifications/check/route.js`  
**Link:** `/care-worker/visits`

### C. 📅 Unannounced Visit Alert (Admin)
**Trigger:** When a care worker reports an unscheduled/unannounced visit  
**Recipients:** All ADMIN, SUPER_ADMIN users  
**File:** `src/app/api/mobile/visits/route.js`  
**Link:** `/admin/calendar`

### D. 📅 Holiday Approved/Rejected (Care Worker)
**Trigger:** When admin approves or rejects a holiday request  
**Recipients:** Care worker who requested  
**Files:** `src/app/api/holidays/[id]/approve/route.js`, `src/app/api/holidays/[id]/reject/route.js`  
**Link:** `/care-worker/holidays`

---

## Notification Check Endpoints

### Care Worker Check: `POST /api/notifications/check`
Called by the care worker dashboard every 45 seconds (optimized from 30s):
- Checks for upcoming shifts (next 2 hours)
- Checks for upcoming visits (if clocked in)
- Checks for unsigned policies (once per day)

### Admin Check: `POST /api/notifications/admin-check`
Called by the admin dashboard on load (5s delay) and every 2 minutes:
- Checks for missed shifts (not clocked in 30+ mins after start)
- Checks for active emergency alerts
- Checks for pending holiday requests

---

## Performance Optimizations

All notification endpoints have been optimized to minimize database load:

### Query Optimizations
- **Batched reads**: Use `$transaction` to combine multiple reads into single DB call
- **Parallel execution**: Multiple independent queries run simultaneously
- **Raw SQL for joins**: Complex queries use raw SQL to avoid N+1 problems
- **Selective fields**: Only fetch required fields with `select`
- **Result limits**: All queries have `take` limits (typically 10-50)

### Write Optimizations
- **Batch creates**: Use `createMany` with `skipDuplicates: true`
- **Chunked writes**: Large batches (>100) are processed in chunks
- **Deduplication**: Check existing notifications before creating new ones

### Rate Limiting
- **Polling intervals**: Increased from 30s to 45-60s for regular checks
- **Admin check cooldown**: 2-minute minimum between admin checks
- **Delayed initial load**: Admin check delayed 5s after page load
- **Client-side rate limiting**: useEffect cleanup prevents duplicate calls

### Memory Optimizations
- **Set-based lookups**: O(1) lookups for existing notifications
- **In-memory filtering**: Filter data in JavaScript vs. additional DB queries
- **Limited result sets**: Cap results to prevent memory issues

---

## Notification Types

| Type | Color | Use Case |
|------|-------|----------|
| INFO | Blue | General information, new assignments |
| WARNING | Amber | Attention needed, late arrivals, pending items |
| ERROR | Red | Critical issues, emergencies |
| SUCCESS | Green | Completed actions |

---

## Files Modified

1. `src/app/api/emergency/route.js` - Emergency notification to admins
2. `src/app/api/handovers/route.js` - Handover notification to admins
3. `src/app/api/policies/route.js` - Policy notification to care workers
4. `src/app/api/shifts/route.js` - Shift assignment notification
5. `src/app/api/users/route.js` - New staff notification
6. `src/app/api/clock-in-out/clock-in/route.js` - Late clock-in notification (already existed)
7. `src/app/api/notifications/check/route.js` - Optimized with batch queries
8. `src/app/api/notifications/admin-check/route.js` (NEW) - Optimized admin checks
9. `src/app/admin/components/Header.js` - Rate-limited polling

---

## Future Enhancements

The following features could be added in future iterations:

1. **Low PPE Stock Alert** - Notify admins when stock is below threshold
2. **New Maintenance Request** - Notify admins about new maintenance items
3. **Shift Cancelled/Changed** - Notify care workers about schedule changes
4. **Service User Status Changed** - Notify assigned care workers
5. **Audit/Inspection Reminders** - Quality assurance notifications

