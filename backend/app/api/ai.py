from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.analytics import AnalyticsService
from app.services.ai_insights import AIInsightsService
from app.models.student import Student
from app.models.subject import SubjectResult

router = APIRouter(prefix="/ai", tags=["ai"])

@router.get("/insights")
async def get_class_insights(db: Session = Depends(get_db)):
    """
    Generates AI executive insights on overall school result performance using OpenRouter.
    """
    analytics = AnalyticsService.get_analytics(db)
    insights = await AIInsightsService.generate_class_insights(analytics)
    return {"insights": insights}

@router.get("/student-advice/{student_id}")
async def get_student_advice(student_id: str, db: Session = Depends(get_db)):
    """
    Generates personalized AI academic advice for an individual student.
    """
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    subjects = db.query(SubjectResult).filter(SubjectResult.student_id == student_id).all()
    student_data = {
        "name": student.name,
        "student_id": student.student_id,
        "result_summary": {
            "final_status": student.result_summary.final_status if student.result_summary else "N/A",
            "final_gpa": student.result_summary.final_gpa if student.result_summary else 0.0,
            "final_grade": student.result_summary.final_grade if student.result_summary else "N/A"
        },
        "subjects": [
            {
                "subject_code": s.subject_code,
                "letter_grade": s.letter_grade,
                "gp": s.gp,
                "total_mark": s.total_mark
            } for s in subjects
        ]
    }

    advice = await AIInsightsService.generate_student_advice(student_data)
    return {"advice": advice}
