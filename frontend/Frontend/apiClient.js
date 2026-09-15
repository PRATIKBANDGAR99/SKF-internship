/**
 * SKF Quality Assurance Portal - Python Backend REST API Client
 * Replaces Supabase SDK with direct HTTP REST calls to local FastAPI + PostgreSQL backend.
 */

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

/**
 * Checks backend and PostgreSQL connectivity
 * @returns {Promise<boolean>}
 */
export async function checkBackendHealth() {
  try {
    const resp = await fetch(`${API_BASE_URL}/api/health`, { method: 'GET' });
    if (!resp.ok) return false;
    const data = await resp.json();
    return data?.status === 'online';
  } catch (err) {
    console.warn('Python backend is currently not reachable:', err);
    return false;
  }
}

/**
 * Fetches all inspection records from the Python FastAPI + PostgreSQL backend
 * @returns {Promise<Array|null>}
 */
export async function fetchInspectionRecords() {
  try {
    const resp = await fetch(`${API_BASE_URL}/api/records`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!resp.ok) {
      console.warn(`Failed to fetch records from backend (status ${resp.status})`);
      return null;
    }

    const data = await resp.json();
    return Array.isArray(data) ? data : null;
  } catch (err) {
    console.warn('Could not connect to Python backend (offline or server not started):', err.message);
    return null;
  }
}

/**
 * Saves or updates an inspection record in PostgreSQL via Python FastAPI
 * @param {Object} record
 * @returns {Promise<Object>}
 */
export async function saveInspectionRecord(record) {
  try {
    const payload = {
      id: record.id,
      date: record.date || record.formData?.date || '',
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
      pdf_url: record.pdfUrl || null,
      attachment_url: record.attachmentUrl || record.formData?.attachmentUrl || null,
      attachment_name: record.attachmentName || record.formData?.attachmentName || null
    };

    const resp = await fetch(`${API_BASE_URL}/api/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      throw new Error(`Server returned ${resp.status}: ${errorText}`);
    }

    return await resp.json();
  } catch (err) {
    console.error('Failed to save record to Python backend:', err);
    throw err;
  }
}

/**
 * Uploads a PDF file or Blob to backend/uploads/ and returns its accessible URL
 * @param {File|Blob} fileOrBlob
 * @param {string} fileName
 * @returns {Promise<string|null>} Public URL of the uploaded file
 */
export async function uploadPdfToServer(fileOrBlob, fileName = 'attachment.pdf') {
  try {
    const formData = new FormData();
    const finalFile = fileOrBlob instanceof File 
      ? fileOrBlob 
      : new File([fileOrBlob], fileName, { type: 'application/pdf' });

    formData.append('file', finalFile);

    const resp = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData
    });

    if (!resp.ok) {
      console.warn(`Upload failed with status ${resp.status}`);
      return null;
    }

    const data = await resp.json();
    return data?.url || null;
  } catch (err) {
    console.warn('Failed to upload PDF to Python backend:', err);
    return null;
  }
}
