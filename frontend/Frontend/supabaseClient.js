import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key'
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

/**
 * Uploads a PDF Blob to the Supabase Storage bucket 'inspection-reports'
 * @param {Blob} pdfBlob - The PDF file blob generated from html2pdf
 * @param {string} fileName - Destination file name (e.g. 'REC-872.pdf')
 * @returns {Promise<string|null>} Public URL of the uploaded PDF or null
 */
export async function uploadPdfToStorage(pdfBlob, fileName) {
  if (!supabase || !isSupabaseConfigured) {
    console.warn('Supabase is not configured. PDF will not be uploaded to cloud storage.');
    return null;
  }

  try {
    const { data, error } = await supabase.storage
      .from('inspection-reports')
      .upload(`reports/${fileName}`, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (error) {
      console.error('Error uploading PDF to Supabase Storage:', error.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('inspection-reports')
      .getPublicUrl(`reports/${fileName}`);

    return publicUrlData?.publicUrl || null;
  } catch (err) {
    console.error('Failed to upload PDF:', err);
    return null;
  }
}

/**
 * Fetches all inspection records from Supabase
 * @returns {Promise<Array>} List of records
 */
export async function fetchInspectionRecords() {
  if (!supabase || !isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from('inspection_records')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching inspection records:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Failed to fetch records:', err);
    return null;
  }
}

/**
 * Saves or updates an inspection record in Supabase
 * @param {Object} record - The full record object
 * @returns {Promise<Object|null>} Saved record data or null
 */
export async function saveInspectionRecord(record) {
  if (!supabase || !isSupabaseConfigured) return null;

  try {
    const payload = {
      id: record.id,
      date: record.date || record.formData?.date || new Date().toISOString().split('T')[0],
      section: record.section || 'TRB',
      channel: record.channel || record.formData?.channelNo || '',
      ring_section: record.ringSection || record.formData?.grinding || '',
      machine: record.machine || record.formData?.machineNo || '',
      format_no: record.formatNo || record.formData?.formatNo || '',
      operation: record.operation || record.formData?.operation || '',
      type: record.type || record.formData?.type || '',
      shift: record.shift || record.formData?.shift || '',
      inspector: record.inspector || record.formData?.inspectorName || '',
      status: record.status || record.formData?.machineReleased || 'YES',
      form_data: record.formData || {},
      table_data: record.tableData || [],
      pdf_url: record.pdfUrl || null
    };

    const { data, error } = await supabase
      .from('inspection_records')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('Error saving record to Supabase:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Failed to save record:', err);
    return null;
  }
}
