from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.models.student import Student
from app.models.subject import SubjectResult
from app.models.result import ResultSummary
from app.rules.grading_rules import SUBJECT_CONFIGS

class CheckingListsService:
    @staticmethod
    def get_optional_review_list(db: Session) -> List[Dict[str, Any]]:
        """
        Returns students whose optional subject GP is <= 2.0 (below contribution threshold).
        """
        results = (
            db.query(Student, SubjectResult)
            .join(SubjectResult, Student.student_id == SubjectResult.student_id)
            .filter(SubjectResult.subject_type == "OPTIONAL")
            .filter(SubjectResult.gp <= 2.0)
            .all()
        )

        review_list = []
        for student, sub_res in results:
            review_list.append({
                "student_id": student.student_id,
                "student_name": student.name,
                "optional_subject": student.optional_subject,
                "gp": sub_res.gp,
                "reason": "Optional GP is at or below the contribution threshold.",
                "trace_url": f"/students/{student.student_id}/trace"
            })
        return review_list

    @staticmethod
    def get_practical_failures_list(db: Session) -> List[Dict[str, Any]]:
        """
        Returns details of students who failed practical subjects due to threshold failures.
        """
        # Practical failures are identified by their status being FAIL and their rule_code being
        # THEORY_THRESHOLD_FAIL, PRACTICAL_THRESHOLD_FAIL, or PRACTICAL_DUAL_THRESHOLD
        results = (
            db.query(Student, SubjectResult)
            .join(SubjectResult, Student.student_id == SubjectResult.student_id)
            .filter(SubjectResult.status == "FAIL")
            .filter(SubjectResult.rule_code.in_([
                "THEORY_THRESHOLD_FAIL",
                "PRACTICAL_THRESHOLD_FAIL",
                "PRACTICAL_DUAL_THRESHOLD"
            ]))
            .all()
        )

        failures = []
        for student, sub_res in results:
            config = SUBJECT_CONFIGS.get(sub_res.subject_code, {})
            
            # Determine failed requirements
            failed_reqs = []
            if sub_res.rule_code in ("THEORY_THRESHOLD_FAIL", "PRACTICAL_DUAL_THRESHOLD"):
                failed_reqs.append(f"Theory minimum is {config.get('theory_min')}")
            if sub_res.rule_code in ("PRACTICAL_THRESHOLD_FAIL", "PRACTICAL_DUAL_THRESHOLD"):
                failed_reqs.append(f"Practical minimum is {config.get('practical_min')}")

            failures.append({
                "student_id": student.student_id,
                "student_name": student.name,
                "subject": sub_res.subject_code,
                "theory": sub_res.theory_mark,
                "theory_max": sub_res.theory_max,
                "practical": sub_res.practical_mark,
                "practical_max": sub_res.practical_max,
                "failed_requirement": " and ".join(failed_reqs),
                "trace_url": f"/students/{student.student_id}/trace"
            })
        return failures

    @staticmethod
    def get_absences_list(db: Session) -> List[Dict[str, Any]]:
        """
        Returns all subjects where students were absent, showing consequence details.
        """
        results = (
            db.query(Student, SubjectResult)
            .join(SubjectResult, Student.student_id == SubjectResult.student_id)
            .filter(SubjectResult.status == "ABSENT")
            .all()
        )

        absences = []
        for student, sub_res in results:
            consequence = ""
            if sub_res.subject_type == "COMPULSORY":
                consequence = "Compulsory absence causes the official result to be F."
            else:
                consequence = "Optional subject absence contributes 0 to GPA and does not independently cause a compulsory failure."

            absences.append({
                "student_id": student.student_id,
                "student_name": student.name,
                "subject": sub_res.subject_code,
                "subject_type": sub_res.subject_type,
                "absence_status": "ABSENT",
                "consequence": consequence,
                "trace_url": f"/students/{student.student_id}/trace"
            })
        return absences
