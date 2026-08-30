from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any
from app.models.result import ResultSummary
from app.models.subject import SubjectResult

class AnalyticsService:
    @staticmethod
    def get_analytics(db: Session) -> Dict[str, Any]:
        """
        Calculates and returns aggregate statistics from database results.
        """
        total_students = db.query(ResultSummary).count()
        if total_students == 0:
            return {
                "total_students": 0,
                "pass_rate": 0.0,
                "failure_rate": 0.0,
                "average_uncancelled_gpa": 0.0,
                "average_final_gpa": 0.0,
                "practical_failures": 0,
                "absences": 0,
                "optional_review_count": 0,
                "grade_distribution": {},
                "subject_failure_counts": {},
                "optional_contribution_distribution": {}
            }

        passed_count = db.query(ResultSummary).filter(ResultSummary.final_status == "PASS").count()
        failed_count = total_students - passed_count

        pass_rate = round((passed_count / total_students) * 100.0, 2)
        failure_rate = round((failed_count / total_students) * 100.0, 2)

        # Average GPAs
        avg_uncancelled = db.query(func.avg(ResultSummary.uncancelled_gpa)).scalar() or 0.0
        avg_final = db.query(func.avg(ResultSummary.final_gpa)).scalar() or 0.0

        # Practical threshold failures
        # Students who failed at least one subject due to practical/theory threshold checks
        practical_failures_student_count = (
            db.query(SubjectResult.student_id)
            .filter(SubjectResult.rule_code.in_([
                "THEORY_THRESHOLD_FAIL",
                "PRACTICAL_THRESHOLD_FAIL",
                "PRACTICAL_DUAL_THRESHOLD"
            ]))
            .distinct()
            .count()
        )

        # Absences (count of SubjectResult records with status 'ABSENT')
        total_absences = db.query(SubjectResult).filter(SubjectResult.status == "ABSENT").count()

        # Optional review count (Optional subject GP <= 2.0)
        optional_review_count = (
            db.query(SubjectResult)
            .filter(SubjectResult.subject_type == "OPTIONAL")
            .filter(SubjectResult.gp <= 2.0)
            .count()
        )

        # Grade distribution (e.g., {"A+": 12, "A": 15, "F": 11})
        grade_dist_raw = (
            db.query(ResultSummary.final_grade, func.count(ResultSummary.final_grade))
            .group_by(ResultSummary.final_grade)
            .all()
        )
        grade_distribution = {grade: count for grade, count in grade_dist_raw}

        # Subject failure counts (e.g. {"PHY": 5, "MAT": 3})
        # Include status == 'FAIL' or status == 'ABSENT'
        sub_fails_raw = (
            db.query(SubjectResult.subject_code, func.count(SubjectResult.subject_code))
            .filter(SubjectResult.status.in_(["FAIL", "ABSENT"]))
            .group_by(SubjectResult.subject_code)
            .all()
        )
        subject_failure_counts = {sub: count for sub, count in sub_fails_raw}

        # Optional contribution distribution (e.g. {"0.0": 20, "1.0": 15, "2.0": 10})
        opt_contrib_raw = (
            db.query(ResultSummary.optional_contribution, func.count(ResultSummary.optional_contribution))
            .group_by(ResultSummary.optional_contribution)
            .all()
        )
        # Convert float keys to string keys for JSON serialization
        optional_contribution_distribution = {
            f"{float(contrib):.1f}": count for contrib, count in opt_contrib_raw
        }

        return {
            "total_students": total_students,
            "pass_rate": pass_rate,
            "failure_rate": failure_rate,
            "average_uncancelled_gpa": round(avg_uncancelled, 2),
            "average_final_gpa": round(avg_final, 2),
            "practical_failures": practical_failures_student_count,
            "absences": total_absences,
            "optional_review_count": optional_review_count,
            "grade_distribution": grade_distribution,
            "subject_failure_counts": subject_failure_counts,
            "optional_contribution_distribution": optional_contribution_distribution
        }
