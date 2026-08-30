from typing import Dict, Any, List
from app.core.config import settings

class TraceBuilder:
    @staticmethod
    def build_trace(
        student_id: str,
        name: str,
        class_name: str,
        optional_subject: str,
        raw_marks: Dict[str, Any],
        calc_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Builds a full explainable trace for the student evaluation pipeline.
        """
        steps = []

        # Step 1: RAW_MARKS
        steps.append({
            "step_number": 1,
            "step": "RAW_MARKS",
            "rule_name": "Raw Marks Ingestion",
            "status": "PASSED",
            "input": {
                "student_id": student_id,
                "student_name": name,
                "class_name": class_name,
                "optional_subject": optional_subject,
                "marks": raw_marks
            },
            "rule_code": "DATA_LOADED",
            "calculation": "Identity transformation",
            "output": raw_marks,
            "explanation": "Raw marks successfully loaded from the input dataset."
        })

        # Step 2: VALIDATION
        steps.append({
            "step_number": 2,
            "step": "VALIDATION",
            "rule_name": "Boundary & Range Validation",
            "status": "PASSED",
            "input": {
                "optional_subject": optional_subject,
                "marks": raw_marks
            },
            "rule_code": "MARKS_VERIFIED",
            "calculation": "Check subject codes, maximum scores, negative marks, and completeness",
            "output": {
                "validation_status": "VALID",
                "errors": []
            },
            "explanation": "All student records and mark boundaries were successfully verified."
        })

        # Step 3: SUBJECT_EVALUATION
        subject_inputs = {}
        subject_outputs = {}
        for sub in calc_result["subjects"]:
            code = sub["subject_code"]
            subject_inputs[code] = raw_marks.get(code)
            subject_outputs[code] = {
                "gp": sub["gp"],
                "letter_grade": sub["letter_grade"],
                "status": sub["status"],
                "rule_code": sub["rule_code"],
                "explanation": sub["explanation"]
            }
            if "checks" in sub and sub["checks"]:
                subject_outputs[code]["checks"] = sub["checks"]

        steps.append({
            "step_number": 3,
            "step": "SUBJECT_EVALUATION",
            "rule_name": "Individual Subject Evaluation",
            "status": "PASSED",
            "input": subject_inputs,
            "rule_code": "DUAL_THRESHOLD_EVAL",
            "calculation": "Evaluate each subject. For practicals, check theory (>=25/75) and practical (>=8/25) thresholds independently.",
            "output": subject_outputs,
            "explanation": "Subjects evaluated individually. Theory and practical thresholds checked independently."
        })

        # Step 4: COMPULSORY_FAILURE_CHECK
        compulsory_subs = [s for s in calc_result["subjects"] if s["subject_type"] == "COMPULSORY"]
        failed_compulsory = [s["subject_code"] for s in compulsory_subs if s["status"] in ("FAIL", "ABSENT")]
        has_fail = calc_result["compulsory_failure"]

        steps.append({
            "step_number": 4,
            "step": "COMPULSORY_FAILURE_CHECK",
            "rule_name": "Compulsory Failure Audit",
            "status": "FLAGGED" if has_fail else "PASSED",
            "input": {
                "compulsory_subjects": [
                    {"code": s["subject_code"], "gp": s["gp"], "status": s["status"]}
                    for s in compulsory_subs
                ]
            },
            "rule_code": "FAIL_FLAGGED" if has_fail else "COMPULSORY_PASS",
            "calculation": f"Find compulsory subjects with status in ['FAIL', 'ABSENT']. Detected: {failed_compulsory if failed_compulsory else 'None'}",
            "output": {
                "has_compulsory_failure": has_fail,
                "failed_compulsory_subjects": failed_compulsory
            },
            "explanation": f"If any compulsory subject has GP 0.0 or is absent, the student fails overall. Result: {'COMPULSORY FAILURE DETECTED (' + ', '.join(failed_compulsory) + ')' if has_fail else 'All compulsory subjects passed.'}"
        })

        # Step 5: OPTIONAL_CONTRIBUTION
        optional_result = next((s for s in calc_result["subjects"] if s["subject_type"] == "OPTIONAL"), None)
        optional_gp = optional_result["gp"] if optional_result else 0.0
        steps.append({
            "step_number": 5,
            "step": "OPTIONAL_CONTRIBUTION",
            "rule_name": "Optional Subject Contribution",
            "status": "PASSED",
            "input": {
                "optional_subject": optional_subject,
                "optional_gp": optional_gp,
                "optional_status": optional_result["status"] if optional_result else "MISSING"
            },
            "rule_code": calc_result["optional_rule_code"],
            "calculation": f"max(0.0, {optional_gp} - 2.0) = +{calc_result['optional_contribution']:.2f} GP",
            "output": {
                "optional_contribution": calc_result["optional_contribution"]
            },
            "explanation": calc_result["optional_explanation"]
        })

        # Step 6: UNCANCELLED_GPA
        compulsory_gps = [s["gp"] for s in compulsory_subs]
        comp_sum = sum(compulsory_gps)
        steps.append({
            "step_number": 6,
            "step": "UNCANCELLED_GPA",
            "rule_name": "Uncancelled GPA Formula",
            "status": "PASSED",
            "input": {
                "compulsory_gps": compulsory_gps,
                "optional_contribution": calc_result["optional_contribution"]
            },
            "rule_code": "GPA_FORMULA",
            "calculation": f"({comp_sum} + {calc_result['optional_contribution']:.2f}) / 6 = {calc_result['uncancelled_gpa']:.2f}",
            "output": {
                "uncancelled_gpa": calc_result["uncancelled_gpa"]
            },
            "explanation": f"The uncancelled GPA is calculated using the formula: (sum(compulsory_gp) + optional_contribution) / 6, rounded to {settings.GPA_ROUNDING_PRECISION} decimal places."
        })

        # Step 7: FINAL_GPA
        steps.append({
            "step_number": 7,
            "step": "FINAL_GPA",
            "rule_name": "Override & Capping Audit",
            "status": "OVERRIDDEN" if calc_result["override_applied"] else "PASSED",
            "input": {
                "uncancelled_gpa": calc_result["uncancelled_gpa"],
                "has_compulsory_failure": calc_result["compulsory_failure"]
            },
            "rule_code": calc_result["override_code"] or "NO_OVERRIDE",
            "calculation": f"Final GPA = {calc_result['final_gpa']:.2f}" + (f" (Overridden from {calc_result['uncancelled_gpa']:.2f})" if calc_result["override_applied"] else ""),
            "output": {
                "final_gpa": calc_result["final_gpa"],
                "override_applied": calc_result["override_applied"],
                "override_reason": calc_result["override_reason"]
            },
            "explanation": calc_result["override_reason"] if calc_result["override_applied"] else "Calculated uncancelled GPA falls below cap and has no compulsory failures."
        })

        # Step 8: LETTER_GRADE
        steps.append({
            "step_number": 8,
            "step": "LETTER_GRADE",
            "rule_name": "Final Grade Assignment",
            "status": calc_result["final_status"],
            "input": {
                "final_gpa": calc_result["final_gpa"],
                "final_status": calc_result["final_status"]
            },
            "rule_code": "GRADE_SCALE",
            "calculation": f"Map GPA {calc_result['final_gpa']:.2f} -> {calc_result['final_grade']} ({calc_result['final_status']})",
            "output": {
                "final_grade": calc_result["final_grade"],
                "final_status": calc_result["final_status"]
            },
            "explanation": f"Overall status evaluated as {calc_result['final_status']} with final letter grade of '{calc_result['final_grade']}'."
        })

        return {
            "student_id": student_id,
            "student_name": name,
            "class_name": class_name,
            "engine": {
                "name": "Deterministic Grading Engine",
                "version": settings.ENGINE_VERSION
            },
            "pipeline": [
                "RAW_MARKS",
                "VALIDATION",
                "SUBJECT_EVALUATION",
                "COMPULSORY_FAILURE_CHECK",
                "OPTIONAL_CONTRIBUTION",
                "UNCANCELLED_GPA",
                "FINAL_GPA",
                "LETTER_GRADE"
            ],
            "steps": steps
        }
