export interface SubjectResult {
  subject_code: string;
  subject_name?: string;
  subject_type: string;
  gp: number;
  status: string;
  letter_grade: string;
  rule_code: string;
  rule_applied?: string;
  mark?: number;
  theory_mark?: number;
  practical_mark?: number;
  total_mark?: number;
}

export interface ResultSummary {
  uncancelled_gpa: number;
  final_gpa: number;
  final_grade: string;
  final_status: string;
  override_applied: boolean;
  override_code?: string;
  override_reason?: string;
  compulsory_failure: boolean;
  optional_contribution: number;
}

export interface Student {
  student_id: string;
  name: string;
  class_name: string;
  optional_subject: string;
  subjects: SubjectResult[];
  result_summary?: ResultSummary;
}

export interface Analytics {
  total_students: number;
  pass_rate: number;
  failure_rate: number;
  average_uncancelled_gpa: number;
  average_final_gpa: number;
  practical_failures: number;
  absences: number;
  optional_review_count: number;
  grade_distribution: Record<string, number>;
  subject_failure_counts: Record<string, number>;
  optional_contribution_distribution: Record<string, number>;
}
