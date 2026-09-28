from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict

class InspectionRecordSchema(BaseModel):
    model_config = ConfigDict(extra="ignore", populate_by_name=True, from_attributes=True)

    id: str
    date: Optional[str] = None
    section: Optional[str] = "TRB"
    channel: Optional[str] = None
    ring_section: Optional[str] = None
    ringSection: Optional[str] = None
    machine: Optional[str] = None
    format_no: Optional[str] = None
    formatNo: Optional[str] = None
    operation: Optional[str] = None
    type: Optional[str] = None
    shift: Optional[str] = None
    inspector: Optional[str] = None
    status: Optional[str] = "YES"
    form_data: Optional[Dict[str, Any]] = None
    formData: Optional[Dict[str, Any]] = None
    table_data: Optional[List[Any]] = None
    tableData: Optional[List[Any]] = None
    pdf_url: Optional[str] = None
    pdfUrl: Optional[str] = None
    attachment_url: Optional[str] = None
    attachmentUrl: Optional[str] = None
    attachment_name: Optional[str] = None
    attachmentName: Optional[str] = None

class FileUploadResponse(BaseModel):
    url: str
    name: str
    size: Optional[str] = None

# User Management Schemas
class UserCreateSchema(BaseModel):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    email: str
    fullName: str
    password: str
    role: Optional[str] = "User" # "Admin" or "User"
    channel: Optional[str] = ""

class UserUpdateSchema(BaseModel):
    model_config = ConfigDict(extra="ignore", populate_by_name=True)

    email: Optional[str] = None
    fullName: Optional[str] = None
    role: Optional[str] = None
    channel: Optional[str] = None
    status: Optional[str] = None

class UserPasswordUpdateSchema(BaseModel):
    password: str

class UserStatusUpdateSchema(BaseModel):
    status: str # "Active" or "Disabled"

class LoginRequestSchema(BaseModel):
    email: str
    password: str

class LoginResponseSchema(BaseModel):
    token: str
    user: Dict[str, Any]
