from typing import Dict, Any, List

COMPULSORY_SUBJECTS = {"BAN", "ENG", "MAT", "PHY", "CHE", "BIO"}
OPTIONAL_SUBJECTS = {"HMT", "AGR", "REL"}

SUBJECT_CONFIGS = {
    "BAN": {"name": "Bangla", "is_practical": False, "max_mark": 100, "min_mark": 33},
    "ENG": {"name": "English", "is_practical": False, "max_mark": 100, "min_mark": 33},
    "MAT": {"name": "Mathematics", "is_practical": False, "max_mark": 100, "min_mark": 33},
    "PHY": {
        "name": "Physics",
        "is_practical": True,
        "theory_max": 75,
        "theory_min": 25,
        "practical_max": 25,
        "practical_min": 8
    },
    "CHE": {
        "name": "Chemistry",
        "is_practical": True,
        "theory_max": 75,
        "theory_min": 25,
        "practical_max": 25,
        "practical_min": 8
    },
    "BIO": {
        "name": "Biology",
        "is_practical": True,
        "theory_max": 75,
        "theory_min": 25,
        "practical_max": 25,
        "practical_min": 8
    },
    "HMT": {
        "name": "Higher Mathematics",
        "is_practical": True,
        "theory_max": 75,
        "theory_min": 25,
        "practical_max": 25,
        "practical_min": 8
    },
    "AGR": {
        "name": "Agriculture",
        "is_practical": True,
        "theory_max": 75,
        "theory_min": 25,
        "practical_max": 25,
        "practical_min": 8
    },
    "REL": {"name": "Religion", "is_practical": False, "max_mark": 100, "min_mark": 33},
}

GRADE_BOUNDARIES = [
    {"min": 80, "max": 100, "gp": 5.0, "grade": "A+", "rule_code": "80_AND_ABOVE"},
    {"min": 70, "max": 79,  "gp": 4.0, "grade": "A",  "rule_code": "70_TO_79"},
    {"min": 60, "max": 69,  "gp": 3.5, "grade": "A-", "rule_code": "60_TO_69"},
    {"min": 50, "max": 59,  "gp": 3.0, "grade": "B",  "rule_code": "50_TO_59"},
    {"min": 40, "max": 49,  "gp": 2.0, "grade": "C",  "rule_code": "40_TO_49"},
    {"min": 33, "max": 39,  "gp": 1.0, "grade": "D",  "rule_code": "33_TO_39"},
    {"min": 0,  "max": 32,  "gp": 0.0, "grade": "F",  "rule_code": "BELOW_33"}
]

def get_grade_by_marks(marks: float) -> Dict[str, Any]:
    # Round marks to nearest integer for grading boundary checks, as marks are usually whole numbers
    rounded_marks = int(round(marks))
    for boundary in GRADE_BOUNDARIES:
        if boundary["min"] <= rounded_marks <= boundary["max"]:
            return boundary
    return {"gp": 0.0, "grade": "F", "rule_code": "BELOW_33"}

def map_gpa_to_letter_grade(gpa: float) -> str:
    if gpa >= 5.0:
        return "A+"
    elif gpa >= 4.0:
        return "A"
    elif gpa >= 3.5:
        return "A-"
    elif gpa >= 3.0:
        return "B"
    elif gpa >= 2.0:
        return "C"
    elif gpa >= 1.0:
        return "D"
    else:
        return "F"
