import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { StudentsTable } from './components/StudentsTable';
import { RuleTracePanel } from './components/RuleTracePanel';
import { VerificationPanel } from './components/VerificationPanel';
import { LoginPage } from './components/LoginPage';
import { StudentPortal } from './components/StudentPortal';
import { AddStudentModal } from './components/AddStudentModal';
import { ImportCSVModal } from './components/ImportCSVModal';
import { SubjectsPage } from './components/SubjectsPage';
import { ClassesPage } from './components/ClassesPage';
import { exportToCSV } from './utils/exportUtils';
import { useAuth } from './hooks/useAuth';
import { logout, saveBatchToFirebase } from './firebase';
import { api } from './api';
import {
  CheckCircle2, XCircle, RefreshCw,
  ShieldCheck, Zap
} from 'lucide-react';
import type { Student, Analytics } from './types';

// ─── Helper Components ────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-colors">{title}</h1>
      {subtitle && <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 transition-colors">{subtitle}</p>}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
function DashboardPage({ analytics, analyticsLoading, onNavigate }: {
  analytics: Analytics | null;
  analyticsLoading: boolean;
  onNavigate: (tab: string) => void;
}) {
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const fetchAIInsights = async () => {
    setAiLoading(true);
    try {
      const res = await api.getClassInsights();
      if (res && res.insights && !res.insights.includes("Failed") && !res.insights.includes("error")) {
        setAiInsights(res.insights);
        setAiLoading(false);
        return;
      }
    } catch {
      // Fallback to client-side analytical insight generation if backend route is unavailable
    }

    if (analytics) {
      const passRate = analytics.pass_rate ?? 0;
      const failRate = analytics.failure_rate ?? 0;
      const total = analytics.total_students ?? 0;
      const avgGpa = analytics.average_final_gpa ?? 0.0;
      const practicalFails = analytics.practical_failures ?? 0;
      const absences = analytics.absences ?? 0;

      const subjectFails = analytics.subject_failure_counts ?? {};
      const sortedFails = Object.entries(subjectFails).sort((a, b) => (b[1] as number) - (a[1] as number));
      const topFails = sortedFails.filter(([_, cnt]) => (cnt as number) > 0).slice(0, 2).map(([sub, cnt]) => `${sub} (${cnt} fails)`).join(", ");
      const bottleneckStr = topFails || "None (all subjects performing well)";

      const localInsights = [
        `• Overall Performance: Out of ${total} enrolled students, the pass rate is ${passRate}% with an average GPA of ${avgGpa.toFixed(2)} (${failRate}% failure rate).`,
        `• Subject Bottlenecks & Practical Risks: Primary subject bottlenecks detected in ${bottleneckStr}. Practical exam threshold failures: ${practicalFails}.`,
        `• Recommended Actions: Prioritize targeted revision sessions for high-risk subjects, verify lab logbooks for practical borderlines, and conduct attendance reviews for ${absences} absent student(s).`
      ].join("\n\n");

      setAiInsights(localInsights);
    } else {
      setAiInsights("• AI Analysis: Please seed demo data or load student records to generate academic performance insights.");
    }
    setAiLoading(false);
  };

  const gradeOrder = ['A+', 'A', 'A-', 'B', 'C', 'D', 'F'];
  const maxGrade = analytics ? Math.max(...gradeOrder.map(g => analytics.grade_distribution[g] ?? 0), 1) : 1;

  const subjectOrder = ['BAN', 'ENG', 'MAT', 'PHY', 'CHE', 'BIO', 'HMT', 'AGR', 'REL'];
  const subjectNames: Record<string, string> = {
    BAN: 'Bangla', ENG: 'English', MAT: 'Mathematics',
    PHY: 'Physics', CHE: 'Chemistry', BIO: 'Biology',
    HMT: 'Hi. Math', AGR: 'Agriculture', REL: 'Religion'
  };

  const maxSubjectFails = analytics
    ? Math.max(...subjectOrder.map(s => analytics.subject_failure_counts[s] ?? 0), 1)
    : 1;

  // Pass/Fail donut geometry
  const passRate = analytics?.pass_rate ?? 0;
  const failRate = analytics?.failure_rate ?? 0;
  const r = 42, cx = 52, cy = 52, stroke = 10;
  const circ = 2 * Math.PI * r;
  const passDash = (passRate / 100) * circ;
  const failDash = (failRate / 100) * circ;

  // Optional contribution breakdown
  const optContrib = analytics?.optional_contribution_distribution ?? {};
  const optKeys = Object.keys(optContrib).sort((a, b) => parseFloat(a) - parseFloat(b));
  const maxOptCount = Math.max(...optKeys.map(k => optContrib[k] ?? 0), 1);

  const gradeColors: Record<string, string> = {
    'A+': '#16a34a', 'A': '#22c55e', 'A-': '#86efac',
    'B': '#f59e0b', 'C': '#fb923c', 'D': '#f97316', 'F': '#ef4444'
  };

  if (analyticsLoading) {
    return (
      <div className="flex items-center justify-center py-32 font-mono">
        <div className="flex flex-col items-center gap-3 text-zinc-400">
          <Zap className="h-8 w-8 animate-pulse text-amber-500" />
          <span className="text-xs uppercase tracking-widest">Loading analytics...</span>
        </div>
      </div>
    );
  }

  const noData = !analytics || analytics.total_students === 0;

  return (
    <div className="flex flex-col gap-5 font-mono">
      {/* Page Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5">TERM: FINAL · 2024-25</p>
          <h2 className="text-2xl font-black uppercase tracking-tight text-neutral-900 dark:text-neutral-100 font-sans">Command Centre</h2>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 uppercase tracking-wide">Result processing engine overview</p>
        </div>
        <button
          onClick={() => api.seedDemo().then(() => window.location.reload())}
          className="flex items-center gap-2 bg-amber-500 text-black border border-amber-600 rounded-xl px-4 py-2 text-xs font-black hover:bg-amber-400 transition uppercase"
        >
          <Zap className="h-3.5 w-3.5" /> Seed Demo Data
        </button>
      </div>

      {/* ── AI Executive Summary Banner (OpenRouter) ────────────────────── */}
      <div className="bg-[#121210] dark:bg-zinc-900 border border-amber-500/30 rounded-xl p-4 flex flex-col gap-2 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-wider">
            <Zap className="h-4 w-4" /> AI Academic Performance Analysis (Powered by OpenRouter)
          </div>
          <button
            onClick={fetchAIInsights}
            disabled={aiLoading}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs uppercase transition disabled:opacity-50 font-mono"
          >
            {aiLoading ? "Analyzing..." : aiInsights ? "Refresh Analysis" : "Generate AI Insights"}
          </button>
        </div>
        {aiInsights && (
          <div className="text-xs text-zinc-300 font-sans leading-relaxed whitespace-pre-line pt-2 border-t border-amber-500/20">
            {aiInsights}
          </div>
        )}
      </div>

      {/* ── Stat Strip ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: 'TOTAL ENROLLED', value: analytics?.total_students ?? 0, sub: 'STUDENTS IN SYSTEM', subColor: 'text-zinc-400' },
          { label: 'PASS RATE', value: `${analytics?.pass_rate ?? 0}%`, sub: `${analytics?.failure_rate ?? 0}% FAILURE`, subColor: analytics && analytics.failure_rate > 20 ? 'text-rose-500' : 'text-emerald-500' },
          { label: 'ACTIVE FLAGS', value: (analytics?.practical_failures ?? 0) + (analytics?.absences ?? 0) + (analytics?.optional_review_count ?? 0), sub: 'NEEDING REVIEW', subColor: 'text-amber-500' },
          { label: 'AVG FINAL GPA', value: (analytics?.average_final_gpa ?? 0).toFixed(2), sub: `RAW AVG ${(analytics?.average_uncancelled_gpa ?? 0).toFixed(2)}`, subColor: 'text-zinc-400' },
        ].map(card => (
          <div key={card.label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">{card.label}</p>
            <p className="text-3xl font-black text-neutral-900 dark:text-neutral-100 font-sans leading-tight">{card.value}</p>
            <p className={`text-[9px] font-bold uppercase tracking-wide ${card.subColor}`}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Main Charts Row ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Grade Distribution Bar Chart */}
        <div className="xl:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">GRADE DISTRIBUTION</span>
            <span className="text-[9px] text-zinc-400 uppercase">FINAL GRADES · ALL STUDENTS</span>
          </div>
          <div className="p-5">
            {noData ? (
              <div className="flex items-center justify-center h-40 text-zinc-400 text-xs uppercase tracking-widest">No data — seed demo first</div>
            ) : (
              <div className="flex items-end gap-2 h-44">
                {gradeOrder.map(grade => {
                  const count = analytics?.grade_distribution[grade] ?? 0;
                  const pct = count / maxGrade;
                  const color = gradeColors[grade] ?? '#6b7280';
                  return (
                    <div key={grade} className="flex flex-col items-center gap-1.5 flex-1 group">
                      <span className="text-[10px] font-black text-zinc-600 dark:text-zinc-400 font-mono">{count}</span>
                      <div className="w-full relative rounded-t" style={{ height: '140px', display: 'flex', alignItems: 'flex-end' }}>
                        <div
                          className="w-full rounded-t transition-all duration-500 group-hover:brightness-110"
                          style={{ height: `${Math.max(pct * 100, 3)}%`, backgroundColor: color, minHeight: '4px' }}
                        />
                      </div>
                      <span className="text-[10px] font-black" style={{ color }}>{grade}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Pass / Fail Ring */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">PASS / FAIL SPLIT</span>
          </div>
          <div className="flex flex-col items-center justify-center p-6 gap-4">
            {noData ? (
              <div className="text-zinc-400 text-xs uppercase tracking-widest text-center">No data</div>
            ) : (
              <>
                <svg viewBox="0 0 104 104" className="w-36 h-36">
                  {/* Background circle */}
                  <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e4e4e7" strokeWidth={stroke} />
                  {/* Fail arc (red, starts at top) */}
                  <circle
                    cx={cx} cy={cy} r={r}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth={stroke}
                    strokeDasharray={`${failDash} ${circ}`}
                    strokeDashoffset={circ * 0.25}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.8s ease' }}
                  />
                  {/* Pass arc (green, after fail) */}
                  <circle
                    cx={cx} cy={cy} r={r}
                    fill="none"
                    stroke="#16a34a"
                    strokeWidth={stroke}
                    strokeDasharray={`${passDash} ${circ}`}
                    strokeDashoffset={circ * 0.25 - failDash}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.8s ease' }}
                  />
                  <text x={cx} y={cy - 5} textAnchor="middle" className="fill-neutral-900 dark:fill-neutral-100 font-black text-lg" style={{ fontSize: '14px', fontWeight: 900, fontFamily: 'monospace' }}>
                    {passRate}%
                  </text>
                  <text x={cx} y={cy + 10} textAnchor="middle" style={{ fontSize: '7px', fontWeight: 700, fontFamily: 'monospace', fill: '#71717a', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    PASSING
                  </text>
                </svg>
                <div className="flex gap-4 font-mono text-[10px] font-bold uppercase">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-[#16a34a]" />
                    <span className="text-zinc-600 dark:text-zinc-400">PASS {passRate}%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-[#ef4444]" />
                    <span className="text-zinc-600 dark:text-zinc-400">FAIL {failRate}%</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Charts Row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* Subject Failure Heatmap / Horizontal bars */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">SUBJECT FAILURE COUNT</span>
            <span className="text-[9px] text-zinc-400 uppercase">FAILS + ABSENCES</span>
          </div>
          <div className="p-5 flex flex-col gap-2.5">
            {noData ? (
              <div className="text-zinc-400 text-xs uppercase tracking-widest text-center py-8">No data</div>
            ) : (
              subjectOrder.map(code => {
                const count = analytics?.subject_failure_counts[code] ?? 0;
                const pct = count / maxSubjectFails;
                const intensity = pct > 0.66 ? '#ef4444' : pct > 0.33 ? '#f59e0b' : '#22c55e';
                return (
                  <div key={code} className="flex items-center gap-3">
                    <span className="w-14 text-[10px] font-black text-zinc-600 dark:text-zinc-400 flex-shrink-0 uppercase">{subjectNames[code] ?? code}</span>
                    <div className="flex-1 h-4 bg-zinc-100 dark:bg-zinc-800 rounded overflow-hidden">
                      <div
                        className="h-full rounded transition-all duration-500"
                        style={{ width: `${Math.max(pct * 100, count > 0 ? 3 : 0)}%`, backgroundColor: intensity }}
                      />
                    </div>
                    <span className="w-5 text-[10px] font-black text-zinc-500 dark:text-zinc-400 text-right">{count}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Optional Subject Contribution */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">OPTIONAL CONTRIBUTION</span>
            <span className="text-[9px] text-zinc-400 uppercase">MAX(0, GP - 2.0) TOP-UP</span>
          </div>
          <div className="p-5 flex flex-col gap-2.5">
            {noData || optKeys.length === 0 ? (
              <div className="text-zinc-400 text-xs uppercase tracking-widest text-center py-8">No data</div>
            ) : (
              optKeys.map(key => {
                const count = optContrib[key] ?? 0;
                const pct = count / maxOptCount;
                const contrib = parseFloat(key);
                const color = contrib > 0 ? '#16a34a' : contrib === 0 ? '#6b7280' : '#ef4444';
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="w-10 text-[10px] font-black flex-shrink-0 text-right" style={{ color }}>+{contrib.toFixed(1)}</span>
                    <div className="flex-1 h-4 bg-zinc-100 dark:bg-zinc-800 rounded overflow-hidden">
                      <div
                        className="h-full rounded transition-all duration-500"
                        style={{ width: `${Math.max(pct * 100, count > 0 ? 3 : 0)}%`, backgroundColor: color }}
                      />
                    </div>
                    <span className="w-7 text-[10px] font-black text-zinc-500 dark:text-zinc-400 text-right">{count}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { id: 'students', icon: '📋', label: 'STUDENT RECORDS', desc: 'Browse roster, select student, view full grading trace' },
          { id: 'boundary_tests', icon: '⚙', label: 'BOUNDARY TESTS', desc: 'Run the 30-case deterministic boundary verification suite' },
          { id: 'audits', icon: '📁', label: 'AUDIT TRAIL', desc: 'Full chronological result processing log with overrides' },
        ].map(action => (
          <button
            key={action.id}
            onClick={() => onNavigate(action.id)}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-left hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all group"
          >
            <div className="text-2xl mb-2">{action.icon}</div>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-900 dark:text-neutral-100 mb-1">{action.label}</p>
            <p className="text-[9px] text-zinc-400 dark:text-zinc-500 leading-relaxed font-sans">{action.desc}</p>
            <div className="mt-3 text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 group-hover:text-black dark:group-hover:text-white transition-colors">
              OPEN →
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Students Page (main view from mockup) ────────────────────────────────────
function StudentsPage({ analytics, searchQuery, setSearchQuery }: { analytics: Analytics | null; searchQuery: string; setSearchQuery: (q: string) => void }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(false);
  const [traceLoading, setTraceLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [trace, setTrace] = useState<any>(null);
  const [filterClass, setFilterClass] = useState('All Classes');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [practicalCount, setPracticalCount] = useState(0);
  const [absentCount, setAbsentCount] = useState(0);
  const [showPracticalList, setShowPracticalList] = useState(false);
  const [showAbsentList, setShowAbsentList] = useState(false);
  const [checkingList, setCheckingList] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, page_size: pageSize };
      if (searchQuery) params['search'] = searchQuery;
      if (filterClass !== 'All Classes') params['class'] = filterClass;
      if (filterStatus !== 'All Status') params['status'] = filterStatus;
      const data = await api.getStudents(params as any);
      setStudents(data.students ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, filterClass, filterStatus]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [searchQuery, filterClass, filterStatus]);

  useEffect(() => {
    api.getCheckingList('practical-fail').then(d => setPracticalCount(d.length)).catch(() => {});
    api.getCheckingList('absent').then(d => setAbsentCount(d.length)).catch(() => {});
  }, []);

  const handleSelectStudent = async (student: Student) => {
    setSelectedStudent(student);
    setTrace(null);
    setShowPracticalList(false);
    setShowAbsentList(false);
    setTraceLoading(true);
    try {
      const data = await api.getStudentTrace(student.student_id);
      setTrace(data);
    } catch {
      setTrace(null);
    } finally {
      setTraceLoading(false);
    }
  };

  const handleViewPractical = async () => {
    setSelectedStudent(null);
    setTrace(null);
    setShowPracticalList(true);
    setShowAbsentList(false);
    const data = await api.getCheckingList('practical-fail');
    setCheckingList(data);
  };

  const handleViewAbsent = async () => {
    setSelectedStudent(null);
    setTrace(null);
    setShowAbsentList(true);
    setShowPracticalList(false);
    const data = await api.getCheckingList('absent');
    setCheckingList(data);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const allData = await api.getStudents({ page: 1, page_size: 1000 });
      exportToCSV(allData.students && allData.students.length > 0 ? allData.students : students);
    } catch {
      exportToCSV(students);
    } finally {
      setExporting(false);
    }
  };

  const activeFlags = (analytics?.practical_failures ?? 0) + (analytics?.absences ?? 0) + (analytics?.optional_review_count ?? 0);

  return (
    <div className="flex flex-col gap-5 font-mono">
      {/* Page Meta Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5">TERM: FINAL · 2024-25</p>
          <h2 className="text-2xl font-black uppercase tracking-tight text-neutral-900 dark:text-neutral-100 font-sans">Student Records</h2>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
            <span className="font-bold text-zinc-700 dark:text-zinc-300">{total.toLocaleString()}</span> students enrolled
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors uppercase"
          >
            📥 Import CSV
          </button>
          <button 
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors uppercase disabled:opacity-50"
          >
            📤 {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white rounded-xl px-4 py-2 text-xs font-bold hover:opacity-80 transition uppercase"
          >
            + Add Student
          </button>
        </div>
      </div>

      {/* Stat Cards — retro minimalist style */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: 'TOTAL ENROLLED', value: total.toLocaleString(), sub: '+12% FROM LAST TERM', subColor: 'text-emerald-500' },
          { label: 'PASS RATE', value: `${analytics?.pass_rate ?? 0}%`, sub: 'AVG. ACROSS CLASSES', subColor: 'text-zinc-400' },
          { label: 'ACTIVE FLAGS', value: activeFlags, sub: 'VERIFICATION PENDING', subColor: 'text-amber-500' },
          { label: 'CLASS GPA AVG', value: (analytics?.average_final_gpa ?? 0).toFixed(2), sub: 'FINAL SEMESTER', subColor: 'text-zinc-400' },
        ].map(card => (
          <div key={card.label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">{card.label}</p>
            <p className="text-3xl font-black text-neutral-900 dark:text-neutral-100 font-sans">{card.value}</p>
            <p className={`text-[9px] font-bold uppercase tracking-wide ${card.subColor}`}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Two Column Layout: Roster + Grading Trace */}
      <div className="flex gap-4 items-start">
        {/* Roster Column */}
        <div className="flex-1 min-w-0">
          <StudentsTable
            students={students}
            total={total}
            page={page}
            pageSize={pageSize}
            pages={pages}
            selectedStudentId={selectedStudent?.student_id ?? null}
            onSelectStudent={handleSelectStudent}
            onPageChange={setPage}
            filterClass={filterClass}
            setFilterClass={setFilterClass}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            loading={loading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </div>

        {/* Grading Trace Column */}
        <div className="w-96 flex-shrink-0 flex flex-col gap-4">
          {/* Rule Trace Panel */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <RuleTracePanel
              student={selectedStudent}
              trace={trace}
              loading={traceLoading}
            />
          </div>

          {/* Checking List Overlay (if active) */}
          {(showPracticalList || showAbsentList) && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-3 font-mono">
              <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <span className="font-bold text-xs uppercase text-amber-500">
                  {showPracticalList ? 'PRACTICAL FAILURES' : 'ABSENCE RECORDS'}
                </span>
                <button
                  onClick={() => { setShowPracticalList(false); setShowAbsentList(false); }}
                  className="text-zinc-400 hover:text-black dark:hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto flex flex-col gap-2">
                {checkingList.length === 0 && <p className="text-xs text-zinc-400 px-4 py-3">No records found.</p>}
                {checkingList.map((item, i) => (
                  <div key={i} className="p-2.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs">
                    <p className="font-bold">{item.student_name ?? item.student_id}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{item.subject} · {item.consequence ?? item.failed_requirement}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification Panel */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            <VerificationPanel
              practicalCount={practicalCount}
              absentCount={absentCount}
              onViewPractical={handleViewPractical}
              onViewAbsent={handleViewAbsent}
            />
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchStudents}
      />

      {/* Import CSV Modal */}
      <ImportCSVModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchStudents}
      />
    </div>
  );
}

// ─── Boundary Tests Page ──────────────────────────────────────────────────────
function BoundaryTestsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    try {
      const result = await api.getBoundaryTests();
      setData(result);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { runTests(); }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <SectionHeader title="Boundary Tests" subtitle="Live grading engine boundary verification suite" />
        <button onClick={runTests} disabled={loading}
          className="flex items-center gap-2 bg-brand-600 text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-brand-700 transition disabled:opacity-60">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Running…' : 'Re-run Tests'}
        </button>
      </div>

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 text-center transition-colors">
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wide mb-1">Total</p>
              <p className="text-4xl font-bold text-slate-800 dark:text-slate-100">{data.total}</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 p-5 text-center transition-colors">
              <p className="text-xs text-emerald-500 dark:text-emerald-400 font-medium uppercase tracking-wide mb-1">Passed</p>
              <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-450">{data.passed}</p>
            </div>
            <div className={`rounded-2xl border p-5 text-center transition-colors ${data.failed > 0 ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-700'}`}>
              <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${data.failed > 0 ? 'text-rose-400 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'}`}>Failed</p>
              <p className={`text-4xl font-bold ${data.failed > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-300 dark:text-slate-600'}`}>{data.failed}</p>
            </div>
          </div>

          {/* Overall Status Banner */}
          <div className={`flex items-center gap-3 rounded-2xl px-5 py-4 border transition-colors ${data.status === 'PASS' ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30' : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30'}`}>
            {data.status === 'PASS'
              ? <CheckCircle2 className="h-6 w-6 text-emerald-500 flex-shrink-0" />
              : <XCircle className="h-6 w-6 text-rose-500 flex-shrink-0" />}
            <div>
              <p className={`font-bold text-sm ${data.status === 'PASS' ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                {data.status === 'PASS' ? `All ${data.total} boundary tests passed successfully` : `${data.failed} test(s) failed`}
              </p>
              <p className={`text-xs mt-0.5 ${data.status === 'PASS' ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-450'}`}>
                Engine version: {data.tests?.[0]?.actual !== undefined ? 'EduGrade Deterministic Engine v1.0' : '—'}
              </p>
            </div>
          </div>

          {/* Tests Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.tests?.map((test: any, i: number) => (
              <div key={i} className={`rounded-xl border p-4 flex items-start gap-3 transition-all ${test.status === 'PASS' ? 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700' : 'bg-rose-50 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/30'}`}>
                {test.status === 'PASS'
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  : <XCircle className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-tight">{test.name}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-mono">
                    Expected: <span className="text-slate-600 dark:text-slate-400">{JSON.stringify(test.expected)}</span>
                    &nbsp;→ Actual: <span className={test.status === 'PASS' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>{JSON.stringify(test.actual)}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {loading && <LoadingSpinner />}
    </div>
  );
}

// ─── Audits Page ──────────────────────────────────────────────────────────────
function AuditsPage() {
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getAudits().then(setAudits).catch(() => setAudits([])).finally(() => setLoading(false));
  }, []);

  function formatTimestamp(ts: string) {
    try { return new Date(ts).toLocaleString(); } catch { return ts; }
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Result Vault" subtitle="Timestamped processing audit trail" />
      {loading ? <LoadingSpinner /> : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700">
                {['Timestamp', 'Batch ID', 'Action', 'User', 'Engine', 'Details'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {audits.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400 dark:text-slate-500">No audit logs found.</td></tr>
              )}
              {audits.map((a, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">{formatTimestamp(a.timestamp)}</td>
                  <td className="px-5 py-3.5 text-xs font-mono text-brand-600 dark:text-brand-400">{a.batch_id ?? '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${a.action.includes('SUCCESS') || a.action.includes('SEED') ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'}`}>
                      {a.action}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-300">{a.user}</td>
                  <td className="px-5 py-3.5 text-xs font-mono text-slate-400 dark:text-slate-500">v{a.engine_version}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">{a.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Configuration Page ───────────────────────────────────────────────────────
function ConfigurationPage() {
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<any>(null);

  const handleSeedDemo = async () => {
    if (!confirm('This will reset the database and reseed all 62 demo students into SQLite, Firestore & Realtime DB. Continue?')) return;
    setSeeding(true);
    setSeedResult(null);
    try {
      const data = await api.seedDemo();
      // Fetch seeded students and sync to Firestore & Realtime DB
      try {
        const studentRes = await api.getStudents({ page: 1, page_size: 100 });
        if (studentRes && studentRes.students && studentRes.students.length > 0) {
          await saveBatchToFirebase(studentRes.students);
        }
      } catch (fbErr) {
        console.warn('Firebase sync warning:', fbErr);
      }
      setSeedResult(data);
    } catch (e: any) {
      setSeedResult({ error: e?.message ?? 'Unknown error' });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <SectionHeader title="Configuration" subtitle="Engine settings and data management" />

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 flex flex-col gap-4 transition-colors">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-violet-50 dark:bg-violet-950/30 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
            <Zap className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-800 dark:text-slate-200">Seed Demo Data</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              Resets the database and seeds it with 12 edge-case students and 50 normal students (62 total). This action is idempotent and safe to repeat.
            </p>
          </div>
        </div>
        <button
          onClick={handleSeedDemo}
          disabled={seeding}
          className="flex items-center justify-center gap-2 bg-brand-600 text-white rounded-xl px-5 py-3 text-sm font-semibold hover:bg-brand-700 transition disabled:opacity-60 self-start"
        >
          <RefreshCw className={`h-4 w-4 ${seeding ? 'animate-spin' : ''}`} />
          {seeding ? 'Seeding…' : 'Reset & Seed Demo Database'}
        </button>

        {seedResult && !seedResult.error && (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl p-4 text-sm text-emerald-800 dark:text-emerald-400">
            ✅ Seeded successfully: {seedResult.processed} students processed — {seedResult.passed} passed, {seedResult.failed} failed.
          </div>
        )}
        {seedResult?.error && (
          <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-xl p-4 text-sm text-rose-800 dark:text-rose-450">
            ❌ Error: {seedResult.error}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 flex flex-col gap-3 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-50 dark:bg-sky-950/30 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
            <ShieldCheck className="h-5 w-5 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-200">Engine Information</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">Deterministic Grading Engine v1.0</p>
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 font-mono text-xs text-slate-600 dark:text-slate-300 grid grid-cols-2 gap-2 transition-colors">
          <span className="text-slate-400 dark:text-slate-500">Backend URL</span><span>http://localhost:8000</span>
          <span className="text-slate-400 dark:text-slate-500">Engine Version</span><span>1.0</span>
          <span className="text-slate-400 dark:text-slate-500">DB</span><span>SQLite (edugrade.db)</span>
          <span className="text-slate-400 dark:text-slate-500">GPA Precision</span><span>2 decimal places</span>
          <span className="text-slate-400 dark:text-slate-500">Subjects</span><span>BAN, ENG, MAT, PHY, CHE, BIO + optional</span>
          <span className="text-slate-400 dark:text-slate-500">GPA Cap</span><span>5.00</span>
        </div>
      </div>
    </div>
  );
}

// ─── Classes / Subjects / Placeholder Pages ───────────────────────────────────
export function PlaceholderPage({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-[calc(100vh-12rem)]">
      <div className="text-6xl mb-4 opacity-50">{icon}</div>
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">{title}</h2>
      <p className="text-slate-500 dark:text-slate-400 mt-2">This module is under construction.</p>
    </div>
  );
}

// ─── Authenticated Dashboard Shell ───────────────────────────────────────────
function Dashboard({ onSwitchToStudentPortal }: { onSwitchToStudentPortal?: () => void }) {
  const [activeTab, setActiveTab] = useState('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setAnalyticsLoading(true);
    api.getAnalytics().then(setAnalytics).catch(() => {}).finally(() => setAnalyticsLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard' || activeTab === 'students') {
      api.getAnalytics().then(setAnalytics).catch(() => {});
    }
  }, [activeTab]);

  function renderPage() {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage analytics={analytics} analyticsLoading={analyticsLoading} onNavigate={setActiveTab} />;
      case 'students':
        return <StudentsPage analytics={analytics} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />;
      case 'boundary_tests':
        return <BoundaryTestsPage />;
      case 'audits':
        return <AuditsPage />;
      case 'configuration':
        return <ConfigurationPage />;
      case 'classes':
        return <ClassesPage />;
      case 'subjects':
        return <SubjectsPage />;
      default:
        return <StudentsPage analytics={analytics} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />;
    }
  }

  return (
    <div className="flex h-screen bg-[#faf8f5] dark:bg-zinc-950 text-neutral-800 dark:text-neutral-100 overflow-hidden font-sans transition-colors">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={logout} onSwitchRole={onSwitchToStudentPortal} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Registrar's Sheet Top Header Banner */}
        <div 
          className="bg-[#0c0c0b] relative overflow-hidden px-8 py-6 text-white border-b-2 border-amber-500/20 select-none flex-shrink-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(217, 119, 6, 0.12) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(217, 119, 6, 0.12) 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px'
          }}
        >
          <div className="flex justify-between items-end">
            <div>
              <div className="text-[10px] font-mono text-amber-500/80 tracking-widest uppercase mb-2">
                RESULT PROCESSING & GPA ENGINE
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight uppercase font-sans text-neutral-100">
                GRADE FORGE
              </h1>
            </div>
            <div className="text-right font-mono flex flex-col items-end gap-2">
              {onSwitchToStudentPortal && (
                <button
                  onClick={onSwitchToStudentPortal}
                  className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs font-mono uppercase transition shadow-sm flex items-center gap-1.5"
                >
                  🎓 Student Portal
                </button>
              )}
              <span className="text-xs font-bold text-yellow-500 tracking-widest uppercase">DISPLAY LAYER</span>
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto px-8 py-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

// ─── Root App with Firebase Auth & Role Guard ───────────────────────────────
export default function App() {
  const { user, loading } = useAuth();
  const [role, setRole] = useState<'teacher' | 'student'>(() => {
    return (localStorage.getItem('gf_role') as 'teacher' | 'student') || 'teacher';
  });

  const handleLogin = (selectedRole: 'teacher' | 'student') => {
    setRole(selectedRole);
    localStorage.setItem('gf_role', selectedRole);
  };

  const handleLogout = () => {
    logout();
  };

  // Show full-screen spinner while Firebase resolves auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium font-mono">Loading GradeForge…</p>
        </div>
      </div>
    );
  }

  // Not signed in → show Role-based Login Page
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Signed in as Student → show Student Result Portal
  if (role === 'student') {
    return <StudentPortal userEmail={user.email} onLogout={handleLogout} onSwitchToTeacherPortal={() => handleLogin('teacher')} />;
  }

  // Signed in as Teacher / Admin → show Full Command Centre Dashboard
  return <Dashboard onSwitchToStudentPortal={() => handleLogin('student')} />;
}
