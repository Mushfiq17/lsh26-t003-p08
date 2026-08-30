import pytest
from app.services.grading_engine import GradingEngine

def make_default_marks(override: dict = None) -> dict:
    base = {
        "BAN": {"total_mark": 60},
        "ENG": {"total_mark": 60},
        "MAT": {"total_mark": 60},
        "PHY": {"theory_mark": 50, "practical_mark": 15},
        "CHE": {"theory_mark": 50, "practical_mark": 15},
        "BIO": {"theory_mark": 50, "practical_mark": 15},
        "HMT": {"total_mark": 60}
    }
    if override:
        for k, v in override.items():
            base[k] = v
    return base

def test_practical_subject_theory_fail():
    """
    Tests that if a student gets below the theory minimum (24/75), the subject fails overall.
    """
    marks = make_default_marks({"PHY": {"theory_mark": 24, "practical_mark": 15}})
    res = GradingEngine.calculate("T1", "Test", "9-A", "HMT", marks)
    phy_res = next(s for s in res["subjects"] if s["subject_code"] == "PHY")
    assert phy_res["status"] == "FAIL"
    assert phy_res["gp"] == 0.0
    assert phy_res["letter_grade"] == "F"
    assert phy_res["rule_code"] == "THEORY_THRESHOLD_FAIL"

def test_practical_subject_theory_pass():
    """
    Tests that if a student gets exactly the theory minimum (25/75) and practical passes, the subject passes.
    """
    marks = make_default_marks({"PHY": {"theory_mark": 25, "practical_mark": 15}})
    res = GradingEngine.calculate("T2", "Test", "9-A", "HMT", marks)
    phy_res = next(s for s in res["subjects"] if s["subject_code"] == "PHY")
    assert phy_res["status"] == "PASS"
    assert phy_res["gp"] == 2.0  # Total 40 -> GP 2.0
    assert phy_res["letter_grade"] == "C"

def test_practical_subject_practical_fail():
    """
    Tests that if a student gets below the practical minimum (7/25), the subject fails overall.
    """
    marks = make_default_marks({"PHY": {"theory_mark": 60, "practical_mark": 7}})
    res = GradingEngine.calculate("T3", "Test", "9-A", "HMT", marks)
    phy_res = next(s for s in res["subjects"] if s["subject_code"] == "PHY")
    assert phy_res["status"] == "FAIL"
    assert phy_res["gp"] == 0.0
    assert phy_res["letter_grade"] == "F"
    assert phy_res["rule_code"] == "PRACTICAL_THRESHOLD_FAIL"

def test_practical_subject_practical_pass():
    """
    Tests that if a student gets exactly the practical minimum (8/25) and theory passes, the subject passes.
    """
    marks = make_default_marks({"PHY": {"theory_mark": 60, "practical_mark": 8}})
    res = GradingEngine.calculate("T4", "Test", "9-A", "HMT", marks)
    phy_res = next(s for s in res["subjects"] if s["subject_code"] == "PHY")
    assert phy_res["status"] == "PASS"
    assert phy_res["gp"] == 3.5  # Total 68 -> GP 3.5
    assert phy_res["letter_grade"] == "A-"
