from sqlalchemy import Column, Integer, String, DateTime, func, Text
from app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, server_default=func.now(), index=True, nullable=False)
    batch_id = Column(String, index=True, nullable=True)
    action = Column(String, nullable=False)  # e.g., SEED_DEMO, PROCESS_BATCH, etc.
    user = Column(String, nullable=False, default="system")
    details = Column(Text, nullable=False)
    engine_version = Column(String, nullable=False)
