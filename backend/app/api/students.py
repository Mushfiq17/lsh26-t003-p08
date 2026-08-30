from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from typing import List, Optional
from app.core.database import get_db
from app.models.student import Student
from app.models.result import ResultSummary
from app.models.subject import SubjectResult
from app.schemas.student import StudentDetailResponse
from app.schemas.trace import StudentTraceResponse
from app.services.grading_engine import GradingEngine
from app.services.trace_builder import TraceBuilder

router = APIRouter(prefix="/students", tags=["students"])

@router.get("")
def get_students(
    search: Optional[str] = Query(None, description="Search by student ID or name"),
    class_name: Optional[str] = Query(None, alias="class", description="Filter by class name"),
    status: Optional[str] = Query(None, description="Filter by final status (PASS/FAIL)"),
    optional: Optional[str] = Query(None, description="Filter by optional subject code"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size"),
    sort: Optional[str] = Query(None, description="Sort column (e.g. student_id, name, final_gpa, -final_gpa for desc)"),
    db: Session = Depends(get_db)
):
    """
    Get a paginated, filterable list of students with their grading results.
    """
    query = db.query(Student).outerjoin(ResultSummary, Student.student_id == ResultSummary.student_id)

    # Apply filters
    if search:
        query = query.filter(
            or_(
                Student.student_id.ilike(f"%{search}%"),
                Student.name.ilike(f"%{search}%")
            )
        )
    if class_name:
        query = query.filter(Student.class_name == class_name)
    if status:
        query = query.filter(ResultSummary.final_status == status.upper())
    if optional:
        query = query.filter(Student.optional_subject == optional.upper())

    # Sorting
    if sort:
        descending = sort.startswith("-")
        col_name = sort.lstrip("-")
        
        # Resolve column
        if col_name == "student_id":
            sort_attr = Student.student_id
        elif col_name == "name":
            sort_attr = Student.name
        elif col_name == "class_name" or col_name == "class":
            sort_attr = Student.class_name
        elif col_name == "final_gpa":
            sort_attr = ResultSummary.final_gpa
        elif col_name == "uncancelled_gpa":
            sort_attr = ResultSummary.uncancelled_gpa
        else:
            sort_attr = Student.student_id

        if descending:
            query = query.order_by(desc(sort_attr))
        else:
            query = query.order_by(asc(sort_attr))
    else:
        # Default sort
        query = query.order_by(Student.student_id)

    # Pagination calculation
    total = query.count()
    offset = (page - 1) * page_size
    students_list = query.offset(offset).limit(page_size).all()

    pages = (total + page_size - 1) // page_size if total > 0 else 1

    # Form responses manually to avoid nested query serialization overhead
    result_data = []
    for s in students_list:
        # Load subject results
        subjects = db.query(SubjectResult).filter(SubjectResult.student_id == s.student_id).all()
        # Format the student detail
        result_data.append({
            "id": s.id,
            "student_id": s.student_id,
            "name": s.name,
            "class_name": s.class_name,
            "optional_subject": s.optional_subject,
            "created_at": s.created_at,
            "subjects": [
                {
                    "subject_code": sub.subject_code,
                    "subject_type": sub.subject_type,
                    "theory_mark": sub.theory_mark,
                    "theory_max": sub.theory_max,
                    "practical_mark": sub.practical_mark,
                    "practical_max": sub.practical_max,
                    "total_mark": sub.total_mark,
                    "status": sub.status,
                    "gp": sub.gp,
                    "letter_grade": sub.letter_grade,
                    "rule_code": sub.rule_code,
                    "explanation": sub.explanation
                } for sub in subjects
            ],
            "result_summary": {
                "uncancelled_gpa": s.result_summary.uncancelled_gpa,
                "final_gpa": s.result_summary.final_gpa,
                "final_grade": s.result_summary.final_grade,
                "final_status": s.result_summary.final_status,
                "optional_contribution": s.result_summary.optional_contribution,
                "compulsory_failure": s.result_summary.compulsory_failure,
                "override_applied": s.result_summary.override_applied,
                "override_code": s.result_summary.override_code,
                "override_reason": s.result_summary.override_reason,
                "engine_version": s.result_summary.engine_version
            } if s.result_summary else None
        })

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
        "students": result_data
    }

@router.get("/{student_id}", response_model=StudentDetailResponse)
def get_student(student_id: str, db: Session = Depends(get_db)):
    """
    Get a single student record with subject results and overall result summary.
    """
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=404,
            detail={
                "error": {
                    "code": "STUDENT_NOT_FOUND",
                    "message": f"Student {student_id} was not found."
                }
            }
        )

    subjects = db.query(SubjectResult).filter(SubjectResult.student_id == student_id).all()

    return {
        "id": student.id,
        "student_id": student.student_id,
        "name": student.name,
        "class_name": student.class_name,
        "optional_subject": student.optional_subject,
        "created_at": student.created_at,
        "subjects": [
            {
                "subject_code": sub.subject_code,
                "subject_type": sub.subject_type,
                "theory_mark": sub.theory_mark,
                "theory_max": sub.theory_max,
                "practical_mark": sub.practical_mark,
                "practical_max": sub.practical_max,
                "total_mark": sub.total_mark,
                "status": sub.status,
                "gp": sub.gp,
                "letter_grade": sub.letter_grade,
                "rule_code": sub.rule_code,
                "explanation": sub.explanation
            } for sub in subjects
        ],
        "result_summary": {
            "uncancelled_gpa": student.result_summary.uncancelled_gpa,
            "final_gpa": student.result_summary.final_gpa,
            "final_grade": student.result_summary.final_grade,
            "final_status": student.result_summary.final_status,
            "optional_contribution": student.result_summary.optional_contribution,
            "compulsory_failure": student.result_summary.compulsory_failure,
            "override_applied": student.result_summary.override_applied,
            "override_code": student.result_summary.override_code,
            "override_reason": student.result_summary.override_reason,
            "engine_version": student.result_summary.engine_version
        } if student.result_summary else None
    }

@router.get("/{student_id}/trace", response_model=StudentTraceResponse)
def get_student_trace(student_id: str, db: Session = Depends(get_db)):
    """
    Retrieve the step-by-step pipeline calculation trace for a student.
    """
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=404,
            detail={
                "error": {
                    "code": "STUDENT_NOT_FOUND",
                    "message": f"Student {student_id} was not found."
                }
            }
        )

    # Reconstruct raw marks from stored SubjectResult records
    subjects = db.query(SubjectResult).filter(SubjectResult.student_id == student_id).all()
    if not subjects:
        raise HTTPException(
            status_code=400,
            detail={
                "error": {
                    "code": "RESULTS_NOT_PROCESSED",
                    "message": f"Results for student {student_id} have not been processed yet."
                }
            }
        )

    raw_marks = {}
    for sub in subjects:
        if sub.theory_mark is None and sub.practical_mark is None and sub.total_mark is None:
            # Entirely absent
            raw_marks[sub.subject_code] = "AB"
        elif sub.practical_max > 0.0:
            # Practical subject
            raw_marks[sub.subject_code] = {
                "theory_mark": "AB" if sub.theory_mark is None else sub.theory_mark,
                "practical_mark": "AB" if sub.practical_mark is None else sub.practical_mark
            }
        else:
            # Normal subject
            raw_marks[sub.subject_code] = {
                "total_mark": "AB" if sub.total_mark is None else sub.total_mark
            }

    # Run calculations to retrieve output
    calc_result = GradingEngine.calculate(
        student_id=student.student_id,
        name=student.name,
        class_name=student.class_name,
        optional_subject=student.optional_subject,
        marks=raw_marks
    )

    # Build the explainable trace
    trace = TraceBuilder.build_trace(
        student_id=student.student_id,
        name=student.name,
        class_name=student.class_name,
        optional_subject=student.optional_subject,
        raw_marks=raw_marks,
        calc_result=calc_result
    )

    return trace
