# 🚀 Server Startup Guide

This document contains all the commands to run the **SKF Quality Assurance Portal** using either **Docker (Background Service)** or **Normal Local Development**.

---

## 📋 Quick URLs Summary

| Service | Port | Local URL | Description |
| :--- | :--- | :--- | :--- |
| **Frontend Web Portal** | `3030` | **[http://localhost:3030](http://localhost:3030)** | React + Vite UI Application |
| **Backend REST API** | `8001` | **[http://localhost:8001](http://localhost:8001)** | FastAPI Python Backend |
| **API Swagger Docs** | `8001` | **[http://localhost:8001/docs](http://localhost:8001/docs)** | Interactive API Documentation |
| **PostgreSQL Database**| `5432` | `localhost:5432` | Database (`skf_inspection_db`) |

---

## 🐳 Method 1: Start with Docker (Recommended)

> **✨ Advantage:** Runs in the background as a system service. You can **close your IDE/terminal completely** and the website will keep running 24/7!

### 1. Prerequisites:
* Make sure **Docker Desktop** is installed and running (Whale 🐳 icon visible in your system tray).

### 2. Start all services in the background:
Open PowerShell or Command Prompt at the project root and run:

```bash
cd d:\Code\bandgar\internship
docker compose up -d --build
```

*(The `-d` flag runs all containers in detached/background mode).*

### 3. Check container status:
```bash
docker compose ps
```

### 4. View live logs (Optional):
```bash
docker compose logs -f
```

### 🛑 Stop all Docker services:
```bash
docker compose down
```

---

## 💻 Method 2: Normal Local Development (Without Docker)

> **✨ Advantage:** Hot Module Replacement (HMR) for live code editing during development.

### 1. Prerequisites:
* Python 3.10+ installed
* Node.js 18+ installed
* PostgreSQL & pgAdmin 4 running with `skf_inspection_db` created

---

### Terminal 1 — Start Backend Server (Port 8001)

```bash
cd d:\Code\bandgar\internship\backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8001
```

*(To stop: Press `Ctrl + C`)*

---

### Terminal 2 — Start Frontend Server (Port 3030)

```bash
cd d:\Code\bandgar\internship\frontend
npm run dev
```

*(To stop: Press `Ctrl + C`)*

---

## ⚡ Method 3: 1-Click Startup (Windows Script)

1. Double-click the file:
   📁 **[`backend/start.bat`](./backend/start.bat)**  
   *(Starts the Python backend on port 8001).*
2. Open a terminal and run:
   ```bash
   cd frontend
   npm run dev
   ```

---

## 🛠️ Quick Troubleshooting

### Port Already In Use (`WinError 10013` or `EADDRINUSE`):
If port `8001` or `3030` is stuck, free it with PowerShell:
```powershell
# Free port 8001
netstat -ano | findstr :8001
taskkill /PID <PID_NUMBER> /F

# Free port 3030
netstat -ano | findstr :3030
taskkill /PID <PID_NUMBER> /F
```

### Clear All Database Records (For a Fresh Demo):
Run in pgAdmin 4 Query Tool:
```sql
TRUNCATE TABLE public.inspection_records;
```
