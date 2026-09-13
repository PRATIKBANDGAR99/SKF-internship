# SKF Quality Assurance Portal

> **First Off Inspection Management System**  
> A web-based quality assurance and inspection reporting application built for manufacturing lines (TRB & DGBB bearing components). Features digitized parameter checks, real-time calculations, automated PDF generation, attachment merging, and cloud persistence with Supabase.

---

## 📋 Table of Contents
- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Installation](#local-installation)
  - [Environment Configuration](#environment-configuration)
  - [Supabase Setup](#supabase-setup)
- [Running the Project](#-running-the-project)
- [Deployment Guide (Vercel)](#-deployment-guide-vercel)
- [Available Scripts](#-available-scripts)

---

## 🌟 Overview

The **SKF Quality Assurance Portal** streamlines the First-Off Inspection workflow across precision manufacturing channels:
* Digitizes inspection log sheets for operations including **Track Grinding**, **Bore Grinding**, and **Track Honing**.
* Enforces strict quality control through tolerance validation and sample measurement logging across Shifts (I, II, III).
* Automatically compiles, prints, and generates industry-standard A4 inspection PDFs with multi-document attachment support.
* Persists records and generated PDFs directly to the cloud using **Supabase** (PostgreSQL + Cloud Storage).

---

## ✨ Key Features

* **Digitized Inspection Forms**:
  * Dynamic form generation based on **Section** (`TRB` / `DGBB`), **Channel** (`T1` – `T6`), **Ring Section** (`Inner Ring` / `Outer Ring`), and **Shift**.
  * Multi-sample entry (e.g., 5 sample parts) for Track Diameter, Ovality, Track Angle, Crowning, Bore Diameter, Surface Roughness ($Ra$), VKR vibration parameters, and visual checks.
  * Machine release status tracking (`YES` / `NO`).
* **Automated PDF Generation & Merging**:
  * In-browser high-fidelity PDF compilation using `pdf-lib` and `html2pdf.js`.
  * Multi-page report generation with automatic merging of uploaded attachments/technical drawings into a unified document.
  * Print-optimized layout (`@media print` formatted for A4 portrait).
* **Reports Dashboard & Analytics**:
  * Search, filter, and view historical records by Date, Section, Channel, Ring Section, Machine Number, and Shift.
  * Instant modal previews, one-click PDF downloads, and manual PDF report uploads.
* **Cloud Sync with Local Fallback**:
  * Directly integrates with Supabase for PostgreSQL storage and cloud bucket asset hosting.
  * Functions seamlessly in offline/local state even if cloud credentials are not supplied.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend UI** | [React 18](https://react.dev/) | Component-based UI with interactive inspection tables |
| **Build Tool** | [Vite 5](https://vitejs.dev/) | Fast development server and optimized production bundler |
| **PDF Engine** | [pdf-lib](https://pdf-lib.js.org/) + `html2pdf.js` | Client-side PDF rendering, merging, and document assembly |
| **Backend as a Service** | [Supabase](https://supabase.com/) | PostgreSQL database, Row Level Security (RLS), and Cloud Storage |
| **Hosting & CI/CD** | [Vercel](https://vercel.com/) | Static single-page application hosting with edge delivery |

---

## 📁 Project Structure

```text
├── .gitignore                  # Root git ignore rules (node_modules, env, caches)
├── README.md                   # Project documentation
└── frontend/                   # React + Vite application
    ├── .env.example            # Environment variables template
    ├── .gitignore              # Frontend-specific ignore rules
    ├── index.html              # Entry HTML file
    ├── main.jsx                # React DOM root entry point
    ├── package.json            # Node dependencies and scripts
    ├── supabase_schema.sql     # Database tables and storage bucket SQL schema
    ├── vercel.json             # Vercel SPA routing rewrite rules
    ├── vite.config.js          # Vite build configuration & JSX loaders
    └── Frontend/
        ├── skf17.js            # Main Quality Assurance Application & inspection forms
        └── supabaseClient.js   # Supabase client, queries, and upload helpers
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** (v18.0.0 or higher recommended)
* **npm** (v9.0.0 or higher) or **yarn** / **pnpm**
* A free [Supabase](https://supabase.com/) account (optional for local mode, required for cloud persistence)

### Local Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd internship/frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

### Environment Configuration

Create a `.env` file in the `frontend` folder based on `.env.example`:

```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase project credentials:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> **Note**: If left blank or unconfigured, the portal runs in **Local Mode** with mock memory storage.

### Supabase Setup

To initialize the database and storage bucket on your Supabase project:
1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to the **SQL Editor** tab.
3. Click **New Query**, paste the full contents of [`frontend/supabase_schema.sql`](./frontend/supabase_schema.sql), and click **Run**.
4. This script sets up:
   - The `inspection_records` table with Row Level Security (RLS).
   - The `inspection-reports` public storage bucket for PDF files.
   - Public read/write access policies for records and report files.

---

## 💻 Running the Project

### Start Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

### Production Build
```bash
npm run build
```
The optimized production bundle will be output to `frontend/dist/`.

### Preview Production Build
```bash
npm run preview
```

---

## 🌐 Deployment Guide (Vercel)

This application can be deployed **100% on Vercel** without any separate backend server.

1. **Push your code to GitHub / GitLab / Bitbucket**:
   ```bash
   git add .
   git commit -m "feat: complete SKF quality inspection portal"
   git push origin main
   ```

2. **Import into Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/) and click **Add New** -> **Project**.
   - Select your repository.

3. **Configure Project Settings**:
   - **Root Directory**: Click **Edit** and choose `frontend` *(Important: the package.json is located inside `frontend/`)*.
   - **Framework Preset**: Vite (automatically detected).

4. **Add Environment Variables**:
   In the Vercel project settings, add the following under **Environment Variables**:
   - `VITE_SUPABASE_URL` = Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = Your Supabase anon/public key

5. **Deploy**:
   - Click **Deploy**. Vercel will build and deploy the app with global CDN distribution and SSL.

---

## 📜 Available Scripts

Run these inside the `frontend/` directory:

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts the local Vite development server with Hot Module Replacement (HMR) |
| `npm run build` | Compiles and optimizes assets into `dist/` for production |
| `npm run preview` | Locally serves the production build from `dist/` |

---

## 📄 License
This project is developed for quality assurance management and internal operations. All rights reserved.
