from sqlalchemy import Column, Integer, String, DateTime, func
from app.core.database import Base

class Batch(Base):
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(String, unique=True, index=True, nullable=False)
    class_name = Column(String, index=True, nullable=False)
    total_students = Column(Integer, nullable=False, default=0)
    processed_students = Column(Integer, nullable=False, default=0)
    passed = Column(Integer, nullable=False, default=0)
    failed = Column(Integer, nullable=False, default=0)
    verification_required = Column(Integer, nullable=False, default=0)
    errors = Column(Integer, nullable=False, default=0)
    status = Column(String, index=True, nullable=False, default="PENDING")  # PENDING, PROCESSING, COMPLETED, FAILED
    engine_version = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    completed_at = Column(DateTime, nullable=True)
