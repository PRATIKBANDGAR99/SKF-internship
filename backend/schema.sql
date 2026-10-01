-- =====================================================================
-- SQL SCHEMA FOR POSTGRESQL & PGADMIN 4
-- SKF Quality Assurance Portal - First Off Inspection Database
-- =====================================================================

-- 1. Create the database (Optional: run in pgAdmin if not created yet)
-- CREATE DATABASE skf_inspection_db;

-- 2. Create the inspection_records table
CREATE TABLE IF NOT EXISTS inspection_records (
    id VARCHAR(100) PRIMARY KEY,
    date VARCHAR(50),
    section VARCHAR(50) DEFAULT 'TRB',
    channel VARCHAR(50),
    ring_section VARCHAR(100),
    machine VARCHAR(100),
    format_no VARCHAR(100),
    operation VARCHAR(150),
    type VARCHAR(100),
    shift VARCHAR(20),
    inspector VARCHAR(100),
    status VARCHAR(20) DEFAULT 'YES',
    form_data JSONB,
    table_data JSONB,
    pdf_url TEXT,
    attachment_url TEXT,
    attachment_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for rapid filtering in View Reports
CREATE INDEX IF NOT EXISTS idx_inspection_records_date ON inspection_records(date);
CREATE INDEX IF NOT EXISTS idx_inspection_records_operation ON inspection_records(operation);
CREATE INDEX IF NOT EXISTS idx_inspection_records_machine ON inspection_records(machine);
CREATE INDEX IF NOT EXISTS idx_inspection_records_created_at ON inspection_records(created_at DESC);

-- 3. Create the users table for plant-floor accounts & roles
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'User' NOT NULL,
    channel VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 4. Seed default plant-floor users (hashed using salt 'skf_secure_salt_2026')
INSERT INTO users (email, full_name, password_hash, role, channel, status)
VALUES
    ('admin@skf.com', 'Admin User', '55a90ece5cd91f71603511f7ee49b2dfc549dc75650c7ebd978e977ad0e5c9c6', 'Admin', 'All', 'Active'),
    ('operator@skf.com', 'Operator User', '7ed666163dc78fdc275835b94578ecdc7b2624dc431704dc386ab32d52efe926', 'User', 'T1', 'Active'),
    ('mandar.thorat@skf.com', 'Mandar Thorat', 'f20cf6a9609056080c845fcae08e8135fb4b8e1f8d55c0c9f0eaa99d6b1a82c0', 'User', 'T1', 'Active'),
    ('abdul.shaikji@skf.com', 'Abdul Shaikji', 'f20cf6a9609056080c845fcae08e8135fb4b8e1f8d55c0c9f0eaa99d6b1a82c0', 'User', 'T2', 'Active'),
    ('ajay.a.shinde@skf.com', 'Ajay Shinde', 'f20cf6a9609056080c845fcae08e8135fb4b8e1f8d55c0c9f0eaa99d6b1a82c0', 'User', 'T3', 'Active')
ON CONFLICT (email) DO NOTHING;
