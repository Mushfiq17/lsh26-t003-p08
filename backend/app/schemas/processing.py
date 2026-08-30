from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class StudentMarksInput(BaseModel):
    student_id: str = Field(..., examples=["STU-017"])
    name: str = Field(..., examples=["Alice Smith"])
    class_name: str = Field(..., examples=["9-A"])
    optional_subject: str = Field(..., description="Selected optional subject: HMT, AGR, REL", examples=["HMT"])
    # Dictionary mapping subject codes (e.g. BAN, PHY) to mark structures
    # E.g. {"BAN": {"total_mark": 82}, "PHY": {"theory_mark": 60, "practical_mark": 18}}
    marks: Dict[str, Any]

class BatchProcessInput(BaseModel):
    batch_id: Optional[str] = Field(None, description="Optional custom batch ID. If missing, a timestamp-based ID will be generated.", examples=["BATCH-2026-08-30"])
    class_name: str = Field(..., examples=["9-A"])
    students: List[StudentMarksInput]

class ValidationErrorDetail(BaseModel):
    row: Optional[int] = Field(None, examples=[17])
    student_id: Optional[str] = Field(None, examples=["STU-017"])
    field: str = Field(..., examples=["PHY.practical_mark"])
    error_code: str = Field(..., examples=["MARK_OUT_OF_RANGE"])
    message: str = Field(..., examples=["Practical mark cannot exceed 25."])

class BatchProcessResponse(BaseModel):
    batch_id: str = Field(..., examples=["BATCH-2026-08-30"])
    received: int = Field(..., examples=[62])
    valid: int = Field(..., examples=[62])
    invalid: int = Field(..., examples=[0])
    processed: int = Field(..., examples=[62])
    passed: int = Field(..., examples=[51])
    failed: int = Field(..., examples=[11])
    verification_required: int = Field(..., description="Count of students requiring manual verification (e.g. optional review, boundary reviews, etc.)", examples=[14])
    errors: List[ValidationErrorDetail] = []
