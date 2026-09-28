import os
import shutil
import logging
import uuid
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import text
from dotenv import load_dotenv

from database import get_db, init_db, engine, SessionLocal
from models import InspectionRecord, User, hash_password, verify_password
from schemas import (
    InspectionRecordSchema,
    FileUploadResponse,
    UserCreateSchema,
    UserUpdateSchema,
    UserPasswordUpdateSchema,
    UserStatusUpdateSchema,
    LoginRequestSchema,
    LoginResponseSchema
)

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("skf-portal-api")

app = FastAPI(
    title="SKF Quality Assurance Inspection Portal API",
    description="Python FastAPI backend connected to local PostgreSQL database for First Off Inspection Management & User Authentication.",
    version="1.1.0"
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

def seed_default_users():
    """Seeds default admin and sample plant-floor operator users if none exist."""
    db = SessionLocal()
    try:
        existing_users = db.query(User).count()
        if existing_users == 0:
            logger.info("No users found. Seeding default Admin and Operators...")
            defaults = [
                {
                    "email": "admin@skf.com",
                    "full_name": "Admin User",
                    "password_hash": hash_password("admin123"),
                    "role": "Admin",
                    "channel": "All",
                    "status": "Active"
                },
                {
                    "email": "operator@skf.com",
                    "full_name": "Operator User",
                    "password_hash": hash_password("user123"),
                    "role": "User",
                    "channel": "T1",
                    "status": "Active"
                },
                {
                    "email": "mandar.thorat@skf.com",
                    "full_name": "Mandar Thorat",
                    "password_hash": hash_password("skf123"),
                    "role": "User",
                    "channel": "T1",
                    "status": "Active"
                },
                {
                    "email": "abdul.shaikji@skf.com",
                    "full_name": "Abdul Shaikji",
                    "password_hash": hash_password("skf123"),
                    "role": "User",
                    "channel": "T2",
                    "status": "Active"
                },
                {
                    "email": "ajay.a.shinde@skf.com",
                    "full_name": "Ajay Shinde",
                    "password_hash": hash_password("skf123"),
                    "role": "User",
                    "channel": "T3",
                    "status": "Active"
                }
            ]
            for u in defaults:
                db.add(User(**u))
            db.commit()
            logger.info("Default users seeded successfully.")
    except Exception as e:
        db.rollback()
        logger.warning(f"Error seeding default users: {e}")
    finally:
        db.close()

@app.on_event("startup")
def on_startup():
    """Ensure database tables, default users, and uploads folder are initialized."""
    init_db()
    seed_default_users()

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

# =====================================================================
# AUTHENTICATION ENDPOINTS
# =====================================================================

@app.post("/api/auth/login", response_model=LoginResponseSchema, summary="Authenticate user")
def login(payload: LoginRequestSchema, db: Session = Depends(get_db)):
    """Validates user credentials and returns session information."""
    email_clean = payload.email.strip().lower()
    user = db.query(User).filter(User.email.ilike(email_clean)).first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please check your credentials."
        )

    if user.status != "Active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been disabled. Please contact the administrator."
        )

    session_token = f"skf_token_{user.id}_{uuid.uuid4().hex[:12]}"
    logger.info(f"User logged in successfully: {user.email} (Role: {user.role})")
    
    return LoginResponseSchema(
        token=session_token,
        user=user.to_dict()
    )

# =====================================================================
# USER MANAGEMENT ENDPOINTS (Admin Control)
# =====================================================================

@app.get("/api/users", summary="List all plant floor users")
def get_users(db: Session = Depends(get_db)):
    """Retrieves all registered users ordered by ID."""
    try:
        users = db.query(User).order_by(User.id.asc()).all()
        return [u.to_dict() for u in users]
    except Exception as e:
        logger.error(f"Error querying users from PostgreSQL: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database query error: {str(e)}"
        )

@app.post("/api/users", summary="Add a new plant floor user")
def create_user(payload: UserCreateSchema, db: Session = Depends(get_db)):
    """Creates a new user account with hashed password."""
    email_clean = payload.email.strip().lower()
    existing = db.query(User).filter(User.email.ilike(email_clean)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email '{payload.email}' already exists."
        )

    try:
        new_user = User(
            email=email_clean,
            full_name=payload.fullName.strip(),
            password_hash=hash_password(payload.password),
            role="Admin" if payload.role and payload.role.lower() == "admin" else "User",
            channel=payload.channel.strip() if payload.channel else "",
            status="Active"
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        logger.info(f"Created new user: {new_user.email} ({new_user.role})")
        return new_user.to_dict()
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating user {payload.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database save error: {str(e)}"
        )

@app.put("/api/users/{user_id}", summary="Update user details")
def update_user(user_id: int, payload: UserUpdateSchema, db: Session = Depends(get_db)):
    """Updates user information (Name, Email, Role, Channel, Status)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        if payload.email is not None:
            user.email = payload.email.strip().lower()
        if payload.fullName is not None:
            user.full_name = payload.fullName.strip()
        if payload.role is not None:
            user.role = "Admin" if payload.role.lower() == "admin" else "User"
        if payload.channel is not None:
            user.channel = payload.channel.strip()
        if payload.status is not None:
            user.status = "Disabled" if payload.status.lower() == "disabled" else "Active"

        db.commit()
        db.refresh(user)
        logger.info(f"Updated user ID {user_id}: {user.email}")
        return user.to_dict()
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database update error: {str(e)}"
        )

@app.put("/api/users/{user_id}/password", summary="Change user password")
def update_password(user_id: int, payload: UserPasswordUpdateSchema, db: Session = Depends(get_db)):
    """Changes password for a user account."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not payload.password or len(payload.password.strip()) < 3:
        raise HTTPException(status_code=400, detail="Password must be at least 3 characters long.")

    try:
        user.password_hash = hash_password(payload.password.strip())
        db.commit()
        logger.info(f"Updated password for user ID {user_id}")
        return {"message": "Password updated successfully"}
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating password for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@app.patch("/api/users/{user_id}/status", summary="Toggle user Active / Disabled status")
def toggle_user_status(user_id: int, payload: UserStatusUpdateSchema, db: Session = Depends(get_db)):
    """Updates user status to Active or Disabled."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_status = "Disabled" if payload.status.lower() == "disabled" else "Active"
    user.status = new_status
    db.commit()
    db.refresh(user)
    logger.info(f"Updated user ID {user_id} status to {new_status}")
    return user.to_dict()

@app.delete("/api/users/{user_id}", summary="Delete user account")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Deletes a user account from database."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        db.delete(user)
        db.commit()
        logger.info(f"Deleted user ID {user_id}: {user.email}")
        return {"message": f"User {user.email} deleted successfully"}
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

# =====================================================================
# INSPECTION RECORDS ENDPOINTS
# =====================================================================

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
    logger.info(f"Deleted inspection record {record_id}")
    return {"message": f"Record {record_id} deleted successfully"}

@app.post("/api/upload", response_model=FileUploadResponse, summary="Upload an inspection PDF or attachment")
async def upload_file(request: Request, file: UploadFile = File(...)):
    """Saves an uploaded PDF to backend/uploads and returns its accessible URL."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

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
