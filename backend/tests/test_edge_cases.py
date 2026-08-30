import pytest
from app.services.grading_engine import GradingEngine
from app.seed.demo_data import get_demo_students

@pytest.fixture
def demo_students_dict():
    students = get_demo_students()
    return {s.student_id: s for s in students}

def test_edge_01_high_average_compulsory_failure(demo_students_dict):
    # EDGE-01 — High Average / Compulsory Failure
    # Uncancelled GPA = 4.33, BIO fails -> Final GPA 0.00, F
    stud = demo_students_dict["EDGE-01"]
    res = GradingEngine.calculate(stud.student_id, stud.name, stud.class_name, stud.optional_subject, stud.marks)
    
    assert res["uncancelled_gpa"] == 4.33
    assert res["final_gpa"] == 0.00
    assert res["final_grade"] == "F"
    assert res["final_status"] == "FAIL"
    assert res["compulsory_failure"] is True
    assert res["override_code"] == "COMPULSORY_FAILURE"

def test_edge_02_practical_failure(demo_students_dict):
    # EDGE-02 — Practical Failure (PHY practical fails: 7 < 8)
    stud = demo_students_dict["EDGE-02"]
    res = GradingEngine.calculate(stud.student_id, stud.name, stud.class_name, stud.optional_subject, stud.marks)
    
    phy_res = next(s for s in res["subjects"] if s["subject_code"] == "PHY")
    assert phy_res["status"] == "FAIL"
    assert phy_res["gp"] == 0.0
    assert phy_res["rule_code"] == "PRACTICAL_THRESHOLD_FAIL"

def test_edge_03_theory_failure(demo_students_dict):
    # EDGE-03 — Theory Failure (PHY theory fails: 20 < 25)
    stud = demo_students_dict["EDGE-03"]
    res = GradingEngine.calculate(stud.student_id, stud.name, stud.class_name, stud.optional_subject, stud.marks)
    
    phy_res = next(s for s in res["subjects"] if s["subject_code"] == "PHY")
    assert phy_res["status"] == "FAIL"
    assert phy_res["gp"] == 0.0
    assert phy_res["rule_code"] == "THEORY_THRESHOLD_FAIL"

def test_edge_04_optional_gp_exactly_2(demo_students_dict):
    # EDGE-04 — Optional GP Exactly 2.0 (HMT GP 2.0 -> contribution = 0.0)
    stud = demo_students_dict["EDGE-04"]
    res = GradingEngine.calculate(stud.student_id, stud.name, stud.class_name, stud.optional_subject, stud.marks)
    
    assert res["optional_contribution"] == 0.0
    assert res["optional_rule_code"] == "OPTIONAL_NO_CONTRIBUTION"

def test_edge_05_optional_gp_4(demo_students_dict):
    # EDGE-05 — Optional GP 4.0 (HMT GP 4.0 -> contribution = 2.0)
    stud = demo_students_dict["EDGE-05"]
    res = GradingEngine.calculate(stud.student_id, stud.name, stud.class_name, stud.optional_subject, stud.marks)
    
    assert res["optional_contribution"] == 2.0
    assert res["optional_rule_code"] == "OPTIONAL_BONUS"

def test_edge_06_compulsory_ab(demo_students_dict):
    # EDGE-06 — Compulsory AB (MAT is absent -> final GPA = 0)
    stud = demo_students_dict["EDGE-06"]
    res = GradingEngine.calculate(stud.student_id, stud.name, stud.class_name, stud.optional_subject, stud.marks)
    
    assert res["final_gpa"] == 0.00
    assert res["final_grade"] == "F"
    assert res["final_status"] == "FAIL"
    assert res["compulsory_failure"] is True
    assert res["override_code"] == "COMPULSORY_ABSENCE"

def test_edge_07_optional_ab(demo_students_dict):
    # EDGE-07 — Optional AB (HMT is absent -> contribution = 0.0, student passes)
    stud = demo_students_dict["EDGE-07"]
    res = GradingEngine.calculate(stud.student_id, stud.name, stud.class_name, stud.optional_subject, stud.marks)
    
    assert res["final_status"] == "PASS"
    assert res["optional_contribution"] == 0.0
    assert res["compulsory_failure"] is False

def test_edge_08_multiple_compulsory_failures(demo_students_dict):
    # EDGE-08 — Multiple Compulsory Failures
    stud = demo_students_dict["EDGE-08"]
    res = GradingEngine.calculate(stud.student_id, stud.name, stud.class_name, stud.optional_subject, stud.marks)
    
    assert res["final_status"] == "FAIL"
    assert res["final_gpa"] == 0.00
    assert res["compulsory_failure"] is True
    # Count failed subjects
    failed_subs = [s for s in res["subjects"] if s["subject_type"] == "COMPULSORY" and s["status"] == "FAIL"]
    assert len(failed_subs) == 2

def test_edge_09_all_compulsory_ab(demo_students_dict):
    # EDGE-09 — All Compulsory AB
    stud = demo_students_dict["EDGE-09"]
    res = GradingEngine.calculate(stud.student_id, stud.name, stud.class_name, stud.optional_subject, stud.marks)
    
    assert res["final_status"] == "FAIL"
    assert res["final_gpa"] == 0.00
    # Check all compulsory are absent
    comp_absent = [s for s in res["subjects"] if s["subject_type"] == "COMPULSORY" and s["status"] == "ABSENT"]
    assert len(comp_absent) == 6

def test_edge_10_gpa_cap(demo_students_dict):
    # EDGE-10 — GPA Cap (uncancelled GPA = 5.50 -> final GPA = 5.00)
    stud = demo_students_dict["EDGE-10"]
    res = GradingEngine.calculate(stud.student_id, stud.name, stud.class_name, stud.optional_subject, stud.marks)
    
    assert res["uncancelled_gpa"] == 5.50
    assert res["final_gpa"] == 5.00
    assert res["final_grade"] == "A+"
    assert res["override_code"] == "GPA_CAP_5"

def test_edge_11_numeric_zero_vs_ab(demo_students_dict):
    # EDGE-11 — Numeric Zero vs AB (BAN is 0 -> FAIL, ENG is AB -> ABSENT)
    stud = demo_students_dict["EDGE-11"]
    res = GradingEngine.calculate(stud.student_id, stud.name, stud.class_name, stud.optional_subject, stud.marks)
    
    ban_res = next(s for s in res["subjects"] if s["subject_code"] == "BAN")
    eng_res = next(s for s in res["subjects"] if s["subject_code"] == "ENG")
    
    assert ban_res["status"] == "FAIL"
    assert ban_res["rule_code"] == "BELOW_33"
    assert eng_res["status"] == "ABSENT"
    assert eng_res["rule_code"] == "COMPULSORY_ABSENCE"

def test_edge_12_optional_only_failure(demo_students_dict):
    # EDGE-12 — Optional-only Failure
    # HMT GP = 0, but passes overall
    stud = demo_students_dict["EDGE-12"]
    res = GradingEngine.calculate(stud.student_id, stud.name, stud.class_name, stud.optional_subject, stud.marks)
    
    hmt_res = next(s for s in res["subjects"] if s["subject_code"] == "HMT")
    assert hmt_res["status"] == "FAIL"
    assert hmt_res["gp"] == 0.0
    assert res["final_status"] == "PASS"
    assert res["compulsory_failure"] is False
