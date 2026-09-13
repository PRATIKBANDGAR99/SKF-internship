-- =========================================================
-- SQL SCHEMA FOR SUPABASE INSPECTION DATABASE & STORAGE
-- Run this in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- =========================================================

-- 1. Create the inspection_records table
CREATE TABLE IF NOT EXISTS public.inspection_records (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    section TEXT DEFAULT 'TRB',
    channel TEXT,
    ring_section TEXT,
    machine TEXT,
    format_no TEXT,
    operation TEXT,
    type TEXT,
    shift TEXT,
    inspector TEXT,
    status TEXT DEFAULT 'YES',
    form_data JSONB,
    table_data JSONB,
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.inspection_records ENABLE ROW LEVEL SECURITY;

-- Allow read & write access for authenticated & anonymous users
CREATE POLICY "Allow public read access"
ON public.inspection_records FOR SELECT
USING (true);

CREATE POLICY "Allow public insert and update"
ON public.inspection_records FOR ALL
USING (true)
WITH CHECK (true);

-- 2. Create the storage bucket for PDF files
INSERT INTO storage.buckets (id, name, public)
VALUES ('inspection-reports', 'inspection-reports', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public access to view & upload to the storage bucket
CREATE POLICY "Allow public read of inspection PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'inspection-reports');

CREATE POLICY "Allow public upload of inspection PDFs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'inspection-reports');

CREATE POLICY "Allow public update of inspection PDFs"
ON storage.objects FOR UPDATE
USING (bucket_id = 'inspection-reports');
