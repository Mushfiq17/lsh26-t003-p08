import pytest
from app.services.grading_engine import GradingEngine
from tests.test_practical import make_default_marks

def test_optional_contribution_gp_1():
    # GP 1.0 (marks 35) -> contribution = 0.0
    marks = make_default_marks({"HMT": {"total_mark": 35}})
    res = GradingEngine.calculate("O1", "Test", "9-A", "HMT", marks)
    assert res["optional_contribution"] == 0.0

def test_optional_contribution_gp_2():
    # GP 2.0 (marks 45) -> contribution = 0.0
    marks = make_default_marks({"HMT": {"total_mark": 45}})
    res = GradingEngine.calculate("O2", "Test", "9-A", "HMT", marks)
    assert res["optional_contribution"] == 0.0

def test_optional_contribution_gp_3():
    # GP 3.0 (marks 55) -> contribution = 1.0
    marks = make_default_marks({"HMT": {"total_mark": 55}})
    res = GradingEngine.calculate("O3", "Test", "9-A", "HMT", marks)
    assert res["optional_contribution"] == 1.0

def test_optional_contribution_gp_4():
    # GP 4.0 (marks 75) -> contribution = 2.0
    marks = make_default_marks({"HMT": {"total_mark": 75}})
    res = GradingEngine.calculate("O4", "Test", "9-A", "HMT", marks)
    assert res["optional_contribution"] == 2.0

def test_optional_contribution_gp_5():
    # GP 5.0 (marks 85) -> contribution = 3.0
    marks = make_default_marks({"HMT": {"total_mark": 85}})
    res = GradingEngine.calculate("O5", "Test", "9-A", "HMT", marks)
    assert res["optional_contribution"] == 3.0
