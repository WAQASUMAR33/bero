# Enquiries & Referrals Module Plan (Open & Closed Pipelines)

> **Full Technical Specification Document**: [`docs/ENQUIRIES_MANAGEMENT_SPECIFICATION.md`](file:///e:/Rapidtechpro/bero/docs/ENQUIRIES_MANAGEMENT_SPECIFICATION.md)

This document outlines the ready-to-implement architecture for the **Enquiries** section in BEERU.

---

## Quick Overview

### 1. Sidebar Structure
Added under the Admin sidebar navigation in [`Sidebar.js`](file:///e:/Rapidtechpro/bero/src/app/admin/components/Sidebar.js):
* **Enquiries**
  * 🟢 **Open Enquiries** (`/admin/enquiries?tab=open`): Active prospective clients, assessments pending, follow-ups.
  * 🔴 **Closed Enquiries** (`/admin/enquiries?tab=closed`): Converted into Service Users, declined, or withdrawn.

---

### 2. Pipelines & Stages
* **Open Pipeline**:
  1. `NEW`: Inbound enquiry received via phone, email, or local authority portal.
  2. `CONTACTED`: First conversation completed with client/family/referrer.
  3. `ASSESSMENT_BOOKED`: Initial care needs assessment scheduled.
  4. `ASSESSMENT_COMPLETED`: Needs assessment done; care plan draft ready.
  5. `OFFER_MADE`: Proposal and care rate sent for approval.

* **Closed Pipeline**:
  1. `CONVERTED`: Agreed care package — **1-Click converted directly to a Service User (`ServiceSeeker`)**!
  2. `DECLINED_CAPACITY`: Cannot take on package (staffing/region constraints).
  3. `DECLINED_CLIENT`: Client selected alternative provider or cancelled.
  4. `WITHDRAWN`: Client circumstance changed (e.g. prolonged hospital stay).

---

### 3. Database Schema (Prisma)
* **`Enquiry`**: Stores client demographics, referrer information, care type, estimated hours, funding stream, stage, priority, follow-up dates, and linked `serviceSeekerId`.
* **`EnquiryActivity`**: Full timeline of calls, notes, assessments, and stage progression.

---

### 4. API Endpoints
* `GET /api/enquiries` (Query by `pipeline=OPEN|CLOSED`, status, search, careType, stats)
* `POST /api/enquiries` (Create new enquiry)
* `GET /api/enquiries/[id]` (View details & timeline)
* `PUT /api/enquiries/[id]` (Update enquiry or stage)
* `POST /api/enquiries/[id]/convert` (Convert to `ServiceSeeker` in `PRE_ADMISSION` status)
* `POST /api/enquiries/[id]/activities` (Add note/call log)

---

### 5. Frontend Module (`/admin/enquiries`)
* Segmented Open / Closed tab bar with live count badges.
* KPI cards (Total Open, Follow-ups Due, Assessments Scheduled, Conversion Rate %).
* Search & Multi-filter toolbar (Care Type, Funding Source, Priority).
* Responsive table & card view with instant stage progression and **"Convert to Service User"** button.
* 5-section intake modal matching UK care standards.

---

*When you have your template files ready, we can immediately adjust the fields and execute the build steps detailed in [`docs/ENQUIRIES_MANAGEMENT_SPECIFICATION.md`](file:///e:/Rapidtechpro/bero/docs/ENQUIRIES_MANAGEMENT_SPECIFICATION.md).*
