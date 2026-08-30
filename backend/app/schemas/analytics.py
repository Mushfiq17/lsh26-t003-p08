from pydantic import BaseModel, Field
from typing import Dict

class AnalyticsResponse(BaseModel):
    total_students: int = Field(..., examples=[62])
    pass_rate: float = Field(..., description="Percentage of students passing final grading", examples=[82.3])
    failure_rate: float = Field(..., description="Percentage of students failing final grading", examples=[17.7])
    average_uncancelled_gpa: float = Field(..., description="Mean average of raw calculated uncancelled GPAs", examples=[3.71])
    average_final_gpa: float = Field(..., description="Mean average of official final GPAs", examples=[3.22])
    practical_failures: int = Field(..., description="Total count of students failing due to practical threshold triggers", examples=[5])
    absences: int = Field(..., description="Total count of student absences across any subject", examples=[8])
    optional_review_count: int = Field(..., description="Count of students with optional GP <= 2.0 requiring optional review", examples=[10])
    grade_distribution: Dict[str, int] = Field(..., description="Frequency of final letter grades achieved", examples=[{"A+": 12, "A": 15, "F": 11}])
    subject_failure_counts: Dict[str, int] = Field(..., description="Total fails registered for each subject code", examples=[{"PHY": 5, "MAT": 3}])
    optional_contribution_distribution: Dict[str, int] = Field(..., description="Frequency of optional subject GPA contributions", examples=[{"0.0": 20, "1.0": 15, "2.0": 10, "3.0": 5}])
