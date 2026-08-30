from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class EngineInfo(BaseModel):
    name: str = Field(..., examples=["Deterministic Grading Engine"])
    version: str = Field(..., examples=["1.0"])

class TraceStep(BaseModel):
    step_number: Optional[int] = Field(None, examples=[1])
    step: str = Field(..., examples=["OPTIONAL_CONTRIBUTION"])
    rule_name: Optional[str] = Field(None, examples=["Optional Subject Contribution"])
    status: Optional[str] = Field(None, examples=["PASSED"])
    input: Any = Field(..., description="The inputs consumed by this step")
    rule_code: Optional[str] = Field(None, examples=["OPTIONAL_BONUS"])
    calculation: str = Field(..., examples=["max(0, 4.0 - 2.0) = 2.0"])
    output: Any = Field(..., description="The output produced by this step")
    explanation: str = Field(..., examples=["Optional GP above 2.0 contributes the excess amount to the GPA numerator."])

class StudentTraceResponse(BaseModel):
    student_id: str = Field(..., examples=["EDGE-01"])
    student_name: str = Field(..., examples=["High Average / Compulsory Failure"])
    class_name: str = Field(..., examples=["9-A"])
    engine: EngineInfo
    pipeline: List[str] = Field(..., description="The order of pipeline execution stages")
    steps: List[TraceStep]
