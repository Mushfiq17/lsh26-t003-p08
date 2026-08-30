from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.processing import BatchProcessInput, BatchProcessResponse
from app.services.result_processor import ResultProcessor
from app.services.audit import AuditService
from app.seed.demo_data import get_demo_students
from app.models.student import Student
from app.models.subject import SubjectResult
from app.models.result import ResultSummary
from app.models.batch import Batch
from app.models.audit import AuditLog

router = APIRouter(tags=["processing"])

@router.post("/process", response_model=BatchProcessResponse)
def process_results(payload: BatchProcessInput, db: Session = Depends(get_db)):
    """
    Validate and process a batch of student examination marks.
    If the batch contains validation errors, it will log a FAILED batch and return the errors list.
    """
    try:
        response = ResultProcessor.process_batch(
            db=db,
            class_name=payload.class_name,
            students=payload.students,
            custom_batch_id=payload.batch_id
        )
        return response
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": {
                    "code": "BATCH_PROCESS_ERROR",
                    "message": f"A fatal error occurred during batch processing: {str(e)}"
                }
            }
        )

@router.post("/seed/demo", response_model=BatchProcessResponse)
def seed_demo_data(db: Session = Depends(get_db)):
    """
    Idempotently resets the database and seeds it with the full demo dataset
    comprising 12 edge cases and 50 normal students (62+ total).
    """
    try:
        # 1. Resets database completely (resettable behavior)
        db.query(SubjectResult).delete()
        db.query(ResultSummary).delete()
        db.query(Student).delete()
        db.query(Batch).delete()
        db.query(AuditLog).delete()
        db.commit()

        # 2. Retrieve seed dataset
        demo_students = get_demo_students()

        # 3. Process demo students as a single batch
        batch_id = "BATCH-DEMO-SEED-2026"
        response = ResultProcessor.process_batch(
            db=db,
            class_name="9-A",
            students=demo_students,
            custom_batch_id=batch_id
        )

        # 4. Log the audit action
        AuditService.log_action(
            db=db,
            action="SEED_DEMO",
            details="Idempotently reset database and seeded 62 students (12 edge cases + 50 normal).",
            batch_id=batch_id,
            user="admin"
        )

        return response
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail={
                "error": {
                    "code": "SEED_DEMO_ERROR",
                    "message": f"A fatal error occurred during demo seeding: {str(e)}"
                }
            }
        )
