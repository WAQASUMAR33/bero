# API Endpoint Summary

## Authentication

### Login
- **POST** `/api/auth/login`
- **Body**
  ```json
  {
    "email": "user@example.com",
    "password": "secret"
  }
  ```
- **Response**
  ```json
  {
    "success": true,
    "user": { ... },
    "token": "JWT"
  }
  ```

## Rota Management

### List Shifts
- **GET** `/api/shifts`
- **Query Parameters**
  - `view=my` | `all` (default)
  - `date=YYYY-MM-DD`
  - `week=YYYY-MM-DD`
- **Headers** `Authorization: Bearer <token>`

### Create Shift
- **POST** `/api/shifts`
- **Body**
  ```json
  {
    "serviceSeekerId": 12,
    "fromDate": "2025-01-14T08:00:00.000Z",
    "untilDate": "2025-02-14T08:00:00.000Z",
    "recurrence": "WEEK",
    "startTime": "08:00",
    "endTime": "16:00",
    "shiftTypeId": 3,
    "totalStaffRequired": 2,
    "funderId": 5,
    "timeCritical": true,
    "shiftRunId": 4,
    "notesForCarers": "Arrive 15 minutes early for handover",
    "notesForManager": "Check medication stock before shift",
    "assignedUserIds": [21, 33]
  }
  ```

## Daily Tasks

All endpoints require `Authorization: Bearer <token>` and accept/return `application/json`.

| Task | List Endpoint | Create Endpoint | Sample Payload |
| --- | --- | --- | --- |
| Bathing | `GET /api/bathing-tasks?serviceSeekerId={id}` | `POST /api/bathing-tasks` | ```{"serviceSeekerId":12,"date":"2025-01-14T08:00:00.000Z","time":"08:15","bathingType":"SHOWER","compliance":"COMPLETED","stoolPassed":false,"urinePassed":true,"bathNotes":"No issues","catheterChecked":true,"completed":"YES","emotion":"HAPPY"}``` |
| Behaviour | `GET /api/behaviour-tasks?serviceSeekerId={id}` | `POST /api/behaviour-tasks` | ```{"serviceSeekerId":12,"date":"2025-01-14T10:00:00.000Z","time":"10:00","type":"AGGRESSION_HITTING_BITING","triggerId":5,"othersInvolved":true,"othersInvolvedDetails":"Another resident","antecedents":"Argument over TV","behaviour":"Hitting","consequences":"Redirected","careIntervention":"De-escalation","emotion":"SAD"}``` |
| Blood Pressure | `GET /api/blood-pressure-tasks?serviceSeekerId={id}` | `POST /api/blood-pressure-tasks` | ```{"serviceSeekerId":12,"date":"2025-01-14T09:30:00.000Z","time":"09:30","systolicPressure":120,"diastolicPressure":78,"notes":"Within range","completed":"YES","emotion":"NEUTRAL"}``` |
| Blood Test | `GET /api/blood-test-tasks?serviceSeekerId={id}` | `POST /api/blood-test-tasks` | ```{"serviceSeekerId":12,"date":"2025-01-14T07:30:00.000Z","time":"07:30","when":"BEFORE_BREAKFAST","bloodGlucose":5.6,"insulinGiven":"Humalog 6u","sideAdministered":"LEFT","note":"No issues","completed":"YES","emotion":"NEUTRAL"}``` |
| Comfort Check | `GET /api/comfort-check-tasks?serviceSeekerId={id}` | `POST /api/comfort-check-tasks` | ```{"serviceSeekerId":12,"date":"2025-01-14T11:00:00.000Z","time":"11:00","allNeedsMet":true,"catheterCheck":true,"incontinencePadCheck":true,"personalHygiene":true,"repositioned":true,"sleep":false,"stomaCheck":false,"toileted":true,"stoolPassed":true,"urinePassed":true,"notes":"Resident comfortable","completed":"YES","emotion":"HAPPY"}``` |
| Communication | `GET /api/communication-notes-tasks?serviceSeekerId={id}` | `POST /api/communication-notes-tasks` | ```{"serviceSeekerId":12,"date":"2025-01-14T14:00:00.000Z","notes":"Positive call with family","emotion":"HAPPY"}``` |
| Family Photo | `GET /api/family-photo-message-tasks?serviceSeekerId={id}` | `POST /api/family-photo-message-tasks` | ```{"serviceSeekerId":12,"date":"2025-01-14T15:30:00.000Z","time":"15:30","description":"Video call","messageFromResidence":"Doing well","photoUrl":null,"emotion":"HAPPY"}``` |
| Food & Drink | `GET /api/food-drink-tasks?serviceSeekerId={id}` | `POST /api/food-drink-tasks` | ```{"serviceSeekerId":12,"date":"2025-01-14T12:00:00.000Z","time":"LUNCH","foodDrinkOffer":"Soup + Sandwich","main":"ALL","fluidIntake":250,"comments":"Ate everything","assistance":"REQUIRED","foodDrinkOffered":"YES","pictureUrl":null,"completed":"YES","emotion":"HAPPY"}``` |
| General Support | `GET /api/general-support-tasks?serviceSeekerId={id}` | `POST /api/general-support-tasks` | ```{"serviceSeekerId":12,"date":"2025-01-14T13:30:00.000Z","time":"13:30","notes":"Helped with laundry","supportListId":3,"emotion":"HAPPY"}``` |
| House Keeping | `GET /api/house-keeping-tasks?serviceSeekerId={id}` | `POST /api/house-keeping-tasks` | ```{"serviceSeekerId":12,"date":"2025-01-14T16:00:00.000Z","time":"16:00","task":"Bedroom tidy","notes":"Changed bedding","photoUrl":null,"completed":"YES","emotion":"HAPPY"}``` |
| Incident/Fall | `GET /api/incident-fall-tasks?serviceSeekerId={id}` | `POST /api/incident-fall-tasks` | ```{"serviceSeekerId":12,"date":"2025-01-14T18:20:00.000Z","time":"18:20","incidentTypeId":7,"incidentLasted":"2 minutes","locationId":4,"othersInvolved":false,"injuryDetail":null,"serviceUserInjured":"NO","witnessedBy":"STAFF","witnessedByStaffId":21,"witnessDetail":"Care worker Jane","photoConsent":"NO","photoUrl":null,"residentInfoProvided":"YES","whatResidentDoing":"Walking to lounge","howIncidentHappened":"Slipped on wet floor","dateReportedToSeniorStaff":"2025-01-14T18:30:00.000Z","equipmentInvolved":"NO","relativesInformed":"YES","contactsCalled":"MANAGER","notes":"Cleaned and observed, no injury","emotion":"SAD","signatureUrl":null}``` |
| Medicine PRN | `GET /api/medicine-prn-tasks?serviceSeekerId={id}` | `POST /api/medicine-prn-tasks` | ```{"serviceSeekerId":12,"applyDate":"2025-01-14T19:00:00.000Z","applyTime":"19:00","prn":"Pain relief","medicineName":"Paracetamol","medicineType":"TABLET","administrated":true,"notes":"Given for headache","requestSignoffBy":"NOT_NEEDED","signoffByStaffId":null,"completed":"YES","emotion":"NEUTRAL"}``` |
| MUAC | `GET /api/muac-tasks?serviceSeekerId={id}` | `POST /api/muac-tasks` | ```{"serviceSeekerId":12,"date":"2025-01-14T08:30:00.000Z","time":"08:30","muacInCm":27.5,"notes":"Stable","completed":"YES","emotion":"NEUTRAL"}``` |
| Observation | `GET /api/observation-tasks?serviceSeekerId={id}` | `POST /api/observation-tasks` | ```{"serviceSeekerId":12,"date":"2025-01-14T17:00:00.000Z","time":"17:00","notes":"Resident appeared anxious before dinner","emotion":"SAD"}``` |
| One-to-One | `GET /api/one-to-one-tasks?serviceSeekerId={id}` | `POST /api/one-to-one-tasks` | ```{"serviceSeekerId":12,"date":"2025-01-14T11:15:00.000Z","time":"11:15","duration":"45 minutes","notes":"Garden walk and chat","emotion":"HAPPY"}``` |
| Oral Care | `GET /api/oral-care-tasks?serviceSeekerId={id}` | `POST /api/oral-care-tasks` | ```{"serviceSeekerId":12,"date":"2025-01-14T07:00:00.000Z","time":"07:00","oralCare":"BRUSHED_TEETH","assisted":"ASSISTED","notes":"Assisted with brushing","compliance":"COMPLETED","completed":"YES","emotion":"NEUTRAL"}``` |
| Oxygen | `GET /api/oxygen-tasks?serviceSeekerId={id}` | `POST /api/oxygen-tasks` | ```{"serviceSeekerId":12,"date":"2025-01-14T09:00:00.000Z","time":"09:00","quantity":"2L/min","notes":"No issues","completed":"YES","emotion":"NEUTRAL"}``` |
| Person Centred | `GET /api/person-centred-tasks?serviceSeekerId={id}` | `POST /api/person-centred-tasks` | ```{"serviceSeekerId":12,"date":"2025-01-14T10:30:00.000Z","time":"10:30","nameId":2,"notes":"Craft activity","photoUrl":null,"completed":"YES","emotion":"HAPPY"}``` |
| Physical Intervention | `GET /api/physical-intervention-tasks?serviceSeekerId={id}` | `POST /api/physical-intervention-tasks` | *(See form for full payload – many yes/no fields)* |
| Pulse | `GET /api/pulse-tasks?serviceSeekerId={id}` | `POST /api/pulse-tasks` | ```{"serviceSeekerId":12,"date":"2025-01-14T08:45:00.000Z","time":"08:45","pulseRate":78,"notes":"Normal range","completed":"YES","emotion":"NEUTRAL"}``` |
| Reposition | `GET /api/reposition-tasks?serviceSeekerId={id}` | `POST /api/reposition-tasks` | ```{"serviceSeekerId":12,"date":"2025-01-14T02:00:00.000Z","time":"02:00","position":"LEFT","intactOrEpuapGrade":"INTACT","notes":"Minor redness observed","photoUrl":null,"completed":"YES","emotion":"NEUTRAL"}``` |
| Spending Money | `GET /api/spending-money-tasks?serviceSeekerId={id}` | `POST /api/spending-money-tasks` | ```{"serviceSeekerId":12,"date":"2025-01-14T16:30:00.000Z","time":"16:30","type":"GENERAL_PURCHASE","amount":15.5,"paidUsing":"CASH","receiptUrl":null,"notes":"Cafe treat","completed":"YES","emotion":"HAPPY"}``` |
| Stool | `GET /api/stool-tasks?serviceSeekerId={id}` | `POST /api/stool-tasks` | ```{"serviceSeekerId":12,"date":"2025-01-14T07:15:00.000Z","time":"07:15","type":"SAUSAGE_BUT_CRACK_ON_SURFACE","urinePassed":"YES","notes":"Normal","completed":"YES","emotion":"NEUTRAL"}``` |
| Temperature | `GET /api/temperature-tasks?serviceSeekerId={id}` | `POST /api/temperature-tasks` | ```{"serviceSeekerId":12,"date":"2025-01-14T08:00:00.000Z","time":"08:00","temperatureInC":36.7,"notes":"Normal","completed":"YES","emotion":"NEUTRAL"}``` |
| Visit | `GET /api/visit-tasks?serviceSeekerId={id}` | `POST /api/visit-tasks` | ```{"serviceSeekerId":12,"date":"2025-01-14T15:00:00.000Z","time":"15:00","visitType":"FAMILY","announced":"YES","name":"Jane Doe","relationship":"Daughter","role":null,"purpose":"Check-in","summary":"Pleasant visit","completed":"YES"}``` |
| Weight | `GET /api/weight-tasks?serviceSeekerId={id}` | `POST /api/weight-tasks` | ```{"serviceSeekerId":12,"date":"2025-01-14T09:00:00.000Z","time":"09:00","weight":72.4,"notes":"Up 0.3kg","completed":"YES","emotion":"NEUTRAL"}``` |

## Messaging

All messaging endpoints require `Authorization: Bearer <token>` and use Prisma conversation/message models.

### List Conversations
- **GET** `/api/conversations`
- **Response**
  ```json
  {
    "conversations": [
      {
        "id": 3,
        "participants": [
          {
            "id": 7,
            "userId": 1,
            "lastReadAt": "2025-01-14T10:00:00.000Z",
            "user": { "id": 1, "firstName": "Super", "lastName": "Admin", "email": "admin@gmail.com", "profilePic": null }
          },
          {
            "id": 8,
            "userId": 21,
            "lastReadAt": "2025-01-14T09:55:00.000Z",
            "user": { "id": 21, "firstName": "Alice", "lastName": "Smith", "email": "alice@example.com", "profilePic": null }
          }
        ],
        "lastMessage": {
          "id": 101,
          "content": "Morning! Are we still on for the visit?",
          "senderId": 21,
          "createdAt": "2025-01-14T09:54:00.000Z"
        },
        "unreadCount": 0,
        "updatedAt": "2025-01-14T09:54:00.000Z"
      }
    ]
  }
  ```

### Start Conversation
- **POST** `/api/conversations`
- **Body**
  ```json
  {
    "userId": 21
  }
  ```
- Returns existing conversation if one already exists with the same two participants.

### List Messages in a Conversation
- **GET** `/api/conversations/{conversationId}/messages`
- Marks messages as read and updates `lastReadAt` for the current user.
- **Response**
  ```json
  {
    "messages": [
      {
        "id": 200,
        "conversationId": 3,
        "senderId": 1,
        "content": "Hi Alice, how are you today?",
        "isRead": true,
        "createdAt": "2025-01-14T09:50:00.000Z",
        "sender": { "id": 1, "firstName": "Super", "lastName": "Admin", "email": "admin@gmail.com" }
      },
      {
        "id": 201,
        "conversationId": 3,
        "senderId": 21,
        "content": "Morning! Are we still on for the visit?",
        "isRead": true,
        "createdAt": "2025-01-14T09:54:00.000Z",
        "sender": { "id": 21, "firstName": "Alice", "lastName": "Smith", "email": "alice@example.com" }
      }
    ]
  }
  ```

### Send Message
- **POST** `/api/conversations/{conversationId}/messages`
- **Body**
  ```json
  {
    "content": "See you at 3pm!"
  }
  ```
- **Response**
  ```json
  {
    "message": {
      "id": 202,
      "conversationId": 3,
      "senderId": 1,
      "content": "See you at 3pm!",
      "isRead": false,
      "createdAt": "2025-01-14T10:05:00.000Z",
      "sender": { "id": 1, "firstName": "Super", "lastName": "Admin", "email": "admin@gmail.com" }
    }
  }
  ```

## Staff Management

All staff endpoints require `Authorization: Bearer <token>` and use Prisma user models.

### List Staff (for Dropdown)
- **GET** `/api/users`
- **Response**
  ```json
  [
    {
      "id": 21,
      "firstName": "Alice",
      "lastName": "Smith",
      "email": "alice@example.com",
      "username": "alice.smith",
      "phoneNo": "1234567890",
      "status": "CURRENT",
      "roleId": 2,
      "role": {
        "id": 2,
        "name": "CAREWORKER",
        "displayName": "Care Worker"
      },
      "region": {
        "id": 1,
        "title": "North Region",
        "code": "NR"
      },
      "profilePic": null,
      "employeeNumber": "EMP001",
      "startDate": "2024-01-01T00:00:00.000Z",
      "leaveDate": null,
      "regionId": 1,
      "permissions": [],
      "team": [],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-14T00:00:00.000Z"
    },
    {
      "id": 33,
      "firstName": "Bob",
      "lastName": "Jones",
      "email": "bob@example.com",
      "username": "bob.jones",
      "phoneNo": "0987654321",
      "status": "CURRENT",
      "roleId": 2,
      "role": {
        "id": 2,
        "name": "CAREWORKER",
        "displayName": "Care Worker"
      },
      "region": {
        "id": 1,
        "title": "North Region",
        "code": "NR"
      },
      "profilePic": null,
      "employeeNumber": "EMP002",
      "startDate": "2024-01-15T00:00:00.000Z",
      "leaveDate": null,
      "regionId": 1,
      "permissions": [],
      "team": [],
      "createdAt": "2024-01-15T00:00:00.000Z",
      "updatedAt": "2024-01-15T00:00:00.000Z"
    }
  ]
  ```
- **Usage**: Use this endpoint to populate a staff dropdown. When a staff member is selected, use their `id` field as the `userId` in subsequent API calls (e.g., when assigning staff to shifts, use `assignedUserIds: [21, 33]`).

### Get Staff Member by ID
- **GET** `/api/users/{userId}`
- **Response**
  ```json
  {
    "id": 21,
    "firstName": "Alice",
    "lastName": "Smith",
    "email": "alice@example.com",
    "username": "alice.smith",
    "phoneNo": "1234567890",
    "status": "CURRENT",
    "roleId": 2,
    "role": {
      "id": 2,
      "name": "CAREWORKER",
      "displayName": "Care Worker"
    },
    "region": {
      "id": 1,
      "title": "North Region",
      "code": "NR"
    },
    "profilePic": null,
    "employeeNumber": "EMP001",
    "startDate": "2024-01-01T00:00:00.000Z",
    "leaveDate": null,
    "regionId": 1,
    "permissions": [],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-14T00:00:00.000Z"
  }
  ```
- **Usage**: Fetch a specific staff member by their user ID. The `id` field is the `userId` used in other API calls.


