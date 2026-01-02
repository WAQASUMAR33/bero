# Emergency Button API Documentation

## Overview

The Emergency Button API allows care workers to trigger emergency alerts from the mobile app. These alerts are immediately visible to managers, admins, and HR staff on the web portal with sound notifications.

---

## Authentication

All endpoints require JWT authentication via Bearer token:

```
Authorization: Bearer <token>
```

---

## Endpoints

### 1. Trigger Emergency Alert

**Endpoint:** `POST /api/emergency`

**Description:** Care workers can trigger an emergency alert from the mobile app.

**Request Body:**
```json
{
  "location": "51.5074, -0.1278",  // Optional: GPS coordinates or location string
  "message": "Need immediate assistance"  // Optional: Additional message
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "triggeredBy": 5,
    "teamId": 2,
    "status": "ACTIVE",
    "location": "51.5074, -0.1278",
    "message": "Need immediate assistance",
    "acknowledgedBy": null,
    "acknowledgedAt": null,
    "resolvedAt": null,
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z",
    "triggeredByUser": {
      "id": 5,
      "firstName": "John",
      "lastName": "Doe",
      "phoneNo": "+1234567890",
      "email": "john.doe@example.com",
      "profilePic": "https://..."
    },
    "team": {
      "id": 2,
      "name": "Team Alpha"
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - User not found
- `500 Internal Server Error` - Server error

---

### 2. Get Emergency Alerts

**Endpoint:** `GET /api/emergency`

**Description:** Retrieve emergency alerts (for managers, admins, HR on web portal).

**Query Parameters:**
- `status` (optional) - Filter by status: `ACTIVE`, `ACKNOWLEDGED`, `RESOLVED`
- `teamId` (optional) - Filter by team ID
- `unreadOnly` (optional) - Set to `true` to get only ACTIVE and ACKNOWLEDGED alerts

**Example Requests:**
```
GET /api/emergency
GET /api/emergency?status=ACTIVE
GET /api/emergency?unreadOnly=true
GET /api/emergency?teamId=2
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "triggeredBy": 5,
      "teamId": 2,
      "status": "ACTIVE",
      "location": "51.5074, -0.1278",
      "message": "Need immediate assistance",
      "acknowledgedBy": null,
      "acknowledgedAt": null,
      "resolvedAt": null,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z",
      "triggeredByUser": {
        "id": 5,
        "firstName": "John",
        "lastName": "Doe",
        "phoneNo": "+1234567890",
        "email": "john.doe@example.com",
        "profilePic": "https://...",
        "role": {
          "name": "CAREWORKER",
          "displayName": "Care Worker"
        }
      },
      "acknowledgedByUser": null,
      "team": {
        "id": 2,
        "name": "Team Alpha"
      }
    }
  ],
  "activeCount": 1,
  "unreadCount": 1
}
```

**Permissions:**
- **ADMIN, DIRECTOR, HR, REGISTER_MANAGER**: Can view all emergency alerts
- **Team Managers**: Can view emergencies from their team only
- **Other roles**: Cannot view emergency alerts

---

### 3. Get Single Emergency Alert

**Endpoint:** `GET /api/emergency/[id]`

**Description:** Get details of a specific emergency alert.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "triggeredBy": 5,
    "teamId": 2,
    "status": "ACTIVE",
    "location": "51.5074, -0.1278",
    "message": "Need immediate assistance",
    "triggeredByUser": { ... },
    "acknowledgedByUser": null,
    "team": { ... }
  }
}
```

---

### 4. Acknowledge Emergency Alert

**Endpoint:** `PUT /api/emergency/[id]`

**Description:** Acknowledge an active emergency alert (changes status from ACTIVE to ACKNOWLEDGED).

**Request Body:**
```json
{
  "action": "acknowledge"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "ACKNOWLEDGED",
    "acknowledgedBy": 10,
    "acknowledgedAt": "2025-01-15T10:35:00.000Z",
    ...
  }
}
```

**Error Responses:**
- `400 Bad Request` - Alert is not in ACTIVE status
- `403 Forbidden` - User doesn't have permission to manage this alert

---

### 5. Resolve Emergency Alert

**Endpoint:** `PUT /api/emergency/[id]`

**Description:** Resolve an emergency alert (changes status to RESOLVED).

**Request Body:**
```json
{
  "action": "resolve"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "RESOLVED",
    "resolvedAt": "2025-01-15T10:40:00.000Z",
    ...
  }
}
```

**Note:** If the alert is ACTIVE, it will be automatically acknowledged before being resolved.

---

## Emergency Alert Statuses

1. **ACTIVE** - Emergency alert is active and requires immediate attention
2. **ACKNOWLEDGED** - Alert has been acknowledged by a manager/admin/HR
3. **RESOLVED** - Emergency has been resolved

---

## Mobile App Integration

### Triggering Emergency from Mobile App

```javascript
// Example: Trigger emergency alert
const triggerEmergency = async (location, message) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/emergency', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        location: location, // e.g., "51.5074, -0.1278" or "123 Main St"
        message: message || null
      })
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('Emergency alert triggered:', data.data);
      // Show success message to user
    } else {
      console.error('Failed to trigger emergency:', data.error);
    }
  } catch (error) {
    console.error('Error triggering emergency:', error);
  }
};

// Usage
triggerEmergency("51.5074, -0.1278", "Need immediate assistance");
```

---

## Web Portal Integration

### Real-time Updates

The web portal automatically polls for emergency alerts every 5 seconds. When an active emergency is detected:

1. **Visual Indicator**: Emergency button in header shows red badge with count
2. **Sound Alert**: Automatic beeping sound plays (using Web Audio API)
3. **Modal Display**: Clicking emergency button shows all active/acknowledged alerts
4. **Actions Available**:
   - Acknowledge alert
   - Resolve alert
   - View details (user, location, message, time)

### Permissions

- **ADMIN, DIRECTOR, HR, REGISTER_MANAGER**: Can view and manage all emergencies
- **Team Managers**: Can view and manage emergencies from their team
- **Care Workers**: Cannot view emergencies (only trigger them)

---

## Best Practices

1. **Location**: Always include GPS coordinates when available for faster response
2. **Message**: Provide clear, concise message about the emergency
3. **Acknowledgment**: Managers should acknowledge alerts promptly
4. **Resolution**: Mark alerts as resolved once the situation is handled
5. **Team Assignment**: Ensure all care workers are assigned to teams for proper routing

---

## Error Handling

All endpoints return standard error responses:

```json
{
  "error": "Error message",
  "details": "Additional error details (in development)"
}
```

Common HTTP status codes:
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Notes

- Emergency alerts are automatically associated with the care worker's team
- Sound notifications only play for active (unacknowledged) emergencies
- Alerts are automatically filtered by team for non-admin users
- The system supports multiple concurrent emergency alerts

