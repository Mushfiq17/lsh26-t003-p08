from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class SubjectResult(Base):
    __tablename__ = "subject_results"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(String, ForeignKey("students.student_id", ondelete="CASCADE"), index=True, nullable=False)
    subject_code = Column(String, index=True, nullable=False)
    subject_type = Column(String, nullable=False)  # COMPULSORY or OPTIONAL
    theory_mark = Column(Float, nullable=True)  # Null when absent
    theory_max = Column(Float, nullable=False, default=100.0)
    practical_mark = Column(Float, nullable=True)  # Null when absent
    practical_max = Column(Float, nullable=False, default=0.0)
    total_mark = Column(Float, nullable=True)  # Null when absent
    status = Column(String, index=True, nullable=False)  # PASS, FAIL, ABSENT
    gp = Column(Float, nullable=False, default=0.0)
    letter_grade = Column(String, nullable=False, default="F")
    rule_code = Column(String, nullable=False)
    explanation = Column(Text, nullable=False)

    # Relationships
    student = relationship("Student", back_populates="subject_results")
