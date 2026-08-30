from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional
from app.schemas.result import SubjectResultResponse, ResultSummaryResponse

class StudentBase(BaseModel):
    student_id: str = Field(..., description="Unique alphanumeric identifier of the student", examples=["EDGE-01"])
    name: str = Field(..., description="Full name of the student", examples=["High Average / Compulsory Failure"])
    class_name: str = Field(..., description="Class or section of the student", examples=["9-A"])
    optional_subject: str = Field(..., description="Selected optional subject from HMT, AGR, REL", examples=["HMT"])

class StudentCreate(StudentBase):
    pass

class StudentResponse(StudentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class StudentDetailResponse(StudentResponse):
    subjects: List[SubjectResultResponse] = []
    result_summary: Optional[ResultSummaryResponse] = None

    class Config:
        from_attributes = True
