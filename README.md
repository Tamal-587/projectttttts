# CodeAlpha_TaskFlow: Enterprise Agile Sprint & Project Management Platform

[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Backend](https://img.shields.io/badge/Backend-Django%205.1%20%2B%20DRF-092E20?logo=django&logoColor=white)](https://www.djangoproject.com/)
[![Authentication](https://img.shields.io/badge/Auth-SimpleJWT%20(Bearer)-black)](https://django-rest-framework-simplejwt.readthedocs.io/)
[![Styling](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Database](https://img.shields.io/badge/Database-SQLite%20%2F%20PostgreSQL-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Internship](https://img.shields.io/badge/CodeAlpha-Full%20Stack%20Development-blueviolet)](https://codealpha.tech/)

> A complete, production-grade Agile Sprint & Task Management platform developed for the **CodeAlpha Full Stack Development Internship**. Built with enterprise-grade architecture, role-based authorization, JWT authentication, normalized relational schemas, and an interactive Kanban board.

---

## 📑 Table of Contents

1. [Project Overview](#-project-overview)
2. [Key Features](#-key-features)
3. [System Architecture](#-system-architecture)
4. [Relational Database Schema](#-relational-database-schema)
5. [Tech Stack](#-tech-stack)
6. [API Documentation](#-api-documentation)
7. [Authentication & Authorization (RBAC)](#-authentication--authorization-rbac)
8. [Local Installation & Setup](#-local-installation--setup)
9. [Pre-Seeded Demo Accounts](#-pre-seeded-demo-accounts)
10. [Automated Testing](#-automated-testing)
11. [LinkedIn Video & Portfolio Script](#-linkedin-video--portfolio-script)
12. [DevOps & Production Readiness](#-devops--production-readiness)
13. [Internship Submission Details](#-internship-submission-details)

---

## 🌟 Project Overview

**TaskFlow** is a modern SaaS application designed for agile software engineering teams. It brings together sprint planning, interactive Kanban workflow columns, real-time KPI analytics, threaded issue discussions, and granular workspace access control.

Unlike generic tutorial projects, **TaskFlow** is built with real-world software engineering rigor:
- **No mock or faked data**: Every card movement, project creation, member invitation, comment, and authentication check executes real backend REST transactions.
- **Strict Role-Based Access Control (RBAC)**: Backend checks ensure `OWNER`, `ADMIN`, `MEMBER`, and `VIEWER` roles operate strictly within their permitted boundaries.
- **Enterprise Error Handling**: RFC-compliant standardized JSON error structures prevent silent client crashes and clarify field validation problems.
- **Audit Logging**: Every task creation, status transition, and member update is written to an immutable `ActivityLog` table.

---

## ⚡ Key Features

- **🔐 Dual-Identifier Authentication**:
  - Register with password confirmation and client/server validation.
  - Login via either email address or username.
  - Auto-refreshing JWT Bearer tokens with Axios interceptors.
- **🏢 Multi-Tenant Workspaces**:
  - Seamlessly switch between multiple workspaces.
  - Create new workspaces; the creator is automatically assigned `OWNER`.
  - Workspace-level member management and role delegation.
- **📋 Interactive Kanban Board**:
  - 5 Agile status columns: `Backlog`, `To Do`, `In Progress`, `In Review`, `Done`.
  - Native HTML5 Drag and Drop across status columns with instant optimistic UI update.
  - Quick-action dropdown on every card for rapid status changes.
  - Real-time search and filter pills by priority (`Urgent`, `High`, `Medium`, `Low`) and assignee.
- **🔍 Task Detail Drawer**:
  - Slide-over panel with title, description, due date, estimated hours, and assignee controls.
  - Interactive discussion comments thread with real-time posting and delete controls.
  - Safe deletion with confirmation modal.
- **📊 Real-Time KPI Dashboard**:
  - Live metric counters: Total Tasks, In Progress, Done, Overdue.
  - Visual sprint velocity progress bar.
  - Status breakdown pills and priority distribution counters.
  - Workspace activity audit feed displaying recent team actions.
- **👥 Team & Access Control**:
  - View member roster with job titles, departments, and avatars.
  - Promote or change roles between Admin, Member, and Viewer.
  - Invite existing developers by username or email.
- **👤 User Profile & Security**:
  - Edit personal profile: avatar URL, job title, department, and bio.
  - Secure password change flow verifying existing password hash.

---

## 🏗️ System Architecture

```
+-------------------------------------------------------------------------------+
|                           CLIENT TIER (React 19 + Vite)                       |
|  - Pages: Dashboard, Kanban Board, All Tasks Table, Projects, Team, Settings  |
|  - Global State: AuthContext, WorkspaceContext, ToastContext                  |
|  - HTTP Layer: Axios client with request Bearer attach & 401 refresh queue    |
|  - Design System: Modern Slate/Indigo theme, Lucide icons, Tailwind CSS v4    |
+---------------------------------------▲---------------------------------------+
                                        │ JSON / REST API (CORS enabled)
                                        │ Bearer JWT Auth Tokens
+---------------------------------------▼---------------------------------------+
|                    API & BUSINESS LOGIC TIER (Django 5 + DRF)                 |
|  - URL Router: Namespaced API endpoints under /api/...                        |
|  - Security & Auth: SimpleJWT (TokenObtainPair, TokenRefresh, RegisterView)   |
|  - Permissions: IsWorkspaceMember, IsWorkspaceAdminOrOwner, CanManageTask     |
|  - Serializers: Nested serializers, field validation & sanitization           |
|  - ViewSets: WorkspaceViewSet, ProjectViewSet, TaskViewSet, CommentViewSet    |
|  - Audit Log Handlers: Auto-records ActivityLog on entity mutations           |
+---------------------------------------▲---------------------------------------+
                                        │ ORM Queries (select_related / prefetch)
+---------------------------------------▼---------------------------------------+
|                               DATABASE TIER                                   |
|  - Local Development: SQLite (backend/db.sqlite3)                             |
|  - Production Ready: PostgreSQL (configured via DB_ENGINE & POSTGRES_* env)   |
+-------------------------------------------------------------------------------+
```

---

## 🗄️ Relational Database Schema

```
+----------------+          +-------------------------+          +-------------------+
|      User      | 1 ---- 1 |       UserProfile       |          |     Workspace     |
|----------------|          |-------------------------|          |-------------------|
| id (PK)        |          | id (PK)                 |          | id (PK)           |
| username       |          | user_id (FK -> User)    |          | name              |
| email          |          | avatar_url              |          | slug (Unique)     |
| password       |          | job_title               |          | description       |
| first_name     |          | department              |          | owner_id (FK)     |
| last_name      |          | bio                     |          | created_at        |
+----------------+          +-------------------------+          +-------------------+
        │                                                                  │
        │ 1                                                                │ 1
        ▼ *                                                                ▼ *
+-------------------------+                                      +-------------------+
|    WorkspaceMember      |                                      |      Project      |
|-------------------------|                                      |-------------------|
| id (PK)                 |                                      | id (PK)           |
| workspace_id (FK)       |                                      | workspace_id (FK) |
| user_id (FK)            |                                      | name              |
| role (OWNER/ADMIN/MEM)  |                                      | key (Unique/WS)   |
| joined_at               |                                      | status, dates     |
+-------------------------+                                      +-------------------+
                                                                           │
                                                                           │ 1
                                                                           ▼ *
+-------------------------+          +-------------------------+ +-------------------+
|       ActivityLog       |          |       TaskComment       | |       Task        |
|-------------------------|          |-------------------------| |-------------------|
| id (PK)                 |          | id (PK)                 | | id (PK)           |
| workspace_id (FK)       |          | task_id (FK -> Task)    | | project_id (FK)   |
| project_id (FK)         |          | author_id (FK -> User)  | | task_number       |
| user_id (FK)            |          | content                 | | title             |
| action                  |          | created_at              | | status, priority  |
| summary                 |          +-------------------------+ | assignee_id (FK)  |
| created_at              |                                      | reporter_id (FK)  |
+-------------------------+                                      +-------------------+
```

---

## 🛠️ Tech Stack

### Frontend
- **React 19** - Component architecture and declarative UI
- **Vite 8** - Ultra-fast development server and optimized bundle build
- **React Router 7** - Client-side routing with protected route guards
- **Tailwind CSS v4** - Sleek, responsive SaaS design system
- **Lucide React** - Clean and consistent UI iconography
- **Axios** - HTTP client with Bearer token interceptor and automatic token refresh queue

### Backend
- **Python 3.13** - Modern, secure runtime
- **Django 5.1** - High-level Python web framework
- **Django REST Framework (DRF) 3.17** - Standardized RESTful APIs
- **SimpleJWT 5.5** - Secure JSON Web Token authentication with rotation
- **django-cors-headers 4.9** - Cross-Origin Resource Sharing handling
- **python-dotenv** - Environment configuration management

---

## 📡 API Documentation

### Authentication & Profile
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register/` | Register user & receive JWT tokens | No |
| `POST` | `/api/auth/login/` | Authenticate with username or email | No |
| `POST` | `/api/auth/token/refresh/` | Obtain fresh access token | No (needs refresh token) |
| `GET` | `/api/auth/me/` | Fetch current user details & profile | Yes (Bearer) |
| `PATCH` | `/api/auth/profile/` | Update bio, title, department, avatar | Yes (Bearer) |
| `POST` | `/api/auth/change-password/` | Change account password | Yes (Bearer) |

### Workspaces & Team
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/workspaces/` | List workspaces user belongs to | Yes |
| `POST` | `/api/workspaces/` | Create a new workspace | Yes |
| `GET` | `/api/workspaces/{slug}/` | Workspace details | Yes (Member) |
| `GET` | `/api/workspaces/{slug}/members/` | List members and their roles | Yes (Member) |
| `POST` | `/api/workspaces/{slug}/members/` | Invite/add member | Yes (Owner/Admin) |
| `PATCH` | `/api/workspaces/{slug}/members/{id}/` | Update member role | Yes (Owner/Admin) |
| `DELETE` | `/api/workspaces/{slug}/members/{id}/` | Remove member from workspace | Yes (Owner/Admin) |
| `GET` | `/api/workspaces/{slug}/analytics/` | KPI counters & status distribution | Yes (Member) |
| `GET` | `/api/workspaces/{slug}/activity/` | Workspace audit activity log | Yes (Member) |

### Projects
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/projects/?workspace={slug}` | List projects in workspace | Yes (Member) |
| `POST` | `/api/projects/` | Create a new project | Yes (Owner/Admin/Member) |
| `GET` | `/api/projects/{id}/` | Get project details & metrics | Yes (Member) |
| `PATCH` | `/api/projects/{id}/` | Update project metadata | Yes (Owner/Admin) |
| `DELETE` | `/api/projects/{id}/` | Delete project and cascade tasks | Yes (Owner/Admin) |

### Tasks & Comments
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tasks/?workspace={slug}` | Filter tasks by project, status, search | Yes (Member) |
| `POST` | `/api/tasks/` | Create task (generates key e.g. `ALPHA-9`) | Yes (Non-Viewer) |
| `GET` | `/api/tasks/{id}/` | Task details & metadata | Yes (Member) |
| `PATCH` | `/api/tasks/{id}/` | Update task fields | Yes (Authorized) |
| `PATCH` | `/api/tasks/{id}/status/` | Quick status transition (Kanban move) | Yes (Non-Viewer) |
| `DELETE` | `/api/tasks/{id}/` | Delete task | Yes (Authorized) |
| `GET` | `/api/comments/?task={id}` | List task comments | Yes (Member) |
| `POST` | `/api/comments/` | Add comment to task | Yes (Non-Viewer) |
| `DELETE` | `/api/comments/{id}/` | Delete comment | Yes (Author/Admin) |

---

## 🔒 Authentication & Authorization (RBAC)

TaskFlow enforces Role-Based Access Control both at the UI layer and strictly at the API controller layer:

| Permission | Owner | Admin | Member | Viewer |
| :--- | :---: | :---: | :---: | :---: |
| **View Dashboard, Boards, Tasks** | ✅ | ✅ | ✅ | ✅ |
| **Create & Update Assigned Tasks** | ✅ | ✅ | ✅ | ❌ |
| **Post Comments to Tasks** | ✅ | ✅ | ✅ | ❌ |
| **Create Projects** | ✅ | ✅ | ✅ | ❌ |
| **Edit Project Settings / Delete Projects** | ✅ | ✅ | ❌ | ❌ |
| **Invite Members & Change Roles** | ✅ | ✅ | ❌ | ❌ |
| **Delete Workspace** | ✅ | ❌ | ❌ | ❌ |

---

## 🚀 Local Installation & Setup

### Prerequisites
- **Python 3.10+** (Tested on Python 3.13)
- **Node.js 18+** (Tested on Node.js v24)
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/CodeAlpha_TaskFlow.git
cd CodeAlpha_TaskFlow
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Seed rich demo data (team members, projects, active sprint tasks, comments)
python manage.py seed_demo_data

# Start Django development server
python manage.py runserver 127.0.0.1:8000
```
Backend API root is now live at: `http://127.0.0.1:8000/`

### 3. Frontend Setup
Open a new terminal window:
```bash
# Navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Start Vite development server
npm run dev
```
Frontend client is now accessible at: `http://localhost:5173/`

---

## 🔑 Pre-Seeded Demo Accounts

When running `python manage.py seed_demo_data`, the database is populated with realistic sprint data and credentials. The login screen also contains **1-Click Auto-Fill** buttons for instant access!

| Account Name | Username / Email | Password | Role |
| :--- | :--- | :--- | :--- |
| **Alexander Vance (Lead Architect)** | `alex@codealpha.io` | `Password123!` | Workspace Owner |
| **Sophia Lin (Lead Frontend)** | `sophia@codealpha.io` | `Password123!` | Workspace Admin |
| **Marcus Brody (Backend Specialist)** | `marcus@codealpha.io` | `Password123!` | Workspace Member |
| **Elena Rostova (DevOps & QA)** | `elena@codealpha.io` | `Password123!` | Workspace Member |

---

## 🧪 Automated Testing

Comprehensive test suites verify authentication flows, edge cases, RBAC boundary rules, and CRUD endpoints:

```bash
# Run backend automated test suite
python backend/manage.py test taskflow
```

Output:
```
Creating test database for alias 'default'...
Found 6 test(s).
System check identified no issues (0 silenced).
......
----------------------------------------------------------------------
Ran 6 tests in 12.45s

OK
Destroying test database for alias 'default'...
```

Verify frontend production build:
```bash
cd frontend
npm run build
```

---

## 🎥 LinkedIn Video & Portfolio Script

Use this 60-90 second walkthrough structure when recording your internship project presentation video:

1. **Introduction (0:00 - 0:15)**:
   > *"Hi everyone! As part of my Full Stack Development Internship at CodeAlpha, I engineered **TaskFlow** — an enterprise-grade Agile Project & Sprint Management platform built with React, Vite, Django REST Framework, and SimpleJWT."*
2. **Architecture & Authentication (0:15 - 0:30)**:
   > *"I designed the system with multi-tenant workspace architecture. Authentication is handled using secure JWT access and refresh token rotation, with Axios interceptors that seamlessly refresh expired sessions without interrupting the user."*
3. **Interactive Kanban Board & UX (0:30 - 0:50)**:
   > *"Here on the Kanban Board, team members can drag-and-drop tasks across Backlog, To Do, In Progress, and Done columns with optimistic UI updates. Clicking any task opens our slide-over drawer where team members can collaborate in real time using threaded comments."*
4. **RBAC & Analytics (0:50 - 1:10)**:
   > *"Under the hood, we enforce strict Role-Based Access Control: Owners, Admins, Members, and Viewers. The dashboard provides live KPI metrics, sprint velocity progress bars, and an immutable audit log tracking every critical action."*
5. **Conclusion (1:10 - 1:20)**:
   > *"The backend includes 100% passing automated unit tests, and the repository is completely open-source on GitHub with documentation and demo seeders. Thank you to CodeAlpha for this incredible opportunity!"*

---

## ⚙️ DevOps & Production Readiness

### Environment Variables
Refer to `.env.example` to configure production settings:
- `DJANGO_SECRET_KEY`: Random 50+ character secret string.
- `DJANGO_DEBUG`: Set to `False` in production.
- `DB_ENGINE`: Change to `django.db.backends.postgresql` to connect to PostgreSQL.
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT`.

---

## 🎓 Internship Submission Details

- **Company / Organization**: [CodeAlpha](https://codealpha.tech/)
- **Track**: Full Stack Web Development Internship
- **Project Name**: CodeAlpha_TaskFlow
- **Repository**: [CodeAlpha_TaskFlow](https://github.com/your-username/CodeAlpha_TaskFlow)
- **License**: MIT
