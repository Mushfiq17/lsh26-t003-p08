from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from pydantic import BaseModel, Field
from app.core.database import get_db
from app.services.audit import AuditService

router = APIRouter(prefix="/audit", tags=["audit"])

class AuditLogResponse(BaseModel):
    id: int
    timestamp: datetime
    batch_id: str | None = None
    action: str
    user: str
    details: str
    engine_version: str

    class Config:
        from_attributes = True

@router.get("", response_model=List[AuditLogResponse])
def get_audit_trail(db: Session = Depends(get_db)):
    """
    Retrieves the system-wide result processing audit trail.
    """
    return AuditService.get_audit_logs(db)
