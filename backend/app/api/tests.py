from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel, Field
from app.services.grading_engine import GradingEngine
from app.rules.grading_rules import get_grade_by_marks
from app.rules import rule_codes
from app.core.database import get_db
from app.models.student import Student
from app.models.result import ResultSummary
from app.models.subject import SubjectResult

router = APIRouter(prefix="/tests", tags=["boundary-tests"])

class TestCaseResponse(BaseModel):
    name: str
    expected: Any
    actual: Any
    status: str
    category: str = "boundary"

class BoundaryTestsResponse(BaseModel):
    total: int
    passed: int
    failed: int
    status: str
    tests: List[TestCaseResponse]

class ResultFault(BaseModel):
    student_id: str
    student_name: str
    class_name: str
    fault_type: str
    fault_code: str
    subject: str
    detail: str
    severity: str  # HIGH / MEDIUM / LOW

class ResultFaultsResponse(BaseModel):
    total_students: int
    faults_found: int
    students_at_risk: int
    faults: List[ResultFault]


def make_base_marks(override: dict = None) -> dict:
    """Helper: base marks with all passing values. HMT/AGR are practical subjects."""
    base = {
        "BAN": {"total_mark": 60},
        "ENG": {"total_mark": 60},
        "MAT": {"total_mark": 60},
        "PHY": {"theory_mark": 50, "practical_mark": 15},
        "CHE": {"theory_mark": 50, "practical_mark": 15},
        "BIO": {"theory_mark": 50, "practical_mark": 15},
        "HMT": {"theory_mark": 45, "practical_mark": 15},  # practical subject
    }
    if override:
        for k, v in override.items():
            base[k] = v
    return base


@router.get("/boundary", response_model=BoundaryTestsResponse)
def execute_boundary_tests():
    """
    Executes the predefined suite of 30 boundary tests directly against the
    Deterministic Grading Engine using the demo dataset rules.
    """
    test_results = []

    # ── Category 1: Grade Scale Boundaries (13 tests) ─────────────────────────
    boundaries = [
        (32,  0.0), (33,  1.0), (39,  1.0), (40,  2.0), (49,  2.0),
        (50,  3.0), (59,  3.0), (60,  3.5), (69,  3.5), (70,  4.0),
        (79,  4.0), (80,  5.0), (100, 5.0)
    ]
    for val, expected_gp in boundaries:
        res = get_grade_by_marks(val)
        actual = res["gp"]
        test_results.append({
            "name": f"Grade boundary: marks {val} → GP {expected_gp}",
            "expected": expected_gp,
            "actual": actual,
            "status": "PASS" if actual == expected_gp else "FAIL",
            "category": "grade_scale"
        })

    # ── Category 2: Theory Threshold (2 tests) ────────────────────────────────
    # T14: Theory below minimum (24/75) → PHY FAIL
    marks_14 = make_base_marks({"PHY": {"theory_mark": 24, "practical_mark": 15}})
    res_14 = GradingEngine.calculate("T14", "Test", "9-A", "HMT", marks_14)
    phy_14 = next(s for s in res_14["subjects"] if s["subject_code"] == "PHY")
    test_results.append({
        "name": "Theory below minimum (24/75) → PHY FAIL",
        "expected": "FAIL",
        "actual": phy_14["status"],
        "status": "PASS" if phy_14["status"] == "FAIL" and phy_14["gp"] == 0.0 else "FAIL",
        "category": "threshold"
    })

    # T15: Theory exactly minimum (25/75) → PHY PASS
    marks_15 = make_base_marks({"PHY": {"theory_mark": 25, "practical_mark": 15}})
    res_15 = GradingEngine.calculate("T15", "Test", "9-A", "HMT", marks_15)
    phy_15 = next(s for s in res_15["subjects"] if s["subject_code"] == "PHY")
    test_results.append({
        "name": "Theory exactly minimum (25/75) → PHY PASS",
        "expected": "PASS",
        "actual": phy_15["status"],
        "status": "PASS" if phy_15["status"] == "PASS" and phy_15["gp"] == 2.0 else "FAIL",
        "category": "threshold"
    })

    # ── Category 3: Practical Threshold (2 tests) ─────────────────────────────
    # T16: Practical below minimum (7/25) → PHY FAIL
    marks_16 = make_base_marks({"PHY": {"theory_mark": 60, "practical_mark": 7}})
    res_16 = GradingEngine.calculate("T16", "Test", "9-A", "HMT", marks_16)
    phy_16 = next(s for s in res_16["subjects"] if s["subject_code"] == "PHY")
    test_results.append({
        "name": "Practical below minimum (7/25) → PHY FAIL",
        "expected": "FAIL",
        "actual": phy_16["status"],
        "status": "PASS" if phy_16["status"] == "FAIL" and phy_16["gp"] == 0.0 else "FAIL",
        "category": "threshold"
    })

    # T17: Practical exactly minimum (8/25) → PHY PASS
    marks_17 = make_base_marks({"PHY": {"theory_mark": 60, "practical_mark": 8}})
    res_17 = GradingEngine.calculate("T17", "Test", "9-A", "HMT", marks_17)
    phy_17 = next(s for s in res_17["subjects"] if s["subject_code"] == "PHY")
    test_results.append({
        "name": "Practical exactly minimum (8/25) → PHY PASS",
        "expected": "PASS",
        "actual": phy_17["status"],
        "status": "PASS" if phy_17["status"] == "PASS" and phy_17["gp"] == 3.5 else "FAIL",
        "category": "threshold"
    })

    # ── Category 4: Optional Contribution (5 tests) ───────────────────────────
    optional_cases = [
        (1.0, {"theory_mark": 26, "practical_mark": 9},  0.0),  # total~35 → GP 1.0 → contrib 0
        (2.0, {"theory_mark": 34, "practical_mark": 11}, 0.0),  # total~45 → GP 2.0 → contrib 0
        (3.0, {"theory_mark": 42, "practical_mark": 13}, 1.0),  # total~55 → GP 3.0 → contrib 1
        (4.0, {"theory_mark": 57, "practical_mark": 18}, 2.0),  # total~75 → GP 4.0 → contrib 2
        (5.0, {"theory_mark": 65, "practical_mark": 20}, 3.0),  # total~85 → GP 5.0 → contrib 3
    ]
    for gp, hmt_marks, expected_contrib in optional_cases:
        marks = make_base_marks({"HMT": hmt_marks})
        res = GradingEngine.calculate("TOpt", "Test", "9-A", "HMT", marks)
        actual = res["optional_contribution"]
        test_results.append({
            "name": f"Optional GP {gp} → contribution = {expected_contrib}",
            "expected": expected_contrib,
            "actual": actual,
            "status": "PASS" if actual == expected_contrib else "FAIL",
            "category": "optional"
        })

    # ── Category 5: Override Rules (5 tests) ──────────────────────────────────
    # T23: Compulsory failure override → final GPA = 0.00
    marks_23 = make_base_marks({"BAN": {"total_mark": 30}})
    res_23 = GradingEngine.calculate("T23", "Test", "9-A", "HMT", marks_23)
    test_results.append({
        "name": "Compulsory fail (BAN=30) → final GPA = 0.00",
        "expected": 0.0,
        "actual": res_23["final_gpa"],
        "status": "PASS" if res_23["final_gpa"] == 0.0 and res_23["uncancelled_gpa"] > 0.0 else "FAIL",
        "category": "override"
    })

    # T24: Compulsory AB override
    marks_24 = make_base_marks({"BAN": "AB"})
    res_24 = GradingEngine.calculate("T24", "Test", "9-A", "HMT", marks_24)
    test_results.append({
        "name": "Compulsory AB (BAN) → final GPA = 0.00, FAIL",
        "expected": 0.0,
        "actual": res_24["final_gpa"],
        "status": "PASS" if res_24["final_gpa"] == 0.0 and res_24["final_status"] == "FAIL" else "FAIL",
        "category": "override"
    })

    # T25: Optional AB → still PASS
    marks_25 = make_base_marks({"HMT": "AB"})
    res_25 = GradingEngine.calculate("T25", "Test", "9-A", "HMT", marks_25)
    test_results.append({
        "name": "Optional AB (HMT) → final status PASS",
        "expected": "PASS",
        "actual": res_25["final_status"],
        "status": "PASS" if res_25["final_status"] == "PASS" and res_25["optional_contribution"] == 0.0 else "FAIL",
        "category": "override"
    })

    # T26: GPA cap at 5.00
    marks_26 = make_base_marks({
        "BAN": {"total_mark": 95}, "ENG": {"total_mark": 95}, "MAT": {"total_mark": 95},
        "PHY": {"theory_mark": 70, "practical_mark": 20},
        "CHE": {"theory_mark": 70, "practical_mark": 20},
        "BIO": {"theory_mark": 70, "practical_mark": 20},
        "HMT": {"theory_mark": 70, "practical_mark": 25},
    })
    res_26 = GradingEngine.calculate("T26", "Test", "9-A", "HMT", marks_26)
    test_results.append({
        "name": "GPA cap rule → final GPA = 5.00",
        "expected": 5.0,
        "actual": res_26["final_gpa"],
        "status": "PASS" if res_26["final_gpa"] == 5.0 and res_26["uncancelled_gpa"] > 5.0 else "FAIL",
        "category": "override"
    })

    # T29: Multiple compulsory failures
    marks_29 = make_base_marks({"BAN": {"total_mark": 30}, "ENG": {"total_mark": 30}})
    res_29 = GradingEngine.calculate("T29", "Test", "9-A", "HMT", marks_29)
    test_results.append({
        "name": "Multiple compulsory fails (BAN+ENG) → GPA = 0.00",
        "expected": 0.0,
        "actual": res_29["final_gpa"],
        "status": "PASS" if res_29["final_gpa"] == 0.0 and res_29["compulsory_failure"] else "FAIL",
        "category": "override"
    })

    # ── Category 6: Edge Code Tests (3 tests) ────────────────────────────────
    # T27: Numeric zero → BELOW_33 rule code
    res_27 = get_grade_by_marks(0)
    test_results.append({
        "name": "Numeric zero mark → rule_code BELOW_33",
        "expected": "BELOW_33",
        "actual": res_27["rule_code"],
        "status": "PASS" if res_27["rule_code"] == "BELOW_33" else "FAIL",
        "category": "edge_case"
    })

    # T28: AB mark → COMPULSORY_ABSENCE rule code
    marks_28 = make_base_marks({"BAN": "AB"})
    res_28 = GradingEngine.calculate("T28", "Test", "9-A", "HMT", marks_28)
    ban_28 = next(s for s in res_28["subjects"] if s["subject_code"] == "BAN")
    test_results.append({
        "name": "AB mark → rule_code COMPULSORY_ABSENCE",
        "expected": "COMPULSORY_ABSENCE",
        "actual": ban_28["rule_code"],
        "status": "PASS" if ban_28["rule_code"] == rule_codes.COMPULSORY_ABSENCE else "FAIL",
        "category": "edge_case"
    })

    # T30: All compulsory AB → final GPA = 0.00
    marks_30 = make_base_marks({
        "BAN": "AB", "ENG": "AB", "MAT": "AB",
        "PHY": {"theory_mark": "AB", "practical_mark": "AB"},
        "CHE": {"theory_mark": "AB", "practical_mark": "AB"},
        "BIO": {"theory_mark": "AB", "practical_mark": "AB"},
    })
    res_30 = GradingEngine.calculate("T30", "Test", "9-A", "HMT", marks_30)
    test_results.append({
        "name": "All compulsory AB → final GPA = 0.00, FAIL",
        "expected": 0.0,
        "actual": res_30["final_gpa"],
        "status": "PASS" if res_30["final_gpa"] == 0.0 and res_30["final_status"] == "FAIL" else "FAIL",
        "category": "edge_case"
    })

    passed_count = sum(1 for t in test_results if t["status"] == "PASS")
    failed_count = len(test_results) - passed_count

    return {
        "total": len(test_results),
        "passed": passed_count,
        "failed": failed_count,
        "status": "PASS" if failed_count == 0 else "FAIL",
        "tests": test_results
    }


@router.get("/faults", response_model=ResultFaultsResponse)
def get_result_faults(db: Session = Depends(get_db)):
    """
    Scans the processed results database for anomalies, borderline cases,
    practical failures, absences, and compulsory override events.
    """
    students = db.query(Student).all()
    faults = []

    for student in students:
        subjects = db.query(SubjectResult).filter(
            SubjectResult.student_id == student.student_id
        ).all()
        summary = student.result_summary

        for sub in subjects:
            # Practical borderline warning (passed but very close to threshold)
            if sub.subject_type == "COMPULSORY" and sub.practical_mark is not None and sub.status == "PASS":
                if 8 <= sub.practical_mark <= 10:
                    faults.append({
                        "student_id": student.student_id,
                        "student_name": student.name,
                        "class_name": student.class_name,
                        "fault_type": "PRACTICAL_BORDERLINE",
                        "fault_code": "PRAC_BORDER",
                        "subject": sub.subject_code,
                        "detail": f"{sub.subject_code}: Practical mark {sub.practical_mark}/25 — passed threshold (≥8) but borderline",
                        "severity": "MEDIUM"
                    })

            # Theory borderline warning
            if sub.subject_type == "COMPULSORY" and sub.theory_mark is not None and sub.status == "PASS":
                if 25 <= sub.theory_mark <= 28:
                    faults.append({
                        "student_id": student.student_id,
                        "student_name": student.name,
                        "class_name": student.class_name,
                        "fault_type": "THEORY_BORDERLINE",
                        "fault_code": "THEORY_BORDER",
                        "subject": sub.subject_code,
                        "detail": f"{sub.subject_code}: Theory mark {sub.theory_mark}/75 — passed threshold (≥25) but borderline",
                        "severity": "MEDIUM"
                    })

            # Subject FAIL
            if sub.status == "FAIL":
                faults.append({
                    "student_id": student.student_id,
                    "student_name": student.name,
                    "class_name": student.class_name,
                    "fault_type": "SUBJECT_FAIL",
                    "fault_code": sub.rule_code or "FAIL",
                    "subject": sub.subject_code,
                    "detail": sub.explanation or f"{sub.subject_code} failed",
                    "severity": "HIGH" if sub.subject_type == "COMPULSORY" else "MEDIUM"
                })

            # Absence
            if sub.status == "ABSENT":
                faults.append({
                    "student_id": student.student_id,
                    "student_name": student.name,
                    "class_name": student.class_name,
                    "fault_type": "ABSENT",
                    "fault_code": sub.rule_code or "ABSENT",
                    "subject": sub.subject_code,
                    "detail": f"{sub.subject_code}: Student was absent",
                    "severity": "HIGH" if sub.subject_type == "COMPULSORY" else "LOW"
                })

        # Compulsory override applied
        if summary and summary.override_applied:
            faults.append({
                "student_id": student.student_id,
                "student_name": student.name,
                "class_name": student.class_name,
                "fault_type": "GPA_OVERRIDE",
                "fault_code": summary.override_code or "OVERRIDE",
                "subject": "OVERALL",
                "detail": summary.override_reason or "GPA override applied",
                "severity": "HIGH"
            })

        # GPA capped at 5.00
        if summary and summary.override_code == "GPA_CAP_5":
            faults.append({
                "student_id": student.student_id,
                "student_name": student.name,
                "class_name": student.class_name,
                "fault_type": "GPA_CAPPED",
                "fault_code": "GPA_CAP_5",
                "subject": "OVERALL",
                "detail": f"Uncancelled GPA exceeded 5.00 and was capped. Final GPA = 5.00",
                "severity": "LOW"
            })

    students_at_risk = len(set(f["student_id"] for f in faults if f["severity"] == "HIGH"))

    return {
        "total_students": len(students),
        "faults_found": len(faults),
        "students_at_risk": students_at_risk,
        "faults": faults
    }
