# Policy and Procedures API Documentation for Care Worker App

This document details the API endpoints for accessing and signing Policy and Procedure documents in the Care Worker mobile application.

## Overview

The Policies API allows care workers to:
1.  **View All Policies**: List available policies, including their signed status.
2.  **View Document**: Access the PDF/document file via a URL.
3.  **Sign Policy**: Acknowledge reading and understanding a policy.

Care workers share the same `policy` database as the web admin but have read-only access (except for signing).

---

## 1. List All Policies

Retrieves a list of all policies. The response includes a `isSigned` boolean indicating if the currently authenticated user has already signed the policy.

**Endpoint:** `GET /api/policies`

**Headers:**
- `Authorization`: `Bearer <token>`

**Response Body:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Health and Safety Policy",
      "fileName": "HS_Policy_2025.pdf",
      "fileUrl": "https://storage.example.com/policies/HS_Policy_2025.pdf",
      "reviewIn": 365,
      "lastReviewed": "2025-01-15T10:00:00.000Z",
      "createdAt": "2025-01-01T12:00:00.000Z",
      "updatedAt": "2025-01-15T14:30:00.000Z",
      "createdBy": {
        "id": 5,
        "firstName": "Admin",
        "lastName": "User",
        "email": "admin@example.com"
      },
      "updatedBy": {
        "id": 5,
        "firstName": "Admin",
        "lastName": "User",
        "email": "admin@example.com"
      },
      "signedCount": 12,
      "totalStaffCount": 50,
      "reviewCount": 1,
      "isSigned": true  // TRUE if the current user has signed it, FALSE otherwise
    },
    {
      "id": 2,
      "name": "Fire Safety Procedure",
      "fileName": "Fire_Safety_v2.pdf",
      "fileUrl": "https://storage.example.com/policies/Fire_Safety_v2.pdf",
      "reviewIn": 180,
      "lastReviewed": null,
      "createdAt": "2025-02-01T09:00:00.000Z",
      "updatedAt": "2025-02-01T09:00:00.000Z",
      "createdBy": { ... },
      "updatedBy": { ... },
      "signedCount": 0,
      "totalStaffCount": 50,
      "reviewCount": 0,
      "isSigned": false // FALSE means the user needs to sign this
    }
  ]
}
```

### Implementation Notes for App:
-   **Display**: Show the list of policies.
-   **Status Indicator**: Use `isSigned` to show a "Checkmark/Signed" icon or a "Pending/To Sign" alert.
-   **Action**: Tapping a policy should open the `fileUrl` (PDF viewer or external browser) and offer a "Sign Policy" button if `isSigned` is false.

---

## 2. Sign a Policy

Allows the authenticated care worker to sign (acknowledge) a specific policy.

**Endpoint:** `POST /api/policies/:id/sign`

**Path Parameters:**
-   `:id` - The ID of the policy (e.g., `1`).

**Headers:**
-   `Content-Type`: `application/json`
-   `Authorization`: `Bearer <token>`

**Request Body:**
(Empty body is acceptable, or `{}`. The backend uses the token to identify the user.)

**Response Body (Success):**

```json
{
  "success": true,
  "data": {
    "id": 15,
    "userId": 101, // ID of the care worker
    "signedAt": "2026-01-29T18:45:00.000Z",
    "user": {
      "id": 101,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com"
    }
  }
}
```

**Response Body (Error - Already Signed):**
```json
{
  "success": false,
  "error": "You have already signed this policy"
}
```

---

## 3. View Document

The `fileUrl` provided in the list endpoint is a direct link to the uploaded document.

-   **Action**: Use a webview or external browser to open this URL.
-   **Note**: If `fileUrl` is `null`, the document has not been uploaded yet by the admin.
