# New Beeru - Care Management System

New Beeru is a comprehensive Care Management System designed to streamline operations for care providers. It facilitates the management of staff (care workers), service seekers (clients), shifts, rote scheduling, and daily care tasks.

## Table of Contents
- [Overview](#overview)
- [Key Features](#key-features)
  - [For Care Workers](#for-care-workers)
  - [For Admins & HR](#for-admins--hr)
- [System Modules](#system-modules)
- [Technical Setup](#technical-setup)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [Usage Manual](#usage-manual)

---

## Overview

This application serves as a central hub for:
- **Managing Care Plans**: detailed records for service seekers including medical history, preferences, and legal capacity.
- **Staff Scheduling**: Rota management with complex shift patterns and recurrence.
- **Time & Attendance**: Geolocation-based Clock In/Out functionality.
- **Care Recording**: Digital logging of daily tasks (medication, bathing, observations, etc.).

## Key Features

### For Care Workers
- **Dashboard**: View upcoming shifts, alerts, and quick actions.
- **My Rota**: Weekly view of assigned shifts.
- **Clock In / Clock Out**: 
  - **Smart Validation**: Can only clock in **10 minutes** before shift start.
  - **Location Tracking**: GPS location is captured on clock-in.
  - **Lateness Tracking**: Flags late clock-ins automatically.
  - **Expired Shifts**: Blocks interaction with shifts that have already ended.
- **Task Management**: Record care delivery notes directly in the app.

### For Admins & HR
- **User Management**: Onboard staff, assign roles (Care Worker, Admin, HR, etc.), and manage permissions.
- **Service User Management**: Full lifecycle management from "Pre-Admission" to "Live" to "Archived".
- **Shift Planning**: Create shifts with complex recurrence rules (Daily, Weekly, 2-Week, etc.).
- **Reporting**: View attendance reports, missed assignments, and staff performance.
- **Notifications**: System-wide alerts for late arrivals, incidents, or new staff.

## System Modules

The application is built around several core data models:

1.  **Users**: Staff members with specific roles (Admin, Care Worker) and regions.
2.  **Service Seekers**: The clients receiving care. Includes detailed profiles (Health tags, DNAR status, MCA assessments).
3.  **Shifts**: Scheduled units of work. Can be recurring.
4.  **Shift Assignments**: Assigning specific users to shifts.
5.  **Clock In/Out**: Records of actual attendance, linked to locations and timestamps.
6.  **Care Tasks**:
    - **Personal Care**: Bathing, Oral Care, Stool monitoring.
    - **Medical**: Medication (PRN), Blood Pressure, Pulse, Oxygen, Weight.
    - **Wellbeing**: Behaviour monitoring, Encouragement, Social visits.
    - **Safety**: Incident reporting, Emergency alerts.

## Technical Setup

### Prerequisites
- **Node.js** (v18+ recommended)
- **MySQL** Database

### Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd new-beeru
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Configure Environment**:
    Create a `.env` file in the root directory (see [Environment Variables](#environment-variables)).

4.  **Database Setup**:
    ```bash
    # Generate Prisma client
    npx prisma generate

    # Push schema to database
    npx prisma db push
    ```

5.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Ensure your `.env` file typically contains:

```ini
# Database Connection
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"

# Security
JWT_SECRET="your-secure-random-hex-string" # Generated 64-char hex string

# Features
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-public-key"
VAPID_PRIVATE_KEY="your-private-key"
```

---

## Usage Manual

### Logging In
- Access the portal at `/care-worker-login` (or the recruitment login).
- Use your registered email/username and password.

### Clocking In (Care Workers)
1.  Navigate to **Dashboard** or **My Rota**.
2.  Locate your **Scheduled** shift.
3.  **Important Rules**:
    - **10-Minute Window**: You cannot clock in until 10 minutes before the start time.
    - **Location**: Your browser must allow location access. The system records your GPS coordinates.
    - **Expired**: If the shift end time has passed, the status will show "Missed" and you cannot clock in.
4.  Click **"Start Shift"**. A confirmation modal will appear showing the client address.
5.  Confirm the action.

### Clocking Out
1.  On the active shift card, click **"Clock Out"**.
2.  If you are leaving before the shift end time, you will be asked to confirm leaving early.
3.  Confirm to complete the shift.

### Managing Privacy & Security
- Passwords are encrypted using `bcrypt`.
- Authentication uses secure JWT tokens.
- All sensitive Service User data is access-controlled based on User Role.
