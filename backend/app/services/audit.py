from sqlalchemy.orm import Session
from typing import Optional, List
from app.models.audit import AuditLog
from app.core.config import settings

class AuditService:
    @staticmethod
    def log_action(
        db: Session,
        action: str,
        details: str,
        batch_id: Optional[str] = None,
        user: str = "system"
    ) -> AuditLog:
        """
        Creates and stores a new audit log record.
        """
        log_entry = AuditLog(
            batch_id=batch_id,
            action=action,
            user=user,
            details=details,
            engine_version=settings.ENGINE_VERSION
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry

    @staticmethod
    def get_audit_logs(db: Session) -> List[AuditLog]:
        """
        Retrieves all audit logs sorted by timestamp descending.
        """
        return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()
