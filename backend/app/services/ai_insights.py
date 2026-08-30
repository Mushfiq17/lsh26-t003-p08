import httpx
from typing import Dict, Any, Optional
from app.core.config import settings

class AIInsightsService:
    OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
    MODELS_TO_TRY = [
        "google/gemini-2.0-flash-001",
        "google/gemini-1.5-flash",
        "meta-llama/llama-3.3-70b-instruct:free",
        "openrouter/auto"
    ]

    @staticmethod
    async def generate_class_insights(analytics_data: Dict[str, Any]) -> str:
        """
        Uses OpenRouter API to generate an executive AI summary of class performance,
        with multi-model fallback and local data-driven analytical fallback.
        """
        api_key = settings.OPENROUTER_API_KEY.strip()

        if api_key and not api_key.startswith("sk-or-v1-placeholder"):
            prompt = (
                f"You are an expert AI Academic Advisor for GradeForge.\n"
                f"Analyze the following school exam dataset:\n"
                f"- Total Enrolled Students: {analytics_data.get('total_students', 0)}\n"
                f"- Pass Rate: {analytics_data.get('pass_rate', 0)}%\n"
                f"- Failure Rate: {analytics_data.get('failure_rate', 0)}%\n"
                f"- Average Final GPA: {analytics_data.get('average_final_gpa', 0.0)}\n"
                f"- Practical Threshold Failures: {analytics_data.get('practical_failures', 0)}\n"
                f"- Absences: {analytics_data.get('absences', 0)}\n"
                f"- Grade Distribution: {analytics_data.get('grade_distribution', {})}\n"
                f"- Subject Failure Counts: {analytics_data.get('subject_failure_counts', {})}\n\n"
                f"Provide a concise 3-bullet point executive summary highlighting key academic performance trends, "
                f"identifying bottleneck subjects, and actionable recommendations for teachers."
            )

            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "GradeForge Academic Engine"
            }

            for model_name in AIInsightsService.MODELS_TO_TRY:
                payload = {
                    "model": model_name,
                    "messages": [
                        {"role": "system", "content": "You are a professional educational data analyst."},
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 400,
                    "temperature": 0.5
                }
                try:
                    async with httpx.AsyncClient(timeout=8.0) as client:
                        response = await client.post(AIInsightsService.OPENROUTER_URL, headers=headers, json=payload)
                        if response.status_code == 200:
                            data = response.json()
                            content = data["choices"][0]["message"]["content"].strip()
                            if content:
                                return content
                except Exception:
                    continue

        # If OpenRouter call is missing key or fails/rate-limited, generate smart local data-driven analytics
        return AIInsightsService._generate_fallback_class_insights(analytics_data)

    @staticmethod
    async def generate_student_advice(student_data: Dict[str, Any]) -> str:
        """
        Generates personalized academic improvement advice for an individual student.
        """
        api_key = settings.OPENROUTER_API_KEY.strip()

        if api_key and not api_key.startswith("sk-or-v1-placeholder"):
            student_name = student_data.get("name", "Student")
            summary = student_data.get("result_summary", {})
            subjects = student_data.get("subjects", [])

            sub_summary = [
                f"{s.get('subject_code')}: Grade {s.get('letter_grade')} (GP {s.get('gp')}, Total {s.get('total_mark', 'N/A')})"
                for s in subjects
            ]

            prompt = (
                f"Provide 2-3 encouraging, constructive academic improvement recommendations for student '{student_name}':\n"
                f"- Final Status: {summary.get('final_status', 'N/A')}\n"
                f"- Final GPA: {summary.get('final_gpa', '0.00')} ({summary.get('final_grade', 'N/A')})\n"
                f"- Subject Breakdown: {', '.join(sub_summary)}\n\n"
                f"Focus on subjects where they scored below GP 3.0 or failed practical/theory thresholds."
            )

            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:5173",
                "X-Title": "GradeForge Academic Engine"
            }

            for model_name in AIInsightsService.MODELS_TO_TRY:
                payload = {
                    "model": model_name,
                    "messages": [
                        {"role": "system", "content": "You are a supportive academic mentor."},
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 300,
                    "temperature": 0.5
                }
                try:
                    async with httpx.AsyncClient(timeout=8.0) as client:
                        response = await client.post(AIInsightsService.OPENROUTER_URL, headers=headers, json=payload)
                        if response.status_code == 200:
                            data = response.json()
                            content = data["choices"][0]["message"]["content"].strip()
                            if content:
                                return content
                except Exception:
                    continue

        return AIInsightsService._generate_fallback_student_advice(student_data)

    @staticmethod
    def _generate_fallback_class_insights(data: Dict[str, Any]) -> str:
        total = data.get("total_students", 0)
        pass_rate = data.get("pass_rate", 0)
        fail_rate = data.get("failure_rate", 0)
        avg_gpa = data.get("average_final_gpa", 0.0)
        practical_fails = data.get("practical_failures", 0)
        absences = data.get("absences", 0)
        subject_fails = data.get("subject_failure_counts", {})

        sorted_fails = sorted(subject_fails.items(), key=lambda x: x[1], reverse=True)
        top_bottlenecks = [f"{sub} ({cnt} fails)" for sub, cnt in sorted_fails[:2] if cnt > 0]
        bottleneck_str = ", ".join(top_bottlenecks) if top_bottlenecks else "None (all subjects performing well)"

        insights = [
            f"• Overall Performance: Out of {total} enrolled students, the pass rate stands at {pass_rate}% with an average GPA of {avg_gpa:.2f} and a failure rate of {fail_rate}%.",
            f"• Subject Bottlenecks & Practical Risks: Primary subject bottlenecks detected in {bottleneck_str}. Practical exam threshold failures recorded: {practical_fails}.",
            f"• Recommended Actions: Organize targeted revision sessions for high-risk subjects, verify lab logbooks for practical borderlines, and conduct attendance reviews for {absences} absent record(s)."
        ]
        return "\n\n".join(insights)

    @staticmethod
    def _generate_fallback_student_advice(student_data: Dict[str, Any]) -> str:
        name = student_data.get("name", "Student")
        summary = student_data.get("result_summary", {})
        subjects = student_data.get("subjects", [])

        weak_subs = [s.get("subject_code") for s in subjects if (s.get("gp", 0) < 3.0 or s.get("letter_grade") == 'F')]
        weak_str = ", ".join(weak_subs) if weak_subs else "all active subjects"

        return (
            f"• Academic Status for {name}: Current GPA is {summary.get('final_gpa', 0.00)} ({summary.get('final_status', 'N/A')}).\n"
            f"• Priority Target: Dedicate extra study hours to {weak_str} to boost score above 60% (Grade B / GP 3.0).\n"
            f"• Practical & Assignment Review: Ensure lab work and internal assessments are verified with subject teachers before final term evaluation."
        )
