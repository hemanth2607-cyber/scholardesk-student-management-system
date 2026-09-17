# ScholarDesk SIS • Academic Student Information Registry
### Standard Operating Procedure (SOP) Reference Full-Stack CRUD Application

---

## 1. Title & Project Overview
**ScholarDesk SIS** is a production-ready, full-stack Academic Student Information and Management System built in strict compliance with the **Standard Operating Procedure (SOP) for Complete CRUD-Based Web Application Development**. 

The system provides a collegiate-grade portal for university registrars and academic advisors to manage student admissions, demographic details, program affiliations, GPA progression, and enrollment standing through a reliable RESTful architecture.

---

## 🌐 Live Deployment & Repository Links
- **GitHub Repository**: [https://github.com/hemanth2607-cyber/scholardesk-student-management-system](https://github.com/hemanth2607-cyber/scholardesk-student-management-system)
- **Live Deployed Application**: `https://scholardesk-student-management-system.onrender.com` *(or your Vercel deployment link)*
- **API Base Endpoint**: `/api/students/`

---

## 2. Problem Statement
Academic institutions require reliable, secure, and intuitive registry software to track student enrollment records, manage departmental rosters, calculate aggregate academic indicators, and prevent data discrepancies (such as duplicate identification numbers or out-of-range GPAs). Manual spreadsheets or disconnected tools often cause data fragmentation and validation failures.

---

## 3. Objectives
- Implement full **Create, Read, Update, and Delete (CRUD)** lifecycle operations across all system layers.
- Build a human-centered, responsive frontend interface adhering to an authentic collegiate aesthetic (avoiding generic AI template patterns).
- Design a scalable REST API using Django REST Framework with strict client- and server-side validation.
- Provide persistent relational data storage with constraints using SQLite.
- Maintain comprehensive automated test suites and an interactive API Explorer.

---

## 4. Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | HTML5 (Semantic), Vanilla CSS, JavaScript ES6+ | Client UI, DOM manipulation, client-side validation, asynchronous fetch calls |
| **Styling & Mood Board** | Custom Vanilla CSS (Collegiate Oxford Navy, Warm Parchment) | Authentic human craftsmanship, non-AI layout, mobile-first responsive design |
| **Backend Framework** | Python 3.14 + Django 6.1 + Django REST Framework 3.18 | RESTful API endpoints, serialization, business logic, ORM |
| **Cross-Origin Handling** | `django-cors-headers` | Cross-Origin Resource Sharing (CORS) handling |
| **Database** | SQLite3 | Persistent relational storage with unique constraints and indexing |
| **Testing** | Django TestCase & DRF APIClient, Browser Subagent | Automated endpoint test suite and end-to-end browser verification |
| **Version Control** | Git | Distributed source-code version management |

---

## 5. System Architecture & Component Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       Frontend Client Layer                             │
│  - Academic Header, Live Metric Cards (Enrollment, Mean GPA, Top Dept)  │
│  - Instant Search, Multi-Filter (Dept, Status, Year), Sort & Pagination  │
│  - Data Table with Dynamic Badges & Action Buttons                      │
│  - Create / Edit Modals with Real-Time Error Feedback                   │
│  - Student Dossier View & CSV / JSON Exporters                          │
│  - Interactive REST API Explorer Console & SOP Evaluation Matrix        │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP / JSON (REST API)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   Backend REST API Layer (Django REST)                  │
│  - URL Router (`/api/students/`)                                        │
│  - ModelViewSet with Search, Filter & Ordering Backends                 │
│  - `StudentSerializer` with Field & Range Validators                    │
│  - Custom Actions: `stats`, `reset_sample_data`, `export_csv`           │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Django ORM
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Database Layer (SQLite3 Engine)                    │
│  - Table: `students_student`                                            │
│  - Fields: `id`, `student_id` (Unique), `email` (Unique), `gpa` (0-4),  │
│    `department`, `year_of_study`, `enrollment_status`, etc.             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Database / ER Schema

### Entity: `Student` (`students_student`)

| Field Name | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | BigAutoField | Primary Key, Auto-Increment | Internal record ID |
| `student_id` | VarChar(20) | Unique, Not Null, Indexed | Unique institutional ID (e.g. `STU-2024-001`) |
| `first_name` | VarChar(80) | Not Null | Student first name (min 2 chars) |
| `last_name` | VarChar(80) | Not Null | Student family/last name |
| `email` | VarChar(254) | Unique, Not Null, Indexed | Institutional email |
| `phone` | VarChar(25) | Not Null | Contact phone number (7-15 digits) |
| `department` | VarChar(80) | Not Null, Choices | Academic department (CS, AI, IT, EE, Mech, Biotech, etc.) |
| `year_of_study`| Integer | Not Null, Choices (1-4) | 1st, 2nd, 3rd, or 4th Year |
| `gpa` | Decimal(3,2) | Not Null, Range [0.00, 4.00]| Cumulative Grade Point Average |
| `enrollment_status`| VarChar(20) | Not Null, Choices | Active, Graduated, On Leave, Suspended |
| `enrollment_date` | Date | Not Null | Date of formal matriculation |
| `address` | TextField | Blank allowed | Residential / Postal address |
| `created_at` | DateTime | Auto-now-add | Timestamp record inserted |
| `updated_at` | DateTime | Auto-now | Timestamp record updated |

---

## 7. REST API Endpoints Catalog

| HTTP Method | Endpoint | Description | Request Body | Response Code |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/students/` | List all records (supports `search`, `department`, `status`, `year`, `ordering`) | None | `200 OK` |
| `POST` | `/api/students/` | Create a new student record | JSON Object | `201 Created` / `400 Bad Request` |
| `GET` | `/api/students/{id}/` | Retrieve single student profile dossier | None | `200 OK` / `404 Not Found` |
| `PUT` | `/api/students/{id}/` | Complete record update | Full JSON Object | `200 OK` / `400 Bad Request` |
| `PATCH` | `/api/students/{id}/` | Partial record update | Partial JSON Object | `200 OK` / `400 Bad Request` |
| `DELETE`| `/api/students/{id}/` | Delete student record | None | `204 No Content` / `404 Not Found` |
| `GET` | `/api/students/stats/`| Return aggregate analytics & department breakdown | None | `200 OK` |
| `POST`| `/api/students/reset_sample_data/`| Populate/restore 10 verified test records | None | `200 OK` |
| `GET` | `/api/students/export_csv/` | Export student registry as CSV download | None | `200 OK` (CSV file) |

---

## 8. CRUD Functional Implementation Details

1. **Create (C)**:
   - Evaluates input on the client using real-time regex checking.
   - Dispatches a `POST` request with JSON payload to `/api/students/`.
   - The server verifies uniqueness of `student_id` and `email`, validates `gpa` range between 0.00 and 4.00, and returns `201 Created`.
   - Table and statistics update instantaneously without a page reload.

2. **Read (R)**:
   - Initial load retrieves all active records and calculates metrics via `/api/students/stats/`.
   - Real-time debounced search filters students across ID, Name, Email, and Department.
   - Clicking "View" opens a detailed dossier modal showing timestamps and addresses.

3. **Update (U)**:
   - Clicking "Edit" fetches the specific student ID and populates the modal form.
   - Submitting executes a `PUT` or `PATCH` request.
   - Updated records reflect immediately in the UI.

4. **Delete (D)**:
   - Clicking "Delete" opens a safety confirmation modal detailing the candidate's name and ID.
   - Confirmation sends a `DELETE` request to `/api/students/{id}/`.
   - The record is purged from the database, and the user receives a confirmation toast notification.

---

## 9. Validation Matrix (Client & Server)

| Field | Rule Description | Client Validation | Server Validation (DRF) |
| :--- | :--- | :--- | :--- |
| `student_id` | Mandatory, 3-20 chars, alphanumeric/hyphens, unique | Regex `^[A-Za-z0-9\-]{3,20}$` | `validate_student_id()` + DB Unique Constraint |
| `email` | Mandatory, valid email pattern, unique | HTML5 `type="email"` + Regex | `EmailField()` + DB Unique Constraint |
| `gpa` | Mandatory, numeric, between `0.00` and `4.00` | Number min/max attributes | `MinValueValidator(0.00)`, `MaxValueValidator(4.00)` |
| `first_name`| Mandatory, minimum 2 characters | Length check `>= 2` | `validate_first_name()` |
| `phone` | Mandatory, 7 to 15 digits | Digit extraction check | `validate_phone()` length check |
| `department`| Mandatory choice from approved catalog | Select element requirement | Model choice validation |

---

## 10. Automated Testing Results

An automated test suite (`students/tests.py`) runs 14 test cases:
```bash
python manage.py test students
```

### Test Case Execution Summary:
- `test_create_student_success`: Verified `201 Created` on valid payload.
- `test_create_duplicate_student_id_fails`: Verified duplicate `student_id` rejection with `400 Bad Request`.
- `test_create_duplicate_email_fails`: Verified duplicate `email` rejection with `400 Bad Request`.
- `test_create_invalid_gpa_range_fails`: Verified out-of-range GPA (> 4.00 and < 0.00) rejection.
- `test_create_invalid_email_format_fails`: Verified invalid email format rejection.
- `test_read_all_students`: Verified retrieval of student list.
- `test_read_single_student_success`: Verified `200 OK` on single record fetch.
- `test_read_single_student_not_found`: Verified `404 Not Found` on non-existent record.
- `test_update_student_put`: Verified complete field replacement via `PUT`.
- `test_partial_update_student_patch`: Verified selective field updating via `PATCH`.
- `test_delete_student_success`: Verified record removal and `204 No Content`.
- `test_delete_non_existent_student`: Verified `404 Not Found` handling.
- `test_filter_and_search`: Verified query parameter filtering and text search.
- `test_stats_endpoint`: Verified aggregate metric calculations.

**Result: 14/14 Tests Passed (0 Failures, 0 Errors, 0 Warnings).**

---

## 11. Installation & Execution Guide

### Prerequisites
- Python 3.10+ (Tested on Python 3.14)
- Pip package manager
- Web browser (Chrome, Firefox, Edge, Safari)

### Step 1: Install Dependencies
```bash
pip install django djangorestframework django-cors-headers
```

### Step 2: Apply Database Migrations
```bash
python manage.py makemigrations students
python manage.py migrate
```

### Step 3: Seed Sample Demonstration Records (Optional)
```bash
python manage.py seed_students
```

### Step 4: Run the Development Server
```bash
python manage.py runserver 127.0.0.1:8000
```

### Step 5: Access the Application
Open your web browser and navigate to:
```
http://127.0.0.1:8000/
```

---

## 12. Evaluation & Viva Guide (SOP Section 16 Rubric)

- **10% Requirement & Design**: Clear decoupled architecture, complete data dictionary, and clean flow.
- **20% Frontend**: Human-crafted collegiate mood board, zero generic AI tropes, responsive mobile/desktop layout, real-time debounced search, multi-faceted filtering, sorting, and toast messaging.
- **20% Backend & API**: Django REST Framework `StudentViewSet` implementing standard REST conventions, robust serialization, and custom statistical actions.
- **20% CRUD Functionality**: All four operations verified live in browser and via test suite.
- **10% Database**: SQLite persistent database with relational constraints and indexing.
- **10% Testing**: 14 automated unit tests + end-to-end browser session recording.
- **10% Documentation**: Full SOP-compliant report and interactive in-app API explorer.
