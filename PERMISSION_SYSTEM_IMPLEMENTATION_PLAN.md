# Permission System Implementation Plan

## 1. Objective
Refine the permission system so that:
- **Default View Access**: All users with Admin Panel access can **view** all modules by default.
- **Restricted Write Access**: Functions to **Create**, **Edit**, or **Delete** data are restricted by default.
- **Granular Control**: The Super Admin can explicitly grant specific write permissions (Create/Edit/Delete) to specific users for specific modules.

## 2. Current Architecture Review
Your current system uses a flexible, robust permission model:
- **Permissions** follow a dot-notation structure (e.g., `users.create`, `shifts.view`).
- **Roles** (like `ADMIN`) have a set of base permissions.
- **Users** can have additional individual permissions (`UserPermission` table).
- The `src/lib/permissions.js` utility already handles "Permission Expansion" (e.g., `manage` implies `create`, `read`, `update`).

**The Logic Exists**: The backend `getAllUserPermissions` function already merges "Role Permissions" + "User Permissions". We just need to configure the data and build the UI to support the specific workflow you want.

---

## 3. Implementation Strategy

### A. Define the "View-Only" Baseline
To suggest that "all other users in the admin panel can view everything", we should define a base set of permissions for your standard Staff Roles (e.g., 'Manager', 'Office Staff').

**Action**: Update the `RoleDefinition` for these roles to include `*.view` or `*.read` for all modules.
- **Example Permissions for Base Role**:
  - `users.view`
  - `service_seekers.view`
  - `shifts.view`
  - `reports.view`
  - `holidays.view`
  - `finance.view`

### B. List of Modules & Permissions
We will standardize the modules available for granular control.

| Module Name | Permission Key Base | Actions Available |
| :--- | :--- | :--- |
| **Staff/Users** | `users` | `create`, `update`, `delete` |
| **Service Users** | `service_seekers` | `create`, `update`, `delete` |
| **Shifts/Rota** | `shifts` | `create`, `update`, `delete` |
| **Care Tasks** | `care_tasks` | `create`, `update`, `delete` |
| **Holidays** | `holidays` | `create`, `update`, `delete` |
| **Policies** | `policies` | `create`, `update`, `delete` |
| **Finance/Funders** | `finance` | `create`, `update`, `delete` |
| **Settings** | `settings` | `update` |

### C. Database & Schema
**No schema changes are required.** The existing `UserPermission` model (`userId`, `key`) is perfectly suited for this.

---

## 4. Development Steps

### Step 1: Frontend - Build the Permission Matrix
You need a new UI component in the **Add/Edit User** form in the Admin Panel (`src/app/admin/staff-management`).

**Design**:
- A table/grid interface.
- **Rows**: Modules (Staff, Service Users, Shifts, etc.).
- **Columns**: "Create", "Update", "Delete".
- **Checkboxes**: Allow the admin to toggle specific rights.

**Mockup Logic**:
```javascript
// Data structure for the UI
const availablePermissions = [
  { module: 'Staff', key: 'users', actions: ['create', 'update', 'delete'] },
  { module: 'Clients', key: 'service_seekers', actions: ['create', 'update', 'delete'] },
  // ... others
];
```

### Step 2: Backend - API Update
Update the `POST /api/users` and `PUT /api/users/[id]` endpoints.
- Currently, they accept a `permissions` array.
- Ensure the frontend sends the selected permissions from the Matrix as an array of strings (e.g., `["users.create", "shifts.delete"]`).
- Validates these permissions are stored in the `UserPermission` table.

### Step 3: Frontend - Protect Buttons & Actions
Wrap "Action Buttons" (Add, Edit, Delete) with a permission check.
- **Helper Function**: Use the existing `hasPermission()` from `src/lib/permissions.js`.

**Example Usage**:
```jsx
// In Staff List Page
import { hasPermission } from '@/lib/permissions';

// ... inside component
{hasPermission(currentUser, 'users.create') && (
  <button onClick={handleAddUser}>Add New Staff</button>
)}

{hasPermission(currentUser, 'users.delete') && (
   <button onClick={handleDelete}>Delete</button>
)}
```

### Step 4: Middleware/API Security
Ensure every API Route (`route.js`) verifies specific permissions, not just "Is Admin".

**Example Pattern**:
```javascript
// src/app/api/users/route.js (POST)
export async function POST(req) {
  // ... auth check ...
  if (!hasPermission(currentUser, 'users.create')) {
     return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  // ... proceed ...
}
```

---

## 5. Migration Plan
1.  **Seed Roles**: Update your `RoleDefinition` seed to ensure non-Admin roles have broadly defined `view` permissions but NO `create/update/delete` permissions.
2.  **Update Admin UI**: Build the Permission Matrix component described in Step 1.
3.  **Apply Logic**: Go through key pages (Staff, Rota, Clients) and wrap "Add/Edit" buttons in permission checks.
