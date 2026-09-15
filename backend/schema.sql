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
