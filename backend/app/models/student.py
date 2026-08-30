from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    class_name = Column(String, index=True, nullable=False)
    optional_subject = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    subject_results = relationship("SubjectResult", back_populates="student", cascade="all, delete-orphan")
    result_summary = relationship("ResultSummary", back_populates="student", uselist=False, cascade="all, delete-orphan")
