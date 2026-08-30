import pytest
from app.services.grading_engine import GradingEngine
from tests.test_practical import make_default_marks

def test_compulsory_absence():
    """
    If a compulsory subject is absent, student fails with overall GPA 0.0 and status FAIL.
    """
    marks = make_default_marks({"BAN": "AB"})
    res = GradingEngine.calculate("A1", "Test", "9-A", "HMT", marks)
    assert res["final_gpa"] == 0.0
    assert res["final_grade"] == "F"
    assert res["final_status"] == "FAIL"
    assert res["compulsory_failure"] is True
    assert res["override_code"] == "COMPULSORY_ABSENCE"

def test_optional_absence():
    """
    If the optional subject is absent, contribution is 0, but it does NOT cause a compulsory failure.
    """
    marks = make_default_marks({"HMT": "AB"})
    res = GradingEngine.calculate("A2", "Test", "9-A", "HMT", marks)
    assert res["final_status"] == "PASS"
    assert res["optional_contribution"] == 0.0
    assert res["compulsory_failure"] is False

def test_numeric_zero_vs_ab():
    """
    Verifies that a numeric mark of 0 is treated as BELOW_33, while 'AB' is treated as COMPULSORY_ABSENCE.
    """
    marks_zero = make_default_marks({"BAN": {"total_mark": 0}})
    res_zero = GradingEngine.calculate("A3", "Test", "9-A", "HMT", marks_zero)
    ban_res_zero = next(s for s in res_zero["subjects"] if s["subject_code"] == "BAN")
    assert ban_res_zero["status"] == "FAIL"
    assert ban_res_zero["gp"] == 0.0
    assert ban_res_zero["rule_code"] == "BELOW_33"

    marks_ab = make_default_marks({"BAN": "AB"})
    res_ab = GradingEngine.calculate("A4", "Test", "9-A", "HMT", marks_ab)
    ban_res_ab = next(s for s in res_ab["subjects"] if s["subject_code"] == "BAN")
    assert ban_res_ab["status"] == "ABSENT"
    assert ban_res_ab["gp"] == 0.0
    assert ban_res_ab["rule_code"] == "COMPULSORY_ABSENCE"
