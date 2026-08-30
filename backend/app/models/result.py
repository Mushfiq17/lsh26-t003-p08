from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class ResultSummary(Base):
    __tablename__ = "result_summaries"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("students.student_id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    uncancelled_gpa = Column(Float, nullable=False, default=0.0)
    final_gpa = Column(Float, nullable=False, default=0.0)
    final_grade = Column(String, nullable=False, default="F")
    final_status = Column(String, index=True, nullable=False, default="FAIL")  # PASS or FAIL
    optional_contribution = Column(Float, nullable=False, default=0.0)
    compulsory_failure = Column(Boolean, nullable=False, default=False)
    override_applied = Column(Boolean, nullable=False, default=False)
    override_code = Column(String, nullable=True)
    override_reason = Column(Text, nullable=True)
    engine_version = Column(String, nullable=False)

    # Relationships
    student = relationship("Student", back_populates="result_summary")
