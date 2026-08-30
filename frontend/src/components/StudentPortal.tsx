import React, { useState } from 'react';
import { GraduationCap, Search, LogOut, CheckCircle2, XCircle, Award, BookOpen } from 'lucide-react';
import { api } from '../api';
import type { Student } from '../types';

interface StudentPortalProps {
  userEmail?: string | null;
  onLogout: () => void;
  onSwitchToTeacherPortal?: () => void;
}

const SAMPLE_IDS = ['STU-001', 'EDGE-01', 'STU-005', 'STU-010', 'EDGE-05'];

export const StudentPortal: React.FC<StudentPortalProps> = ({ userEmail, onLogout, onSwitchToTeacherPortal }) => {
  const [studentIdInput, setStudentIdInput] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [trace, setTrace] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [aiAdviceLoading, setAiAdviceLoading] = useState(false);

  const fetchStudentAdvice = async (id: string) => {
    setAiAdviceLoading(true);
    try {
      const res = await api.getStudentAdvice(id);
      if (res && res.advice && !res.advice.includes("Failed") && !res.advice.includes("error")) {
        setAiAdvice(res.advice);
        setAiAdviceLoading(false);
        return;
      }
    } catch {
      // Fallback
    }

    if (student) {
      const weakSubs = student.subjects?.filter(s => s.gp < 3.0 || s.letter_grade === 'F').map(s => s.subject_code);
      const weakStr = weakSubs && weakSubs.length > 0 ? weakSubs.join(", ") : "all current subjects";
      setAiAdvice(
        `• Personal Academic Plan for ${student.name}:\n` +
        `• Current Final GPA: ${student.result_summary?.final_gpa?.toFixed(2) ?? '0.00'} (${student.result_summary?.final_status ?? 'N/A'}).\n` +
        `• Focus Areas: Allocate dedicated review sessions to ${weakStr} to improve your grade points above 3.0.\n` +
        `• Practical & Lab: Complete all practical experiments and continuous assessment tasks on time to secure pass thresholds.`
      );
    }
    setAiAdviceLoading(false);
  };

  const handleSearch = async (e?: React.FormEvent, customId?: string) => {
    if (e) e.preventDefault();
    const query = (customId || studentIdInput).trim();
    if (!query) return;

    setLoading(true);
    setError(null);
    setStudent(null);
    setTrace(null);
    setAiAdvice(null);

    let res: Student | null = null;

    try {
      // 1. Try direct exact lookup first
      try {
        res = await api.getStudent(query);
      } catch {
        res = null;
      }

      // 2. Smart Padded Variation Lookup (e.g. "01" -> "STU-001" or "EDGE-01")
      if (!res) {
        const num = query.replace(/\D/g, '');
        if (num) {
          const padded3 = num.padStart(3, '0'); // "001"
          const padded2 = num.padStart(2, '0'); // "01"
          const candidateIDs = [
            `STU-${padded3}`,
            `EDGE-${padded2}`,
            `EDGE-${padded3}`,
            `STU-${num}`,
            `S${padded3}`
          ];

          for (const cand of candidateIDs) {
            try {
              const matched = await api.getStudent(cand);
              if (matched) {
                res = matched;
                setStudentIdInput(cand);
                break;
              }
            } catch {
              continue;
            }
          }
        }
      }

      // 3. Fallback to roster search query (by student name or partial ID)
      if (!res) {
        try {
          const searchRes = await api.getStudents({ search: query, page_size: 5 });
          if (searchRes && searchRes.students && searchRes.students.length > 0) {
            const found = searchRes.students[0];
            res = found;
            if (found?.student_id) setStudentIdInput(found.student_id);
          }
        } catch {
          res = null;
        }
      }

      if (res) {
        setStudent(res);
        try {
          const traceRes = await api.getStudentTrace(res.student_id);
          setTrace(traceRes);
        } catch {
          setTrace(null);
        }
      } else {
        setError(`No student record found with ID "${query}". Try sample IDs like STU-001 or EDGE-01.`);
      }
    } catch (err: any) {
      setError(`No student record found with ID "${query}". Try sample IDs like STU-001 or EDGE-01.`);
    } finally {
      setLoading(false);
    }
  };

  const summary = student?.result_summary;
  const isPass = summary?.final_status === 'PASS';

  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-zinc-950 text-neutral-800 dark:text-neutral-100 font-mono transition-colors flex flex-col">
      {/* Top Header */}
      <header className="bg-[#0c0c0b] text-white border-b-2 border-amber-500/20 px-8 py-5 flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 p-2 rounded-xl text-black">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black font-sans tracking-tight uppercase text-neutral-100">GradeForge</h1>
            <p className="text-[10px] text-amber-500/80 uppercase tracking-widest">Student Result Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {onSwitchToTeacherPortal && (
            <button
              onClick={onSwitchToTeacherPortal}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition font-mono"
            >
              👨‍🏫 Teacher Portal
            </button>
          )}
          <span className="text-xs text-zinc-400 font-sans hidden sm:inline">{userEmail ?? 'Student'}</span>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition font-mono"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col gap-6">
        
        {/* Search Bar Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-500 mb-1">Lookup Your Result</h2>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 font-sans mb-4">Enter your Student ID (e.g. STU-001, EDGE-01) or student name to view your official report card.</p>
          
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={studentIdInput}
                onChange={e => setStudentIdInput(e.target.value)}
                placeholder="Enter Student ID (e.g., STU-001 or 01)"
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-neutral-800 dark:text-neutral-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase hover:opacity-80 transition disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'View Results'}
            </button>
          </form>

          {/* Quick Click Sample IDs */}
          <div className="flex items-center gap-2 mt-3 text-[11px] text-zinc-400 font-sans">
            <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-zinc-500">Quick Samples:</span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_IDS.map(id => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setStudentIdInput(id);
                    handleSearch(undefined, id);
                  }}
                  className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-500 hover:text-black text-zinc-700 dark:text-zinc-300 rounded-lg font-mono text-[11px] transition font-bold"
                >
                  {id}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}
        </div>

        {/* Report Card */}
        {student && (
          <div className="flex flex-col gap-6">
            {/* Summary Banner */}
            <div className={`border rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
              isPass
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl text-white ${isPass ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                  {isPass ? <CheckCircle2 className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold font-sans text-neutral-900 dark:text-neutral-100">{student.name}</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">ID: {student.student_id} · Class: {student.class_name} · Optional: {student.optional_subject}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 font-sans">
                <div className="text-center">
                  <span className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest">FINAL GPA</span>
                  <span className="text-3xl font-black text-neutral-900 dark:text-neutral-100">
                    {summary ? summary.final_gpa.toFixed(2) : '—'}
                  </span>
                </div>
                <div className="text-center">
                  <span className="block text-[10px] font-mono text-zinc-400 uppercase tracking-widest">GRADE</span>
                  <span className={`inline-block px-3 py-1 rounded-xl text-lg font-black ${
                    isPass ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                  }`}>
                    {summary?.final_grade ?? 'F'}
                  </span>
                </div>
              </div>
            </div>

            {/* Subject Marks Table */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-amber-500 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Academic Transcript & Subject Breakdown
                </span>
                <span className="text-[10px] text-zinc-400">TERM: FINAL 2024-25</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/30 text-zinc-400 text-[10px] font-bold uppercase border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="px-4 py-3">SUBJECT</th>
                      <th className="px-4 py-3 text-center">TYPE</th>
                      <th className="px-4 py-3 text-right">THEORY</th>
                      <th className="px-4 py-3 text-right">PRACTICAL</th>
                      <th className="px-4 py-3 text-right">TOTAL</th>
                      <th className="px-4 py-3 text-center">GRADE</th>
                      <th className="px-4 py-3 text-right">GP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/50">
                    {student.subjects?.map((sub, i) => (
                      <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20">
                        <td className="px-4 py-3 font-bold">{sub.subject_code}</td>
                        <td className="px-4 py-3 text-center text-[10px] text-zinc-400 uppercase">{sub.subject_type}</td>
                        <td className="px-4 py-3 text-right">{sub.theory_mark ?? '—'}</td>
                        <td className="px-4 py-3 text-right">{sub.practical_mark ?? '—'}</td>
                        <td className="px-4 py-3 text-right font-bold">{sub.total_mark ?? '—'}</td>
                        <td className="px-4 py-3 text-center font-bold">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            sub.letter_grade === 'F' ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                          }`}>
                            {sub.letter_grade}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold">{sub.gp.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* AI Personalized Academic Advice */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 shadow-sm flex flex-col gap-3 font-mono">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
                  <Award className="h-4 w-4" /> AI Study & Improvement Plan
                </h4>
                <button
                  onClick={() => fetchStudentAdvice(student.student_id)}
                  disabled={aiAdviceLoading}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs uppercase transition disabled:opacity-50"
                >
                  {aiAdviceLoading ? "Generating..." : aiAdvice ? "Refresh Advice" : "Get AI Advice"}
                </button>
              </div>
              {aiAdvice && (
                <div className="text-xs text-zinc-700 dark:text-zinc-300 font-sans leading-relaxed whitespace-pre-line pt-2 border-t border-amber-500/20">
                  {aiAdvice}
                </div>
              )}
            </div>

            {/* Step-by-Step Rule Explanation */}
            {trace && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2 font-mono">
                    <Award className="h-4 w-4 text-amber-500" /> Official Calculation & Evaluation Steps
                  </h4>
                  <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase font-bold">
                    8 Pipeline Steps
                  </span>
                </div>
                <div className="flex flex-col gap-3 font-sans">
                  {trace.steps?.map((step: any, idx: number) => {
                    const stepNum = step.step_number || idx + 1;
                    const status = step.status || 'PASSED';
                    const isFailOrFlagged = status === 'FAIL' || status === 'FLAGGED' || status === 'OVERRIDDEN';

                    return (
                      <div 
                        key={idx} 
                        className="p-4 bg-zinc-50 dark:bg-zinc-950/60 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col gap-2 relative overflow-hidden group hover:border-amber-500/50 transition-all shadow-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 font-mono">
                          <div className="flex items-center gap-2.5">
                            <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/30 text-[11px] font-black uppercase tracking-wider">
                              STEP {stepNum < 10 ? `0${stepNum}` : stepNum}
                            </span>
                            <span className="font-bold text-neutral-900 dark:text-neutral-100 text-xs tracking-tight">
                              {step.rule_name || step.step?.replace(/_/g, ' ')}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-auto">
                            {step.rule_code && (
                              <span className="text-[9px] font-mono uppercase text-zinc-400 dark:text-zinc-500 px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                                {step.rule_code}
                              </span>
                            )}
                            <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                              isFailOrFlagged 
                                ? 'bg-rose-500/10 text-rose-500 border-rose-500/30 dark:bg-rose-950/40' 
                                : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 dark:bg-emerald-950/40'
                            }`}>
                              {status}
                            </span>
                          </div>
                        </div>

                        {step.calculation && step.calculation !== 'Identity transformation' && (
                          <div className="text-[11px] font-mono text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-lg px-3 py-1.5 overflow-x-auto">
                            <span className="text-amber-500 font-bold mr-2">formula &gt;</span> {step.calculation}
                          </div>
                        )}

                        <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed text-xs font-sans">
                          {step.explanation}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
};
