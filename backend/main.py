import os
import shutil
import logging
from typing import List
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import text
from dotenv import load_dotenv

from database import get_db, init_db, engine
from models import InspectionRecord
from schemas import InspectionRecordSchema, FileUploadResponse

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("skf-portal-api")

app = FastAPI(
    title="SKF Quality Assurance Inspection Portal API",
    description="Python FastAPI backend connected to local PostgreSQL database for First Off Inspection Management.",
    version="1.0.0"
)

# CORS Configuration - allow all local dev origins and ports seamlessly
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Setup uploads directory
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount /uploads to serve static attached PDFs
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.on_event("startup")
def on_startup():
    """Ensure database tables and folders are initialized on startup."""
    init_db()

@app.get("/api/health", summary="Check API and Database Health")
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint to verify backend and PostgreSQL connectivity."""
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unreachable: {str(e)}"
    
    return {
        "status": "online",
        "database": db_status,
        "uploadsDir": UPLOAD_DIR
    }

@app.get("/api/records", summary="Fetch all inspection records")
def get_records(db: Session = Depends(get_db)):
    """Retrieves all inspection records from PostgreSQL sorted by newest first."""
    try:
        records = db.query(InspectionRecord).order_by(InspectionRecord.created_at.desc()).all()
        return [r.to_dict() for r in records]
    except Exception as e:
        logger.error(f"Error querying records from PostgreSQL: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database query error: {str(e)}"
        )

@app.get("/api/records/{record_id}", summary="Get a single inspection record by ID")
def get_record(record_id: str, db: Session = Depends(get_db)):
    """Fetches a specific inspection record by its ID (e.g. REC-872)."""
    record = db.query(InspectionRecord).filter(InspectionRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Inspection record not found")
    return record.to_dict()

@app.post("/api/records", summary="Create or update an inspection record")
def save_record(payload: InspectionRecordSchema, db: Session = Depends(get_db)):
    """Inserts a new record or updates an existing record in PostgreSQL."""
    try:
        existing = db.query(InspectionRecord).filter(InspectionRecord.id == payload.id).first()
        
        record_data = {
            "id": payload.id,
            "date": payload.date,
            "section": payload.section,
            "channel": payload.channel,
            "ring_section": payload.ring_section or payload.ringSection,
            "machine": payload.machine,
            "format_no": payload.format_no or payload.formatNo,
            "operation": payload.operation,
            "type": payload.type,
            "shift": payload.shift,
            "inspector": payload.inspector,
            "status": payload.status,
            "form_data": payload.form_data or payload.formData or {},
            "table_data": payload.table_data or payload.tableData or [],
            "pdf_url": payload.pdf_url or payload.pdfUrl,
            "attachment_url": payload.attachment_url or payload.attachmentUrl,
            "attachment_name": payload.attachment_name or payload.attachmentName,
        }

        if existing:
            for key, val in record_data.items():
                setattr(existing, key, val)
            db.commit()
            db.refresh(existing)
            logger.info(f"Updated record in PostgreSQL: {payload.id}")
            return existing.to_dict()
        else:
            new_record = InspectionRecord(**record_data)
            db.add(new_record)
            db.commit()
            db.refresh(new_record)
            logger.info(f"Created new record in PostgreSQL: {payload.id}")
            return new_record.to_dict()
    except Exception as e:
        db.rollback()
        logger.error(f"Error saving record {payload.id} to PostgreSQL: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database save error: {str(e)}"
        )

@app.delete("/api/records/{record_id}", summary="Delete an inspection record")
def delete_record(record_id: str, db: Session = Depends(get_db)):
    """Deletes an inspection record by its ID."""
    record = db.query(InspectionRecord).filter(InspectionRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Inspection record not found")
    db.delete(record)
    db.commit()
    return {"message": f"Record {record_id} deleted successfully"}

@app.post("/api/upload", response_model=FileUploadResponse, summary="Upload an inspection PDF or attachment")
async def upload_file(request: Request, file: UploadFile = File(...)):
    """Saves an uploaded PDF to backend/uploads and returns its accessible URL."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    # Generate a safe filename
    filename = f"{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        file_size_kb = os.path.getsize(file_path) / 1024
        base_url = str(request.base_url).rstrip("/")
        public_url = f"{base_url}/uploads/{filename}"

        logger.info(f"File uploaded successfully: {filename} ({file_size_kb:.1f} KB)")

        return FileUploadResponse(
            url=public_url,
            name=file.filename,
            size=f"{file_size_kb:.1f} KB"
        )
    except Exception as e:
        logger.error(f"Failed to save uploaded file {filename}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=True)
