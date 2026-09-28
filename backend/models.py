import hashlib
from sqlalchemy import Column, String, Text, DateTime, JSON, Integer
from sqlalchemy.sql import func
from database import Base

def hash_password(password: str) -> str:
    """Hashes a password with SHA-256 and a dedicated salt."""
    salt = "skf_secure_salt_2026"
    return hashlib.sha256((salt + password).encode("utf-8")).hexdigest()

def verify_password(plain_password: str, hashed: str) -> bool:
    """Verifies plain password against stored hash."""
    return hash_password(plain_password) == hashed

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(150), unique=True, index=True, nullable=False)
    full_name = Column(String(150), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="User", nullable=False) # "Admin" or "User"
    channel = Column(String(100), nullable=True)
    status = Column(String(50), default="Active", nullable=False) # "Active" or "Disabled"
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "fullName": self.full_name,
            "role": self.role,
            "channel": self.channel or "",
            "status": self.status,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None
        }

class InspectionRecord(Base):
    __tablename__ = "inspection_records"

    id = Column(String(100), primary_key=True, index=True)
    date = Column(String(50), nullable=True, index=True)
    section = Column(String(50), default="TRB", nullable=True)
    channel = Column(String(50), nullable=True)
    ring_section = Column(String(100), nullable=True)
    machine = Column(String(100), nullable=True, index=True)
    format_no = Column(String(100), nullable=True)
    operation = Column(String(150), nullable=True, index=True)
    type = Column(String(100), nullable=True)
    shift = Column(String(20), nullable=True)
    inspector = Column(String(100), nullable=True)
    status = Column(String(20), default="YES", nullable=True)
    form_data = Column(JSON, nullable=True)
    table_data = Column(JSON, nullable=True)
    pdf_url = Column(Text, nullable=True)
    attachment_url = Column(Text, nullable=True)
    attachment_name = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "date": self.date,
            "section": self.section,
            "channel": self.channel,
            "ringSection": self.ring_section,
            "machine": self.machine,
            "formatNo": self.format_no,
            "operation": self.operation,
            "type": self.type,
            "shift": self.shift,
            "inspector": self.inspector,
            "status": self.status,
            "formData": self.form_data or {},
            "tableData": self.table_data or [],
            "pdfUrl": self.pdf_url,
            "attachmentUrl": self.attachment_url,
            "attachmentName": self.attachment_name,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None
        }
