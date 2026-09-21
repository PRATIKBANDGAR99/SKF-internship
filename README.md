# 🏭 SKF Quality Assurance Portal

> **First Off Inspection Management System**  
> A full-stack web application built for precision manufacturing lines (TRB & DGBB bearing components). Features digitized parameter checks, real-time calculations, automated PDF generation, attachment merging, a standalone **FastAPI + PostgreSQL** backend, and complete **Docker / Docker Compose** containerization.

---

## 📋 Table of Contents
- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [🐳 Running with Docker (Recommended)](#-running-with-docker-recommended)
- [⚙️ Local Manual Setup](#️-local-manual-setup)
  - [1. Database Setup (PostgreSQL / pgAdmin 4)](#1-database-setup-postgresql--pgadmin-4)
  - [2. Backend Setup (FastAPI on Port 8001)](#2-backend-setup-fastapi-on-port-8001)
  - [3. Frontend Setup (React + Vite on Port 3030)](#3-frontend-setup-react--vite-on-port-3030)
- [Running the Application](#-running-the-application)
- [API Reference](#-api-reference)
- [pgAdmin 4 Database Management](#-pgadmin-4-database-management)
- [Troubleshooting & Common Issues](#-troubleshooting--common-issues)
- [License](#-license)

---

## 🌟 Overview

The **SKF Quality Assurance Portal** replaces manual paper-based inspection sheets with an end-to-end digital workflow across manufacturing channels:
* **Digitized First-Off Logs**: Parameter logging for **Track Grinding**, **Bore Grinding**, and **Track Honing** operations.
* **Strict Quality Control**: Tolerance validation and multi-sample measurements across Shifts (`I`, `II`, `III`).
* **Automated PDF Engine**: In-browser PDF generation (`html2pdf.js`) and multi-document technical attachment merging (`pdf-lib`).
* **Dual Preview Reports Dashboard**: Search, filter, and preview inspection records with instant toggling between **Sheet View** and **Attached Technical PDF**.
* **Standalone Architecture**: High-performance Python **FastAPI** REST API on port **8001** connected to a **PostgreSQL** database, with a **React + Vite** frontend on port **3030**.

---

## ✨ Key Features

* **Dynamic Inspection Forms**:
  * Auto-configures parameters based on **Section** (`TRB` / `DGBB`), **Channel** (`T1` – `T6`), **Ring Section** (`Inner Ring` / `Outer Ring`), and **Shift**.
  * Multi-sample logging (e.g., 5 sample parts) for Track Diameter, Ovality, Track Angle, Crowning, Bore Diameter, Surface Roughness ($Ra$), VKR vibration values, and visual checkpoints.
  * Machine release status tracking (`YES` / `NO`).
* **Automated PDF Generation & Merging**:
  * Instant client-side A4 PDF compilation using `pdf-lib` and `html2pdf.js`.
  * Merges generated inspection sheets with technical drawings / supplementary PDFs into a unified document.
  * Print-optimized layouts (`@media print` for standard A4 portrait).
* **Reports Dashboard & Preview Modal**:
  * Real-time search and filtering by Date, Section, Channel, Ring Section, Machine Number, and Shift.
  * **2-Option Preview Modal**:
    * 📝 **Show Sheet**: Formatted digital inspection sheet preview with print & download actions.
    * 📎 **Show Attached PDF**: Embedded technical drawing / drawing attachment viewer.
* **Complete Docker Support**:
  * Fully containerized stack (`PostgreSQL`, `FastAPI`, `Nginx + React SPA`) orchestrated via `docker-compose.yml`.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology | Port | Description |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/) + [Nginx](https://nginx.org/) | **3030** | Interactive inspection UI served with Nginx |
| **Backend API** | [FastAPI](https://fastapi.tiangolo.com/) + [Uvicorn](https://www.uvicorn.org/) | **8001** | Python async REST API with CORS and static file streaming |
| **Database** | [PostgreSQL 15](https://www.postgresql.org/) | **5432** | ACID relational storage for inspection sheets and metadata |
| **Containerization**| [Docker](https://www.docker.com/) + Docker Compose | — | Containerized multi-service deployment |

---

## 📁 Project Structure

```text
skf-internship/
├── docker-compose.yml          # Complete Docker Compose configuration
├── .dockerignore               # Root Docker ignore rules
├── backend/
│   ├── Dockerfile              # Backend container build specification
│   ├── .dockerignore           # Backend Docker ignore rules
│   ├── uploads/                # Directory where uploaded PDF files are stored
│   ├── .env                    # Backend environment variables (DB credentials, host/port)
│   ├── .env.example            # Backend environment template
│   ├── database.py             # SQLAlchemy engine, session maker, and init_db()
│   ├── main.py                 # FastAPI application routes (CRUD, upload, health)
│   ├── models.py               # SQLAlchemy ORM model for `inspection_records`
│   ├── requirements.txt        # Python package dependencies
│   ├── schema.sql              # PostgreSQL DDL script for pgAdmin Query Tool
│   ├── schemas.py              # Pydantic validation schemas
│   ├── seed.sql                # Demo seed script for mentor presentations
│   └── start.bat               # 1-click Windows startup batch script
│
├── frontend/
│   ├── Dockerfile              # Frontend multi-stage build (Node + Nginx)
│   ├── nginx.conf              # Nginx server configuration (Port 3030)
│   ├── .dockerignore           # Frontend Docker ignore rules
│   ├── Frontend/
│   │   ├── apiClient.js        # REST API client for FastAPI backend (Port 8001)
│   │   └── skf17.js            # Main Quality Assurance Application & inspection UI
│   ├── .env                    # Frontend environment variables (VITE_API_BASE_URL)
│   ├── .env.example            # Frontend environment template
│   ├── index.html              # Entry HTML file
│   ├── main.jsx                # React DOM entry point
│   ├── package.json            # Node dependencies and build scripts
│   └── vite.config.js          # Vite build & server config (Port 3030)
│
└── README.md                   # Complete project documentation
```

---

## 🚀 Prerequisites

Ensure either of the following is installed on your workstation:
* **Option 1 (Docker)**: [Docker Desktop](https://www.docker.com/products/docker-desktop/)
* **Option 2 (Manual)**: Node.js 18+, Python 3.10+, PostgreSQL 14+ with pgAdmin 4.

---

## 🐳 Running with Docker (Recommended)

Start the entire application stack (PostgreSQL + FastAPI + React UI) with a single command:

```bash
docker compose up --build
```

### Accessing the Services:
* 🌐 **Frontend Web Portal**: [http://localhost:3030](http://localhost:3030)
* ⚙️ **Backend API (Swagger Docs)**: [http://localhost:8001/docs](http://localhost:8001/docs)
* 🗄️ **PostgreSQL Database**: `localhost:5432` (`user: postgres`, `password: postgres`, `db: skf_inspection_db`)

To stop all containers:
```bash
docker compose down
```

---

## ⚙️ Local Manual Setup

If running locally without Docker:

### 1. Database Setup (PostgreSQL / pgAdmin 4)

1. Open **pgAdmin 4** and connect to your local PostgreSQL server (`localhost:5432`).
2. Right-click **Databases** ➔ **Create** ➔ **Database...**, name it `skf_inspection_db`, and click **Save**.
3. *(Optional)* Run `backend/schema.sql` or `backend/seed.sql` in the Query Tool to initialize or pre-populate data.

---

### 2. Backend Setup (FastAPI on Port 8001)

1. Open a terminal and navigate to `backend/`:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Verify `backend/.env` has:
   ```env
   DATABASE_URL=postgresql://postgres:YourPassword@localhost:5432/skf_inspection_db
   PORT=8001
   HOST=0.0.0.0
   CORS_ORIGINS=http://localhost:3030,http://127.0.0.1:3030
   ```
5. Start the backend:
   ```bash
   python -m uvicorn main:app --reload --host 127.0.0.1 --port 8001
   ```

---

### 3. Frontend Setup (React + Vite on Port 3030)

1. Open a new terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Verify `frontend/.env` points to port 8001:
   ```env
   VITE_API_BASE_URL=http://localhost:8001
   ```
4. Start the frontend:
   ```bash
   npm run dev
   ```
   > App will be live at: **`http://localhost:3030`**

---

## 📡 API Reference

Interactive OpenAPI documentation is available at **`http://localhost:8001/docs`**.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System health check & PostgreSQL connection status |
| `GET` | `/api/records` | List all inspection records (sorted newest first) |
| `GET` | `/api/records/{id}` | Get single inspection record by ID |
| `POST` | `/api/records` | Create or update an inspection record (Upsert) |
| `DELETE` | `/api/records/{id}` | Delete an inspection record |
| `POST` | `/api/upload` | Upload PDF file (multipart form data) to local storage |
| `GET` | `/uploads/{filename}` | Stream/download uploaded PDF files |

---

## 🔍 pgAdmin 4 Database Management

You can inspect, query, and verify submitted inspection data directly in **pgAdmin 4**:

```sql
-- View all inspection records sorted by newest first
SELECT id, date, section, channel, ring_section, machine, operation, created_at
FROM public.inspection_records
ORDER BY created_at DESC;

-- Clear all test data (for a clean demo)
TRUNCATE TABLE public.inspection_records;
```

---

## 🛠️ Troubleshooting & Common Issues

### 1. `[WinError 10013] An attempt was made to access a socket...`
* **Cause**: Port 8001 or 3030 is already in use by another running process.
* **Fix**: Find and terminate the process or change the port in `.env`.
  ```powershell
  netstat -ano | findstr :8001
  taskkill /PID <PID_NUMBER> /F
  ```

### 2. `FATAL: database "skf_inspection_db" does not exist`
* **Cause**: The database has not been created in PostgreSQL yet.
* **Fix**: In pgAdmin 4, create the database named `skf_inspection_db` or use `docker compose up` which creates it automatically.

---

## 📄 License

This application is developed for First Off Quality Inspection Management and internal manufacturing operations. All rights reserved.
