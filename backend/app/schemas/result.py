from pydantic import BaseModel, Field
from typing import List, Optional, Any

class PracticalCheck(BaseModel):
    component: str = Field(..., description="Component check: theory or practical", examples=["theory"])
    actual: Any = Field(..., description="Actual mark achieved or 'AB'", examples=[60.0])
    required: float = Field(..., description="Minimum required mark to pass this component", examples=[25.0])
    passed: bool = Field(..., description="True if threshold was met, otherwise False", examples=[True])

class SubjectResultResponse(BaseModel):
    subject_code: str = Field(..., examples=["PHY"])
    subject_type: str = Field(..., examples=["COMPULSORY"])
    theory_mark: Optional[float] = Field(None, examples=[60.0])
    theory_max: float = Field(..., examples=[75.0])
    practical_mark: Optional[float] = Field(None, examples=[7.0])
    practical_max: float = Field(..., examples=[25.0])
    total_mark: Optional[float] = Field(None, examples=[67.0])
    status: str = Field(..., description="PASS, FAIL, or ABSENT", examples=["FAIL"])
    gp: float = Field(..., description="Grade point value from 0.0 to 5.0", examples=[0.0])
    letter_grade: str = Field(..., description="Letter grade value", examples=["F"])
    rule_code: str = Field(..., examples=["PRACTICAL_THRESHOLD_FAIL"])
    explanation: str = Field(..., examples=["Physics: Theory passed, but Practical failed minimum."])
    checks: List[PracticalCheck] = []

    class Config:
        from_attributes = True

class ResultSummaryResponse(BaseModel):
    uncancelled_gpa: float = Field(..., examples=[4.33])
    final_gpa: float = Field(..., examples=[0.0])
    final_grade: str = Field(..., examples=["F"])
    final_status: str = Field(..., examples=["FAIL"])
    optional_contribution: float = Field(..., examples=[0.0])
    compulsory_failure: bool = Field(..., examples=[True])
    override_applied: bool = Field(..., examples=[True])
    override_code: Optional[str] = Field(None, examples=["COMPULSORY_FAILURE"])
    override_reason: Optional[str] = Field(None, examples=["At least one compulsory subject failed."])
    engine_version: str = Field(..., examples=["1.0"])

    class Config:
        from_attributes = True
