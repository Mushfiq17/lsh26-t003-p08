import random
from typing import List
from app.schemas.processing import StudentMarksInput

def get_demo_students() -> List[StudentMarksInput]:
    """
    Generates a deterministic dataset of 62 students:
    - 12 edge cases
    - 50 normal students (using a fixed-seed random generator)
    """
    students = []

    # 1. EDGE-01 — High Average / Compulsory Failure
    # Uncancelled GPA = 4.33 (26 / 6), compulsory BIO fails -> Final GPA 0.00, F
    students.append(StudentMarksInput(
        student_id="EDGE-01",
        name="High Average / Compulsory Failure",
        class_name="9-A",
        optional_subject="HMT",
        marks={
            "BAN": {"total_mark": 85},                         # GP 5.0
            "ENG": {"total_mark": 82},                         # GP 5.0
            "MAT": {"total_mark": 80},                         # GP 5.0
            "PHY": {"theory_mark": 60, "practical_mark": 20}, # GP 5.0
            "CHE": {"theory_mark": 52, "practical_mark": 20}, # GP 4.0 (Total 72)
            "BIO": {"theory_mark": 60, "practical_mark": 7},  # GP 0.0 (fails practical threshold)
            "HMT": {"theory_mark": 55, "practical_mark": 20},                         # GP 4.0 (Optional -> contribution = 2.0)
        }
    ))

    # 2. EDGE-02 — Practical Failure (PHY practical fails)
    students.append(StudentMarksInput(
        student_id="EDGE-02",
        name="Practical Failure",
        class_name="9-A",
        optional_subject="HMT",
        marks={
            "BAN": {"total_mark": 65},
            "ENG": {"total_mark": 68},
            "MAT": {"total_mark": 70},
            "PHY": {"theory_mark": 60, "practical_mark": 7},  # Fails practical min (8)
            "CHE": {"theory_mark": 50, "practical_mark": 15},
            "BIO": {"theory_mark": 55, "practical_mark": 18},
            "HMT": {"theory_mark": 45, "practical_mark": 15}
        }
    ))

    # 3. EDGE-03 — Theory Failure (PHY theory fails)
    students.append(StudentMarksInput(
        student_id="EDGE-03",
        name="Theory Failure",
        class_name="9-A",
        optional_subject="HMT",
        marks={
            "BAN": {"total_mark": 65},
            "ENG": {"total_mark": 68},
            "MAT": {"total_mark": 70},
            "PHY": {"theory_mark": 20, "practical_mark": 15}, # Fails theory min (25)
            "CHE": {"theory_mark": 50, "practical_mark": 15},
            "BIO": {"theory_mark": 55, "practical_mark": 18},
            "HMT": {"theory_mark": 45, "practical_mark": 15}
        }
    ))

    # 4. EDGE-04 — Optional GP Exactly 2.0 (HMT GP 2.0 -> contribution = 0.0)
    students.append(StudentMarksInput(
        student_id="EDGE-04",
        name="Optional GP Exactly 2.0",
        class_name="9-A",
        optional_subject="HMT",
        marks={
            "BAN": {"total_mark": 65},
            "ENG": {"total_mark": 68},
            "MAT": {"total_mark": 70},
            "PHY": {"theory_mark": 50, "practical_mark": 15},
            "CHE": {"theory_mark": 50, "practical_mark": 15},
            "BIO": {"theory_mark": 55, "practical_mark": 18},
            "HMT": {"theory_mark": 30, "practical_mark": 15}  # Total 45 -> GP 2.0 -> contrib = 0.0
        }
    ))

    # 5. EDGE-05 — Optional GP 4.0 (HMT GP 4.0 -> contribution = 2.0)
    students.append(StudentMarksInput(
        student_id="EDGE-05",
        name="Optional GP 4.0",
        class_name="9-A",
        optional_subject="HMT",
        marks={
            "BAN": {"total_mark": 65},
            "ENG": {"total_mark": 68},
            "MAT": {"total_mark": 70},
            "PHY": {"theory_mark": 50, "practical_mark": 15},
            "CHE": {"theory_mark": 50, "practical_mark": 15},
            "BIO": {"theory_mark": 55, "practical_mark": 18},
            "HMT": {"theory_mark": 55, "practical_mark": 20}  # Total 75 -> GP 4.0 -> contrib = 2.0
        }
    ))

    # 6. EDGE-06 — Compulsory AB (MAT is absent)
    students.append(StudentMarksInput(
        student_id="EDGE-06",
        name="Compulsory AB",
        class_name="9-A",
        optional_subject="HMT",
        marks={
            "BAN": {"total_mark": 65},
            "ENG": {"total_mark": 68},
            "MAT": "AB",
            "PHY": {"theory_mark": 50, "practical_mark": 15},
            "CHE": {"theory_mark": 50, "practical_mark": 15},
            "BIO": {"theory_mark": 55, "practical_mark": 18},
            "HMT": {"theory_mark": 45, "practical_mark": 15}
        }
    ))

    # 7. EDGE-07 — Optional AB (HMT is absent -> contrib = 0.0, student passes)
    students.append(StudentMarksInput(
        student_id="EDGE-07",
        name="Optional AB",
        class_name="9-A",
        optional_subject="HMT",
        marks={
            "BAN": {"total_mark": 65},
            "ENG": {"total_mark": 68},
            "MAT": {"total_mark": 70},
            "PHY": {"theory_mark": 50, "practical_mark": 15},
            "CHE": {"theory_mark": 50, "practical_mark": 15},
            "BIO": {"theory_mark": 55, "practical_mark": 18},
            "HMT": "AB"
        }
    ))

    # 8. EDGE-08 — Multiple Compulsory Failures (BAN and ENG fail)
    students.append(StudentMarksInput(
        student_id="EDGE-08",
        name="Multiple Compulsory Failures",
        class_name="9-A",
        optional_subject="HMT",
        marks={
            "BAN": {"total_mark": 25},  # Fail
            "ENG": {"total_mark": 28},  # Fail
            "MAT": {"total_mark": 70},
            "PHY": {"theory_mark": 50, "practical_mark": 15},
            "CHE": {"theory_mark": 50, "practical_mark": 15},
            "BIO": {"theory_mark": 55, "practical_mark": 18},
            "HMT": {"theory_mark": 45, "practical_mark": 15}
        }
    ))

    # 9. EDGE-09 — All Compulsory AB
    students.append(StudentMarksInput(
        student_id="EDGE-09",
        name="All Compulsory AB",
        class_name="9-A",
        optional_subject="HMT",
        marks={
            "BAN": "AB",
            "ENG": "AB",
            "MAT": "AB",
            "PHY": {"theory_mark": "AB", "practical_mark": "AB"},
            "CHE": {"theory_mark": "AB", "practical_mark": "AB"},
            "BIO": {"theory_mark": "AB", "practical_mark": "AB"},
            "HMT": {"theory_mark": 45, "practical_mark": 15}
        }
    ))

    # 10. EDGE-10 — GPA Cap (GP 5.5 capped at 5.00)
    students.append(StudentMarksInput(
        student_id="EDGE-10",
        name="GPA Cap",
        class_name="9-A",
        optional_subject="HMT",
        marks={
            "BAN": {"total_mark": 95},
            "ENG": {"total_mark": 95},
            "MAT": {"total_mark": 95},
            "PHY": {"theory_mark": 70, "practical_mark": 20},
            "CHE": {"theory_mark": 70, "practical_mark": 20},
            "BIO": {"theory_mark": 70, "practical_mark": 20},
            "HMT": {"theory_mark": 70, "practical_mark": 25}
        }
    ))

    # 11. EDGE-11 — Numeric Zero vs AB
    # BAN = 0 (numeric zero -> status FAIL), ENG = AB (absent -> status ABSENT)
    students.append(StudentMarksInput(
        student_id="EDGE-11",
        name="Numeric Zero vs AB",
        class_name="9-A",
        optional_subject="HMT",
        marks={
            "BAN": {"total_mark": 0},
            "ENG": "AB",
            "MAT": {"total_mark": 60},
            "PHY": {"theory_mark": 50, "practical_mark": 15},
            "CHE": {"theory_mark": 50, "practical_mark": 15},
            "BIO": {"theory_mark": 55, "practical_mark": 18},
            "HMT": {"theory_mark": 45, "practical_mark": 15}
        }
    ))

    # 12. EDGE-12 — Optional-only Failure
    # Optional subject receives GP 0 (total 20 -> GP 0), passes overall
    students.append(StudentMarksInput(
        student_id="EDGE-12",
        name="Optional-only Failure",
        class_name="9-A",
        optional_subject="HMT",
        marks={
            "BAN": {"total_mark": 65},
            "ENG": {"total_mark": 68},
            "MAT": {"total_mark": 70},
            "PHY": {"theory_mark": 50, "practical_mark": 15},
            "CHE": {"theory_mark": 50, "practical_mark": 15},
            "BIO": {"theory_mark": 55, "practical_mark": 18},
            "HMT": {"theory_mark": 15, "practical_mark": 5}  # GP 0.0 -> Optional failure
        }
    ))

    # Generate 50 normal students using a deterministic seed
    rng = random.Random(42)
    first_names = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Garcia", "Rodriguez", "Wilson", "Martinez", "Anderson", "Taylor", "Thomas", "Hernandez", "Moore", "Martin", "Jackson", "Thompson", "White"]
    classes = ["9-A", "9-B"]
    optionals = ["HMT", "AGR", "REL"]

    for i in range(1, 51):
        stud_id = f"STU-{i:03d}"
        name = f"{rng.choice(first_names)} {rng.choice(last_names)}"
        class_name = rng.choice(classes)
        opt_sub = rng.choice(optionals)

        # Generate passing marks for normal students
        marks = {}
        # Compulsory normal
        marks["BAN"] = {"total_mark": rng.randint(45, 95)}
        marks["ENG"] = {"total_mark": rng.randint(45, 95)}
        marks["MAT"] = {"total_mark": rng.randint(45, 95)}

        # Compulsory practical
        marks["PHY"] = {"theory_mark": rng.randint(40, 70), "practical_mark": rng.randint(12, 23)}
        marks["CHE"] = {"theory_mark": rng.randint(40, 70), "practical_mark": rng.randint(12, 23)}
        marks["BIO"] = {"theory_mark": rng.randint(40, 70), "practical_mark": rng.randint(12, 23)}

        # Selected Optional
        if opt_sub == "REL":
            marks[opt_sub] = {"total_mark": rng.randint(35, 95)}
        else:
            # HMT and AGR have practical parts (theory out of 75, practical out of 25)
            marks[opt_sub] = {"theory_mark": rng.randint(30, 65), "practical_mark": rng.randint(10, 23)}

        students.append(StudentMarksInput(
            student_id=stud_id,
            name=name,
            class_name=class_name,
            optional_subject=opt_sub,
            marks=marks
        ))

    return students
