import React, { useState } from 'react';
import type { Student } from '../types';

interface StudentsTableProps {
  students: Student[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
  selectedStudentId: string | null;
  onSelectStudent: (s: Student) => void;
  onPageChange: (p: number) => void;
  filterClass: string;
  setFilterClass: (c: string) => void;
  filterStatus: string;
  setFilterStatus: (s: string) => void;
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const StudentsTable: React.FC<StudentsTableProps> = ({
  students, total, page, pageSize, pages,
  selectedStudentId, onSelectStudent, onPageChange,
  filterClass, setFilterClass, filterStatus: _filterStatus, setFilterStatus: _setFilterStatus, loading,
  searchQuery, setSearchQuery
}) => {
  const [activeFilterTab, setActiveFilterTab] = useState<'All' | 'Flagged' | 'Absent'>('All');

  const filteredStudents = students.filter(student => {
    if (activeFilterTab === 'All') return true;

    const summary = student.result_summary;
    const isAbsent = student.subjects?.some(s => s.status === 'ABSENT') || summary?.final_status === 'ABSENT';

    if (activeFilterTab === 'Absent') {
      return isAbsent;
    }

    if (activeFilterTab === 'Flagged') {
      // Flagged = has compulsory failure, override applied, optional contribution <= 0/ GP <= 2, or is absent
      const hasCompulsoryFail = summary?.compulsory_failure || summary?.final_status === 'FAIL';
      const isOptionalFail = student.subjects?.some(s => s.subject_type === 'OPTIONAL' && s.gp <= 2.0);
      return hasCompulsoryFail || isOptionalFail || isAbsent;
    }

    return true;
  });

  return (
    <div className="flex flex-col gap-4 font-mono">
      {/* Roster Container Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-none">
        <div className="flex justify-between items-center px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
          <span className="font-bold text-xs uppercase tracking-wider text-zinc-700 dark:text-zinc-300">STUDENT ROSTER</span>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold">{filteredStudents.length} OF {total}</span>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-450 text-xs">⌕</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by ID, name..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#FAF9F5] dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-neutral-850 dark:text-neutral-200 placeholder-zinc-450 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition font-sans"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-zinc-200 dark:border-zinc-800">
          {(['All', 'Flagged', 'Absent'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveFilterTab(tab)}
              className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${
                activeFilterTab === tab
                  ? 'bg-black text-white dark:bg-white dark:text-black'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200'
              }`}
            >
              {tab}
            </button>
          ))}

          {/* Quick class selectors */}
          <div className="ml-auto flex items-center gap-1.5">
            <select
              value={filterClass}
              onChange={e => setFilterClass(e.target.value)}
              className="bg-transparent text-[10px] font-bold text-zinc-500 focus:outline-none cursor-pointer uppercase font-mono"
            >
              {['All Classes', ...Array.from(new Set(students.map(s => s.class_name))).filter(Boolean)].map(c => (
                <option key={c} value={c} className="bg-white dark:bg-zinc-900 text-neutral-800 dark:text-neutral-200">{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Roster List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/30 text-zinc-450 dark:text-zinc-500 text-[10px] font-bold uppercase border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-4 py-2 w-16">ID</th>
                <th className="px-4 py-2">NAME</th>
                <th className="px-4 py-2 text-right">GPA</th>
                <th className="px-4 py-2 text-center w-14">GR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/50 dark:divide-zinc-800/40">
              {loading && (
                <tr><td colSpan={4} className="text-center py-10 text-zinc-400">Loading roster...</td></tr>
              )}
              {!loading && filteredStudents.length === 0 && (
                <tr><td colSpan={4} className="text-center py-10 text-zinc-400">No records found.</td></tr>
              )}
              {!loading && filteredStudents.map(student => {
                const summary = student.result_summary;
                const isSelected = selectedStudentId === student.student_id;
                const shortId = student.student_id.replace('EDGE-', '').replace('STU-', '');

                // Grade badge style based on grade and selection
                const grade = summary?.final_grade ?? '—';
                const isFail = grade === 'F';
                const isTop = grade === 'A+' || grade === 'A';

                let badgeClass = '';
                if (isSelected) {
                  badgeClass = 'border border-white/60 text-white';
                } else if (isFail) {
                  badgeClass = 'border border-rose-500/40 text-rose-500 bg-rose-50/50 dark:bg-rose-950/20';
                } else if (isTop) {
                  badgeClass = 'border border-emerald-500/40 text-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20';
                } else {
                  badgeClass = 'border border-amber-500/40 text-amber-500 bg-amber-50/50 dark:bg-amber-950/20';
                }

                return (
                  <tr
                    key={student.student_id}
                    onClick={() => onSelectStudent(student)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 font-bold'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/30 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <td className="px-4 py-2.5 font-mono text-[11px] select-none">
                      {shortId}
                    </td>
                    <td className="px-4 py-2.5 font-sans font-semibold">
                      {student.name}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold">
                      {summary ? summary.final_gpa.toFixed(2) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold min-w-[24px] text-center uppercase tracking-wide transition-colors ${badgeClass}`}>
                        {grade}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/30 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center text-[10px] text-zinc-400 dark:text-zinc-500">
          <span>{total > 0 ? `${(page - 1) * pageSize + 1} TO ${Math.min(page * pageSize, total)} OF ${total}` : '0 RESULTS'}</span>
          <div className="flex items-center gap-1 font-mono">
            <button 
              onClick={(e) => { e.stopPropagation(); onPageChange(page - 1); }} 
              disabled={page === 1} 
              className="px-2 py-0.5 border border-zinc-200 dark:border-zinc-850 rounded bg-white dark:bg-zinc-900 hover:bg-zinc-50 disabled:opacity-30 text-[9px] font-bold"
            >
              PREV
            </button>
            <span className="px-1.5">PAGE {page}</span>
            <button 
              onClick={(e) => { e.stopPropagation(); onPageChange(page + 1); }} 
              disabled={page === pages} 
              className="px-2 py-0.5 border border-zinc-200 dark:border-zinc-850 rounded bg-white dark:bg-zinc-900 hover:bg-zinc-50 disabled:opacity-30 text-[9px] font-bold"
            >
              NEXT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
