import pytest
import copy
from app.services.grading_engine import GradingEngine
from app.rules.grading_rules import get_grade_by_marks

def test_grade_boundaries():
    """
    Verifies that the grade points map correctly for all required boundary values.
    """
    boundaries = [
        (32, 0.0, "F"),
        (33, 1.0, "D"),
        (39, 1.0, "D"),
        (40, 2.0, "C"),
        (49, 2.0, "C"),
        (50, 3.0, "B"),
        (59, 3.0, "B"),
        (60, 3.5, "A-"),
        (69, 3.5, "A-"),
        (70, 4.0, "A"),
        (79, 4.0, "A"),
        (80, 5.0, "A+"),
        (100, 5.0, "A+")
    ]
    for val, expected_gp, expected_grade in boundaries:
        res = get_grade_by_marks(val)
        assert res["gp"] == expected_gp, f"Expected mark {val} to yield GP {expected_gp}, got {res['gp']}"
        assert res["grade"] == expected_grade, f"Expected mark {val} to yield grade {expected_grade}, got {res['grade']}"

def test_grading_engine_determinism():
    """
    Ensures that calling the grading engine repeatedly with the exact same inputs produces identical outputs.
    """
    marks_input = {
        "BAN": {"total_mark": 78},
        "ENG": {"total_mark": 82},
        "MAT": {"total_mark": 64},
        "PHY": {"theory_mark": 55, "practical_mark": 18},
        "CHE": {"theory_mark": 62, "practical_mark": 20},
        "BIO": {"theory_mark": 50, "practical_mark": 16},
        "HMT": {"total_mark": 85}
    }

    # Run three times
    res_a = GradingEngine.calculate("D1", "Student A", "9-A", "HMT", copy.deepcopy(marks_input))
    res_b = GradingEngine.calculate("D1", "Student A", "9-A", "HMT", copy.deepcopy(marks_input))
    res_c = GradingEngine.calculate("D1", "Student A", "9-A", "HMT", copy.deepcopy(marks_input))

    assert res_a == res_b
    assert res_b == res_c
