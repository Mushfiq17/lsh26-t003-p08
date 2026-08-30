import type { Student } from '../types';

export function exportToCSV(students: Student[], filename = 'gradeforge_student_records.csv') {
  if (!students || students.length === 0) return;

  const headers = [
    'Student ID',
    'Name',
    'Class',
    'Optional Subject',
    'Final GPA',
    'Final Grade',
    'Final Status',
    'Uncancelled GPA',
    'Compulsory Failure'
  ];

  const rows = students.map(student => {
    const summary = student.result_summary;
    return [
      `"${student.student_id}"`,
      `"${student.name.replace(/"/g, '""')}"`,
      `"${student.class_name}"`,
      `"${student.optional_subject || ''}"`,
      summary ? summary.final_gpa.toFixed(2) : '',
      `"${summary?.final_grade || ''}"`,
      `"${summary?.final_status || ''}"`,
      summary ? summary.uncancelled_gpa.toFixed(2) : '',
      summary?.compulsory_failure ? 'YES' : 'NO'
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToJSON(students: Student[], filename = 'gradeforge_student_records.json') {
  if (!students || students.length === 0) return;
  const jsonContent = JSON.stringify(students, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
