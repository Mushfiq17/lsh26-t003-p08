from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Dict, Any, Tuple
from app.models.batch import Batch
from app.models.student import Student
from app.models.subject import SubjectResult
from app.models.result import ResultSummary
from app.schemas.processing import StudentMarksInput, ValidationErrorDetail, BatchProcessResponse
from app.services.grading_engine import GradingEngine
from app.services.audit import AuditService
from app.core.config import settings

class ResultProcessor:
    @staticmethod
    def validate_batch(students: List[StudentMarksInput]) -> List[ValidationErrorDetail]:
        """
        Validates the entire batch dataset for consistency and bounds.
        """
        errors = []
        seen_student_ids = set()

        for idx, student in enumerate(students):
            row_num = idx + 1
            student_id = student.student_id

            # 1. Check student ID duplicates in the batch
            if student_id in seen_student_ids:
                errors.append(ValidationErrorDetail(
                    row=row_num,
                    student_id=student_id,
                    field="student_id",
                    error_code="DUPLICATE_STUDENT_ID",
                    message=f"Duplicate Student ID '{student_id}' found in the batch."
                ))
            else:
                seen_student_ids.add(student_id)

            # 2. Check student metadata existence
            if not student.name or not student.name.strip():
                errors.append(ValidationErrorDetail(
                    row=row_num,
                    student_id=student_id,
                    field="name",
                    error_code="MISSING_STUDENT_NAME",
                    message="Student name is missing."
                ))

            if not student.class_name or not student.class_name.strip():
                errors.append(ValidationErrorDetail(
                    row=row_num,
                    student_id=student_id,
                    field="class_name",
                    error_code="MISSING_CLASS_NAME",
                    message="Class name is missing."
                ))

            # 3. Grading Engine specific marks bounds & requirements checks
            student_errors = GradingEngine.validate_student_marks(
                optional_subject=student.optional_subject,
                marks=student.marks
            )

            for err in student_errors:
                errors.append(ValidationErrorDetail(
                    row=row_num,
                    student_id=student_id,
                    field=err["field"],
                    error_code=err["error_code"],
                    message=err["message"]
                ))

        return errors

    @classmethod
    def process_batch(
        cls,
        db: Session,
        class_name: str,
        students: List[StudentMarksInput],
        custom_batch_id: str = None
    ) -> BatchProcessResponse:
        """
        Processes a batch of students. Runs validation first, then executes the grading engine inside a database transaction.
        """
        received_count = len(students)
        
        # 1. Complete validation
        validation_errors = cls.validate_batch(students)
        if validation_errors:
            # If invalid records exist, log a failed batch attempt and return
            batch_id = custom_batch_id or f"BATCH-{class_name}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            
            # Create a failed batch record
            fail_batch = Batch(
                batch_id=batch_id,
                class_name=class_name,
                total_students=received_count,
                processed_students=0,
                passed=0,
                failed=0,
                verification_required=0,
                errors=len(validation_errors),
                status="FAILED",
                engine_version=settings.ENGINE_VERSION,
                completed_at=datetime.now()
            )
            db.add(fail_batch)
            db.commit()

            AuditService.log_action(
                db=db,
                action="BATCH_PROCESS_FAILED",
                details=f"Batch {batch_id} for class {class_name} failed validation with {len(validation_errors)} errors.",
                batch_id=batch_id
            )

            return BatchProcessResponse(
                batch_id=batch_id,
                received=received_count,
                valid=0,
                invalid=received_count,
                processed=0,
                passed=0,
                failed=0,
                verification_required=0,
                errors=validation_errors
            )

        # 2. Batch is valid, setup batch execution
        batch_id = custom_batch_id or f"BATCH-{class_name}-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        batch = Batch(
            batch_id=batch_id,
            class_name=class_name,
            total_students=received_count,
            processed_students=0,
            passed=0,
            failed=0,
            verification_required=0,
            errors=0,
            status="PROCESSING",
            engine_version=settings.ENGINE_VERSION
        )
        db.add(batch)
        db.commit()
        db.refresh(batch)

        passed_count = 0
        failed_count = 0
        verification_required_count = 0

        try:
            for student_input in students:
                # Run deterministic engine
                calc = GradingEngine.calculate(
                    student_id=student_input.student_id,
                    name=student_input.name,
                    class_name=student_input.class_name,
                    optional_subject=student_input.optional_subject,
                    marks=student_input.marks
                )

                # Upsert Student Registry
                student = db.query(Student).filter(Student.student_id == student_input.student_id).first()
                if student:
                    student.name = student_input.name
                    student.class_name = student_input.class_name
                    student.optional_subject = student_input.optional_subject
                else:
                    student = Student(
                        student_id=student_input.student_id,
                        name=student_input.name,
                        class_name=student_input.class_name,
                        optional_subject=student_input.optional_subject
                    )
                    db.add(student)

                # Force refresh session to bind relationships
                db.flush()

                # Clean existing Subject Results and Result Summaries (Idempotency)
                db.query(SubjectResult).filter(SubjectResult.student_id == student_input.student_id).delete()
                db.query(ResultSummary).filter(ResultSummary.student_id == student_input.student_id).delete()

                # Write SubjectResult records
                for sub in calc["subjects"]:
                    sub_record = SubjectResult(
                        student_id=student_input.student_id,
                        subject_code=sub["subject_code"],
                        subject_type=sub["subject_type"],
                        theory_mark=sub["theory_mark"],
                        theory_max=sub["theory_max"],
                        practical_mark=sub["practical_mark"],
                        practical_max=sub["practical_max"],
                        total_mark=sub["total_mark"],
                        status=sub["status"],
                        gp=sub["gp"],
                        letter_grade=sub["letter_grade"],
                        rule_code=sub["rule_code"],
                        explanation=sub["explanation"]
                    )
                    db.add(sub_record)

                # Write ResultSummary record
                summary_record = ResultSummary(
                    student_id=student_input.student_id,
                    uncancelled_gpa=calc["uncancelled_gpa"],
                    final_gpa=calc["final_gpa"],
                    final_grade=calc["final_grade"],
                    final_status=calc["final_status"],
                    optional_contribution=calc["optional_contribution"],
                    compulsory_failure=calc["compulsory_failure"],
                    override_applied=calc["override_applied"],
                    override_code=calc["override_code"],
                    override_reason=calc["override_reason"],
                    engine_version=settings.ENGINE_VERSION
                )
                db.add(summary_record)

                # Increment statistics
                if calc["final_status"] == "PASS":
                    passed_count += 1
                else:
                    failed_count += 1

                # Review triggers:
                # - Optional GP <= 2.0 (triggers optional review list)
                # - Practical subject fails (triggers practical-fail review list)
                # - Absent in any subject (triggers absent list)
                is_optional_review = False
                is_practical_fail = False
                is_absent = False

                for sub in calc["subjects"]:
                    if sub["subject_type"] == "OPTIONAL" and sub["gp"] <= 2.0:
                        is_optional_review = True
                    if sub["status"] == "FAIL" and sub["rule_code"] in (
                        "PRACTICAL_DUAL_THRESHOLD",
                        "THEORY_THRESHOLD_FAIL",
                        "PRACTICAL_THRESHOLD_FAIL"
                    ):
                        is_practical_fail = True
                    if sub["status"] == "ABSENT":
                        is_absent = True

                if is_optional_review or is_practical_fail or is_absent:
                    verification_required_count += 1

            # Finalize Batch
            batch.processed_students = received_count
            batch.passed = passed_count
            batch.failed = failed_count
            batch.verification_required = verification_required_count
            batch.status = "COMPLETED"
            batch.completed_at = datetime.now()

            db.commit()

            AuditService.log_action(
                db=db,
                action="BATCH_PROCESS_SUCCESS",
                details=f"Batch {batch_id} processed: {received_count} students ({passed_count} passed, {failed_count} failed, {verification_required_count} verification required).",
                batch_id=batch_id
            )

            return BatchProcessResponse(
                batch_id=batch_id,
                received=received_count,
                valid=received_count,
                invalid=0,
                processed=received_count,
                passed=passed_count,
                failed=failed_count,
                verification_required=verification_required_count,
                errors=[]
            )

        except Exception as e:
            db.rollback()
            batch.status = "FAILED"
            batch.completed_at = datetime.now()
            db.commit()

            AuditService.log_action(
                db=db,
                action="BATCH_PROCESS_FATAL_ERROR",
                details=f"Batch {batch_id} encountered fatal error: {str(e)}",
                batch_id=batch_id
            )
            raise e
