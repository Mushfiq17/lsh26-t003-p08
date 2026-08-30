from typing import Dict, Any, List, Optional
from app.rules.grading_rules import (
    COMPULSORY_SUBJECTS,
    OPTIONAL_SUBJECTS,
    SUBJECT_CONFIGS,
    get_grade_by_marks,
    map_gpa_to_letter_grade
)
from app.rules import rule_codes
from app.core.config import settings

class GradingEngine:
    @staticmethod
    def validate_student_marks(
        optional_subject: str,
        marks: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Validates individual student marks before calculation.
        Returns a list of validation errors.
        """
        errors = []

        # Validate optional subject choice
        if optional_subject not in OPTIONAL_SUBJECTS:
            errors.append({
                "field": "optional_subject",
                "error_code": "INVALID_OPTIONAL_SUBJECT",
                "message": f"Optional subject '{optional_subject}' is not valid. Must be one of {list(OPTIONAL_SUBJECTS)}."
            })

        # Ensure all compulsory subjects are provided
        for sub in COMPULSORY_SUBJECTS:
            if sub not in marks:
                errors.append({
                    "field": f"marks.{sub}",
                    "error_code": "MISSING_COMPULSORY_SUBJECT",
                    "message": f"Compulsory subject '{sub}' is missing from marks."
                })

        # Ensure the selected optional subject is provided
        if optional_subject in OPTIONAL_SUBJECTS and optional_subject not in marks:
            errors.append({
                "field": f"marks.{optional_subject}",
                "error_code": "MISSING_OPTIONAL_SUBJECT",
                "message": f"Selected optional subject '{optional_subject}' is missing from marks."
            })

        # Validate marks for each subject
        for sub, mark_data in marks.items():
            if sub not in SUBJECT_CONFIGS:
                errors.append({
                    "field": f"marks.{sub}",
                    "error_code": "INVALID_SUBJECT_CODE",
                    "message": f"Subject code '{sub}' is not recognized."
                })
                continue

            config = SUBJECT_CONFIGS[sub]

            # Handle AB absence checks
            is_ab = False
            if isinstance(mark_data, str) and mark_data.upper() == "AB":
                is_ab = True
            elif mark_data is None:
                is_ab = True

            if is_ab:
                continue

            if not isinstance(mark_data, dict):
                errors.append({
                    "field": f"marks.{sub}",
                    "error_code": "INVALID_MARK_FORMAT",
                    "message": f"Marks for subject '{sub}' must be a dictionary or 'AB'."
                })
                continue

            if config["is_practical"]:
                theory_val = mark_data.get("theory_mark")
                practical_val = mark_data.get("practical_mark")

                # Validate theory
                if theory_val is not None:
                    if isinstance(theory_val, str) and theory_val.upper() == "AB":
                        pass
                    elif isinstance(theory_val, (int, float)):
                        if theory_val < 0:
                            errors.append({
                                "field": f"marks.{sub}.theory_mark",
                                "error_code": "NEGATIVE_MARK",
                                "message": f"Theory mark for '{sub}' cannot be negative."
                            })
                        if theory_val > config["theory_max"]:
                            errors.append({
                                "field": f"marks.{sub}.theory_mark",
                                "error_code": "MARK_OUT_OF_RANGE",
                                "message": f"Theory mark for '{sub}' cannot exceed {config['theory_max']}."
                            })
                    else:
                        errors.append({
                            "field": f"marks.{sub}.theory_mark",
                            "error_code": "INVALID_MARK_TYPE",
                            "message": f"Theory mark for '{sub}' must be a number or 'AB'."
                        })
                else:
                    errors.append({
                        "field": f"marks.{sub}.theory_mark",
                        "error_code": "MISSING_MARK",
                        "message": f"Theory mark is required for practical subject '{sub}'."
                    })

                # Validate practical
                if practical_val is not None:
                    if isinstance(practical_val, str) and practical_val.upper() == "AB":
                        pass
                    elif isinstance(practical_val, (int, float)):
                        if practical_val < 0:
                            errors.append({
                                "field": f"marks.{sub}.practical_mark",
                                "error_code": "NEGATIVE_MARK",
                                "message": f"Practical mark for '{sub}' cannot be negative."
                            })
                        if practical_val > config["practical_max"]:
                            errors.append({
                                "field": f"marks.{sub}.practical_mark",
                                "error_code": "MARK_OUT_OF_RANGE",
                                "message": f"Practical mark for '{sub}' cannot exceed {config['practical_max']}."
                            })
                    else:
                        errors.append({
                            "field": f"marks.{sub}.practical_mark",
                            "error_code": "INVALID_MARK_TYPE",
                            "message": f"Practical mark for '{sub}' must be a number or 'AB'."
                        })
                else:
                    errors.append({
                        "field": f"marks.{sub}.practical_mark",
                        "error_code": "MISSING_MARK",
                        "message": f"Practical mark is required for practical subject '{sub}'."
                    })
            else:
                # Normal subject validation
                total_val = mark_data.get("total_mark")
                if total_val is not None:
                    if isinstance(total_val, str) and total_val.upper() == "AB":
                        pass
                    elif isinstance(total_val, (int, float)):
                        if total_val < 0:
                            errors.append({
                                "field": f"marks.{sub}.total_mark",
                                "error_code": "NEGATIVE_MARK",
                                "message": f"Total mark for '{sub}' cannot be negative."
                            })
                        if total_val > config["max_mark"]:
                            errors.append({
                                "field": f"marks.{sub}.total_mark",
                                "error_code": "MARK_OUT_OF_RANGE",
                                "message": f"Total mark for '{sub}' cannot exceed {config['max_mark']}."
                            })
                    else:
                        errors.append({
                            "field": f"marks.{sub}.total_mark",
                            "error_code": "INVALID_MARK_TYPE",
                            "message": f"Total mark for '{sub}' must be a number or 'AB'."
                        })
                else:
                    errors.append({
                        "field": f"marks.{sub}.total_mark",
                        "error_code": "MISSING_MARK",
                        "message": f"Total mark is required for subject '{sub}'."
                    })

        return errors

    @classmethod
    def evaluate_subject(
        cls,
        subject_code: str,
        subject_type: str,
        mark_data: Any
    ) -> Dict[str, Any]:
        """
        Evaluates a single subject result.
        Returns evaluation dict, which includes marks details, gp, letter grade, status, and trace explanation.
        """
        config = SUBJECT_CONFIGS[subject_code]
        name = config["name"]

        # Parse absence
        is_subject_ab = False
        if isinstance(mark_data, str) and mark_data.upper() == "AB":
            is_subject_ab = True
        elif mark_data is None:
            is_subject_ab = True

        if config["is_practical"]:
            # If the subject mark is represented as "AB", then theory and practical are both absent
            if is_subject_ab:
                theory_mark = None
                practical_mark = None
                theory_is_ab = True
                practical_is_ab = True
            else:
                t_val = mark_data.get("theory_mark")
                p_val = mark_data.get("practical_mark")
                theory_is_ab = (t_val is None or (isinstance(t_val, str) and t_val.upper() == "AB"))
                practical_is_ab = (p_val is None or (isinstance(p_val, str) and p_val.upper() == "AB"))
                theory_mark = None if theory_is_ab else float(t_val)
                practical_mark = None if practical_is_ab else float(p_val)

            theory_max = config["theory_max"]
            practical_max = config["practical_max"]

            # If either is absent, the subject status is ABSENT
            if theory_is_ab or practical_is_ab:
                abs_type = rule_codes.COMPULSORY_ABSENCE if subject_type == "COMPULSORY" else rule_codes.OPTIONAL_ABSENCE
                explanation = f"{name}: Student was absent in "
                if theory_is_ab and practical_is_ab:
                    explanation += "both theory and practical."
                elif theory_is_ab:
                    explanation += "theory."
                else:
                    explanation += "practical."

                return {
                    "subject_code": subject_code,
                    "subject_type": subject_type,
                    "theory_mark": None,
                    "theory_max": theory_max,
                    "practical_mark": None,
                    "practical_max": practical_max,
                    "total_mark": None,
                    "gp": 0.0,
                    "letter_grade": "F",
                    "status": "ABSENT",
                    "rule_code": abs_type,
                    "explanation": explanation,
                    "checks": [
                        {"component": "theory", "actual": "AB" if theory_is_ab else theory_mark, "required": config["theory_min"], "passed": not theory_is_ab},
                        {"component": "practical", "actual": "AB" if practical_is_ab else practical_mark, "required": config["practical_min"], "passed": not practical_is_ab}
                    ]
                }

            # Independent dual threshold check
            theory_passed = theory_mark >= config["theory_min"]
            practical_passed = practical_mark >= config["practical_min"]
            total_mark = theory_mark + practical_mark

            checks = [
                {"component": "theory", "actual": theory_mark, "required": config["theory_min"], "passed": bool(theory_passed)},
                {"component": "practical", "actual": practical_mark, "required": config["practical_min"], "passed": bool(practical_passed)}
            ]

            if not theory_passed and not practical_passed:
                rule_code = rule_codes.PRACTICAL_DUAL_THRESHOLD
                explanation = f"{name}: Theory ({theory_mark}/{theory_max}) failed minimum ({config['theory_min']}) AND Practical ({practical_mark}/{practical_max}) failed minimum ({config['practical_min']})."
                return {
                    "subject_code": subject_code,
                    "subject_type": subject_type,
                    "theory_mark": theory_mark,
                    "theory_max": theory_max,
                    "practical_mark": practical_mark,
                    "practical_max": practical_max,
                    "total_mark": total_mark,
                    "gp": 0.0,
                    "letter_grade": "F",
                    "status": "FAIL",
                    "rule_code": rule_code,
                    "explanation": explanation,
                    "checks": checks
                }
            elif not theory_passed:
                rule_code = rule_codes.THEORY_THRESHOLD_FAIL
                explanation = f"{name}: Theory ({theory_mark}/{theory_max}) failed minimum ({config['theory_min']}), while Practical ({practical_mark}/{practical_max}) passed."
                return {
                    "subject_code": subject_code,
                    "subject_type": subject_type,
                    "theory_mark": theory_mark,
                    "theory_max": theory_max,
                    "practical_mark": practical_mark,
                    "practical_max": practical_max,
                    "total_mark": total_mark,
                    "gp": 0.0,
                    "letter_grade": "F",
                    "status": "FAIL",
                    "rule_code": rule_code,
                    "explanation": explanation,
                    "checks": checks
                }
            elif not practical_passed:
                rule_code = rule_codes.PRACTICAL_THRESHOLD_FAIL
                explanation = f"{name}: Theory ({theory_mark}/{theory_max}) passed, but Practical ({practical_mark}/{practical_max}) failed minimum ({config['practical_min']})."
                return {
                    "subject_code": subject_code,
                    "subject_type": subject_type,
                    "theory_mark": theory_mark,
                    "theory_max": theory_max,
                    "practical_mark": practical_mark,
                    "practical_max": practical_max,
                    "total_mark": total_mark,
                    "gp": 0.0,
                    "letter_grade": "F",
                    "status": "FAIL",
                    "rule_code": rule_code,
                    "explanation": explanation,
                    "checks": checks
                }
            else:
                # Both passed thresholds, grade based on total marks
                grade_info = get_grade_by_marks(total_mark)
                gp = grade_info["gp"]
                letter_grade = grade_info["grade"]
                status = "PASS" if gp > 0 else "FAIL"
                explanation = f"{name}: Theory ({theory_mark}/{theory_max}) and Practical ({practical_mark}/{practical_max}) both passed. Total mark = {total_mark}/100 → GP {gp} ({letter_grade})."
                return {
                    "subject_code": subject_code,
                    "subject_type": subject_type,
                    "theory_mark": theory_mark,
                    "theory_max": theory_max,
                    "practical_mark": practical_mark,
                    "practical_max": practical_max,
                    "total_mark": total_mark,
                    "gp": gp,
                    "letter_grade": letter_grade,
                    "status": status,
                    "rule_code": grade_info["rule_code"],
                    "explanation": explanation,
                    "checks": checks
                }
        else:
            # Normal subject
            if is_subject_ab:
                abs_type = rule_codes.COMPULSORY_ABSENCE if subject_type == "COMPULSORY" else rule_codes.OPTIONAL_ABSENCE
                return {
                    "subject_code": subject_code,
                    "subject_type": subject_type,
                    "theory_mark": None,
                    "theory_max": 0.0,
                    "practical_mark": None,
                    "practical_max": 0.0,
                    "total_mark": None,
                    "gp": 0.0,
                    "letter_grade": "F",
                    "status": "ABSENT",
                    "rule_code": abs_type,
                    "explanation": f"{name}: Student was absent.",
                    "checks": []
                }

            t_val = mark_data.get("total_mark")
            total_mark = float(t_val)
            grade_info = get_grade_by_marks(total_mark)
            gp = grade_info["gp"]
            letter_grade = grade_info["grade"]
            status = "PASS" if gp > 0 else "FAIL"
            explanation = f"{name}: Total mark = {total_mark}/100 → GP {gp} ({letter_grade}) because marks fall within {grade_info['min']}–{grade_info['max']} boundary."

            return {
                "subject_code": subject_code,
                "subject_type": subject_type,
                "theory_mark": None,
                "theory_max": 0.0,
                "practical_mark": None,
                "practical_max": 0.0,
                "total_mark": total_mark,
                "gp": gp,
                "letter_grade": letter_grade,
                "status": status,
                "rule_code": grade_info["rule_code"],
                "explanation": explanation,
                "checks": []
            }

    @classmethod
    def calculate(
        cls,
        student_id: str,
        name: str,
        class_name: str,
        optional_subject: str,
        marks: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Runs the full grading deterministic pipeline for a student.
        """
        # Validate marks format
        validation_errors = cls.validate_student_marks(optional_subject, marks)
        if validation_errors:
            raise ValueError(f"Validation failed: {validation_errors}")

        # Step 1 & 2: Subject Evaluation
        evaluated_subjects = []
        compulsory_results = []
        optional_result = None

        for sub_code, mark_data in marks.items():
            if sub_code in COMPULSORY_SUBJECTS:
                sub_res = cls.evaluate_subject(sub_code, "COMPULSORY", mark_data)
                evaluated_subjects.append(sub_res)
                compulsory_results.append(sub_res)
            elif sub_code == optional_subject:
                sub_res = cls.evaluate_subject(sub_code, "OPTIONAL", mark_data)
                evaluated_subjects.append(sub_res)
                optional_result = sub_res

        # Step 3: Compulsory Failure Check
        failed_compulsory = [sub for sub in compulsory_results if sub["status"] == "FAIL"]
        absent_compulsory = [sub for sub in compulsory_results if sub["status"] == "ABSENT"]
        has_compulsory_failure = len(failed_compulsory) > 0 or len(absent_compulsory) > 0

        # Step 4: Optional Contribution
        optional_gp = optional_result["gp"] if optional_result else 0.0
        optional_is_absent = optional_result["status"] == "ABSENT" if optional_result else False

        if optional_is_absent:
            optional_contribution = 0.0
            optional_rule_code = rule_codes.OPTIONAL_ABSENCE
            optional_explanation = "Optional subject absence contributes 0.0 to GPA and does not independently cause a compulsory failure."
        else:
            optional_contribution = max(0.0, optional_gp - 2.0)
            if optional_contribution > 0.0:
                optional_rule_code = rule_codes.OPTIONAL_BONUS
                optional_explanation = f"Optional subject GP of {optional_gp} is above the 2.0 threshold. Contribution = max(0, {optional_gp} - 2.0) = +{optional_contribution:.2f} GP."
            else:
                optional_rule_code = rule_codes.OPTIONAL_NO_CONTRIBUTION
                optional_explanation = f"Optional subject GP of {optional_gp} is at or below the 2.0 threshold. Contribution = 0.0."

        # Step 5: Uncancelled GPA Calculation
        compulsory_gp_sum = sum(sub["gp"] for sub in compulsory_results)
        raw_gpa = (compulsory_gp_sum + optional_contribution) / 6.0

        # Round according to GPA precision
        precision = settings.GPA_ROUNDING_PRECISION
        uncancelled_gpa = round(raw_gpa, precision)

        # Step 6: Compulsory Failure Override & GPA Cap
        final_gpa = uncancelled_gpa
        override_applied = False
        override_code = None
        override_reason = None
        final_status = "PASS"

        if has_compulsory_failure:
            final_gpa = 0.0
            final_status = "FAIL"
            override_applied = True
            
            reasons = []
            if absent_compulsory:
                reasons.append(f"absent in compulsory subject(s): {', '.join(sub['subject_code'] for sub in absent_compulsory)}")
                override_code = rule_codes.COMPULSORY_ABSENCE
            if failed_compulsory:
                reasons.append(f"failed compulsory subject(s): {', '.join(sub['subject_code'] for sub in failed_compulsory)}")
                override_code = rule_codes.COMPULSORY_FAILURE
            
            override_reason = f"At least one compulsory subject failed. Overridden due to: {'; '.join(reasons)}."
        elif uncancelled_gpa > 5.0:
            final_gpa = 5.0
            override_applied = True
            override_code = rule_codes.GPA_CAP_5
            override_reason = f"Calculated uncancelled GPA of {uncancelled_gpa} exceeded the maximum allowable GPA. Capped at 5.00."

        # Step 7: Final Letter Grade mapping
        final_grade = map_gpa_to_letter_grade(final_gpa)
        if final_status == "FAIL":
            final_grade = "F"

        # Assemble the output dictionary
        return {
            "student_id": student_id,
            "student_name": name,
            "class_name": class_name,
            "optional_subject": optional_subject,
            "subjects": evaluated_subjects,
            "optional_contribution": optional_contribution,
            "uncancelled_gpa": uncancelled_gpa,
            "final_gpa": final_gpa,
            "final_grade": final_grade,
            "final_status": final_status,
            "compulsory_failure": has_compulsory_failure,
            "override_applied": override_applied,
            "override_code": override_code,
            "override_reason": override_reason,
            "optional_rule_code": optional_rule_code,
            "optional_explanation": optional_explanation
        }
