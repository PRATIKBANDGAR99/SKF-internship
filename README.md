# 🏭 SKF Quality Assurance Portal

> **First Off Inspection Management System**  
> A full-stack web application built for precision manufacturing lines (TRB & DGBB bearing components). Features digitized parameter checks, real-time calculations, automated PDF generation, attachment merging, and a standalone **FastAPI + PostgreSQL** backend with **pgAdmin 4** integration.

---

## 📋 Table of Contents
- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
  - [1. Database Setup (PostgreSQL / pgAdmin 4)](#1-database-setup-postgresql--pgadmin-4)
  - [2. Backend Setup (FastAPI)](#2-backend-setup-fastapi)
  - [3. Frontend Setup (React + Vite)](#3-frontend-setup-react--vite)
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
* **Standalone Local Architecture**: High-performance Python **FastAPI** REST API connected to a local **PostgreSQL** database managed with **pgAdmin 4**.

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
* **Local Persistence & File Storage**:
  * Structured JSON storage for dynamic form schemas and multi-row inspection tables.
  * Local PDF uploads served via FastAPI static file mounting (`backend/uploads/`).
  * Seamless offline/localStorage fallback.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend UI** | [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/) | Component-based UI with interactive data tables and Lucide icons |
| **PDF Engine** | [pdf-lib](https://pdf-lib.js.org/) + `html2pdf.js` | Client-side document rendering, page assembly, and PDF merging |
| **Backend API** | [FastAPI](https://fastapi.tiangolo.com/) + [Uvicorn](https://www.uvicorn.org/) | Asynchronous Python REST API with CORS and static file streaming |
| **ORM & DB Layer** | [SQLAlchemy 2.0](https://www.sqlalchemy.org/) + `psycopg2` | Relational database mapping, connection pooling, and auto-DDL |
| **Database** | [PostgreSQL 14+](https://www.postgresql.org/) + [pgAdmin 4](https://www.pgadmin.org/) | ACID-compliant relational storage for inspection records and metadata |

---

## 📁 Project Structure

```text
skf-internship/
├── backend/
│   ├── uploads/                # Directory where uploaded PDF files are stored
│   ├── .env                    # Backend environment variables (DB credentials, host/port)
│   ├── .env.example            # Backend environment template
│   ├── database.py             # SQLAlchemy engine, session maker, and init_db()
│   ├── main.py                 # FastAPI application routes (CRUD, upload, health)
│   ├── models.py               # SQLAlchemy ORM model for `inspection_records`
│   ├── requirements.txt        # Python package dependencies
│   ├── schema.sql              # PostgreSQL DDL script for pgAdmin Query Tool
│   ├── schemas.py              # Pydantic validation schemas
│   └── start.bat               # 1-click Windows startup batch script
│
├── frontend/
│   ├── Frontend/
│   │   ├── apiClient.js        # REST API client for FastAPI backend communication
│   │   ├── skf17.js            # Main Quality Assurance Application & inspection UI
│   │   └── supabaseClient.js   # Legacy Supabase client (kept for reference)
│   ├── .env                    # Frontend environment variables (API base URL)
│   ├── .env.example            # Frontend environment template
│   ├── index.html              # Entry HTML file
│   ├── main.jsx                # React DOM entry point
│   ├── package.json            # Node dependencies and build scripts
│   └── vite.config.js          # Vite build configuration
│
└── README.md                   # Complete project documentation
```

---

## 🚀 Prerequisites

Ensure the following are installed on your workstation:
1. **Node.js** (v18.0.0 or higher) & **npm**
2. **Python** (v3.10 or higher) with `pip`
3. **PostgreSQL** (v14 or higher) with **pgAdmin 4**

---

## ⚙️ Installation & Setup

### 1. Database Setup (PostgreSQL / pgAdmin 4)

1. Open **pgAdmin 4** and connect to your local PostgreSQL server.
2. In the Object Explorer, right-click **Databases** ➔ **Create** ➔ **Database...**
3. Set the Database name to:
   ```text
   skf_inspection_db
   ```
4. Click **Save**.
5. *(Optional)* Open the **Query Tool** on `skf_inspection_db`, paste the contents of `backend/schema.sql`, and execute (F5).  
   > *Note: FastAPI will also automatically create the `inspection_records` table on first run via SQLAlchemy.*

---

### 2. Backend Setup (FastAPI)

1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. *(Recommended)* Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Create your `.env` configuration:
   ```bash
   cp .env.example .env
   ```

5. Edit `backend/.env` with your PostgreSQL password:
   ```env
   # Format: postgresql://<username>:<password>@localhost:5432/<database_name>
   # Note: If password has special characters like '@', URL-encode them (e.g. '@' -> '%40')
   DATABASE_URL=postgresql://postgres:YourPasswordHere@localhost:5432/skf_inspection_db

   PORT=8000
   HOST=0.0.0.0
   CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   ```

---

### 3. Frontend Setup (React + Vite)

1. Open a new terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Create your `.env` configuration:
   ```bash
   cp .env.example .env
   ```

4. Verify `frontend/.env` points to your backend:
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   ```

---

## 💻 Running the Application

### Option A: Standard Terminal Startup

**Terminal 1 — Backend:**
```bash
cd backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
> Backend API will be live at: **`http://127.0.0.1:8000`**  
> Interactive Swagger Docs: **`http://127.0.0.1:8000/docs`**

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
> Frontend Application will be live at: **`http://localhost:5173`**

### Option B: 1-Click Startup (Windows)
Double-click `backend/start.bat` to launch the FastAPI server, then run `npm run dev` in `frontend/`.

---

## 📡 API Reference

Interactive OpenAPI documentation is available at **`http://localhost:8000/docs`**.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System health check & PostgreSQL connection status |
| `GET` | `/api/records` | List all inspection records (supports `?search=` filter) |
| `GET` | `/api/records/{id}` | Get single inspection record by ID |
| `POST` | `/api/records` | Create or update an inspection record (Upsert) |
| `DELETE` | `/api/records/{id}` | Delete an inspection record |
| `POST` | `/api/upload` | Upload PDF file (multipart form data) to local storage |
| `GET` | `/uploads/{filename}` | Stream/download uploaded PDF files |

---

## 🔍 pgAdmin 4 Database Management

You can inspect, query, and verify submitted inspection data directly in **pgAdmin 4**:

1. In pgAdmin 4, navigate to:
   ```text
   Servers ➔ PostgreSQL ➔ Databases ➔ skf_inspection_db ➔ Schemas ➔ public ➔ Tables ➔ inspection_records
   ```
2. Right-click `inspection_records` ➔ **View/Edit Data** ➔ **All Rows**.
3. Or run custom SQL queries in the **Query Tool**:
   ```sql
   -- View all inspection records sorted by newest first
   SELECT id, date, section, channel, ring_section, machine, operation, created_at
   FROM public.inspection_records
   ORDER BY created_at DESC;

   -- Search records for a specific channel and section
   SELECT *
   FROM public.inspection_records
   WHERE section = 'TRB' AND channel = 'T1'
   ORDER BY date DESC;
   ```

---

## 🛠️ Troubleshooting & Common Issues

### 1. `[WinError 10013] An attempt was made to access a socket...`
* **Cause**: Port 8000 is already in use by another running Uvicorn/Python process.
* **Fix**: Terminate the previous process or find its PID in PowerShell:
  ```powershell
  netstat -ano | findstr :8000
  taskkill /PID <PID_NUMBER> /F
  ```

### 2. `FATAL: database "skf_inspection_db" does not exist`
* **Cause**: The database has not been created yet in PostgreSQL.
* **Fix**: In pgAdmin 4, right-click **Databases** ➔ **Create** ➔ **Database...**, name it `skf_inspection_db`, and click **Save**.

### 3. `FATAL: password authentication failed for user "postgres"`
* **Cause**: Incorrect password in `backend/.env` or special characters not URL-encoded.
* **Fix**: If your password contains special characters (like `@`, `#`, `$`), URL-encode them. Example: `Sarwadnya@123` becomes `Sarwadnya%40123`.

### 4. CORS Errors in Browser Console
* **Cause**: Frontend origin not allowed in backend CORS policy.
* **Fix**: Ensure `CORS_ORIGINS` in `backend/.env` includes `http://localhost:5173,http://127.0.0.1:5173`.

---

## 📄 License

This application is developed for First Off Quality Inspection Management and internal manufacturing operations. All rights reserved.
