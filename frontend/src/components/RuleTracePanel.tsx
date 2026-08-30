import React from 'react';
import { Shield, AlertTriangle, Zap } from 'lucide-react';
import type { Student } from '../types';

interface TraceStep {
  step: string;
  rule_code?: string;
  calculation: string;
  explanation: string;
  output: Record<string, unknown>;
}

interface TraceData {
  student_id: string;
  student_name: string;
  class_name: string;
  engine: { name: string; version: string };
  pipeline: string[];
  steps: TraceStep[];
}

interface RuleTracePanelProps {
  student: Student | null;
  trace: TraceData | null;
  loading: boolean;
}

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
}

const STATUS_STYLES: Record<string, { pill: string; label: string }> = {
  PASS:    { pill: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800', label: 'PASS' },
  FAIL:    { pill: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-300 dark:border-rose-800', label: 'FAIL' },
  ABSENT:  { pill: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-300 dark:border-amber-800', label: 'ABSENT' },
  PRACTICAL_FAIL: { pill: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-300 dark:border-orange-800', label: 'PRAC FAIL' },
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES['FAIL'];
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${s.pill}`}>
      {s.label}
    </span>
  );
}

export const RuleTracePanel: React.FC<RuleTracePanelProps> = ({ student, trace, loading }) => {
  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-zinc-400 dark:text-zinc-600 text-sm gap-3 font-mono">
        <Shield className="h-10 w-10 text-zinc-200 dark:text-zinc-800" />
        <span className="uppercase text-xs tracking-wider">Select a student to view grading trace</span>
      </div>
    );
  }

  const summary = student.result_summary;
  const overrideStep = trace?.steps?.find(s => s.step === 'FINAL_GPA');
  const ruleCode = summary?.override_code ?? overrideStep?.rule_code ?? null;
  const hasOverride = summary?.override_applied;
  const reason = summary?.override_reason ?? overrideStep?.explanation ?? '';

  return (
    <div className="flex flex-col gap-4 font-mono">
      {/* Header card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
          <Shield className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">GRADING TRACE</span>
          {ruleCode && (
            <span className="ml-auto text-[9px] px-2 py-0.5 rounded border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider">
              {ruleCode.replace(/_/g, ' ')}
            </span>
          )}
        </div>

        {/* Student Identity */}
        <div className="px-4 py-3 flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="w-10 h-10 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-sm font-black flex-shrink-0 select-none">
            {initials(student.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm text-neutral-900 dark:text-neutral-100 font-sans truncate">{student.name}</div>
            <div className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-mono">
              {student.student_id} · {student.class_name}
              {student.optional_subject && ` · OPT: ${student.optional_subject}`}
            </div>
          </div>
        </div>

        {/* GPA Summary Row */}
        {summary && (
          <div className="grid grid-cols-3 divide-x divide-zinc-100 dark:divide-zinc-800">
            <div className="px-4 py-3 text-center">
              <p className="text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">WOULD-BE GPA</p>
              <p className="text-xl font-black text-zinc-500 dark:text-zinc-400">{summary.uncancelled_gpa.toFixed(2)}</p>
              <p className="text-[9px] text-zinc-400 uppercase mt-0.5">UNCANCELLED</p>
            </div>
            <div className={`px-4 py-3 text-center ${summary.final_gpa === 0 ? 'bg-rose-50/50 dark:bg-rose-950/20' : 'bg-emerald-50/50 dark:bg-emerald-950/20'}`}>
              <p className="text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">FINAL GPA</p>
              <p className={`text-xl font-black ${summary.final_gpa === 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {summary.final_gpa.toFixed(2)}
              </p>
              <p className="text-[9px] text-zinc-400 uppercase mt-0.5">OFFICIAL</p>
            </div>
            <div className="px-4 py-3 text-center">
              <p className="text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">LETTER GRADE</p>
              <p className={`text-xl font-black ${summary.final_gpa === 0 ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-900 dark:text-neutral-100'}`}>
                {summary.final_grade}
              </p>
              <p className="text-[9px] text-zinc-400 uppercase mt-0.5">FINAL</p>
            </div>
          </div>
        )}
      </div>

      {/* Override Alert */}
      {hasOverride && reason && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800/60 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
            SYSTEM ADJUSTMENT · {ruleCode?.replace(/_/g, ' ')}
          </div>
          <p className="text-[10px] text-amber-800 dark:text-amber-300 leading-relaxed font-sans">{reason}</p>
        </div>
      )}

      {/* Subject Trace Table */}
      {student.subjects && student.subjects.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">SUBJECT BREAKDOWN</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/30 text-zinc-400 dark:text-zinc-500 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-3 py-2 text-left font-bold">SUBJECT</th>
                  <th className="px-3 py-2 text-center font-bold">MARK USED</th>
                  <th className="px-3 py-2 text-center font-bold">GP</th>
                  <th className="px-3 py-2 text-center font-bold">STATUS</th>
                  <th className="px-3 py-2 text-left font-bold">RULE APPLIED</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                {student.subjects.map((subj, idx) => {
                  // Format mark display: show theory/practical breakdown if available
                  let markDisplay = '—';
                  if (subj.mark !== undefined && subj.mark !== null) {
                    if (subj.theory_mark !== undefined && subj.practical_mark !== undefined) {
                      markDisplay = `${subj.theory_mark}+${subj.practical_mark} = ${subj.mark}`;
                    } else {
                      markDisplay = String(subj.mark);
                    }
                  } else if (subj.status === 'ABSENT') {
                    markDisplay = 'AB';
                  }

                  const isCompulsory = subj.subject_type !== 'OPTIONAL';
                  const statusKey = subj.status ?? (subj.gp > 0 ? 'PASS' : 'FAIL');

                  return (
                    <tr key={idx} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/20 transition-colors">
                      <td className="px-3 py-2.5 font-bold text-neutral-800 dark:text-neutral-200">
                        <div className="flex items-center gap-1.5">
                          <span>{subj.subject_name ?? subj.subject_code}</span>
                          {!isCompulsory && (
                            <span className="text-[8px] border border-zinc-300 dark:border-zinc-700 px-1 rounded text-zinc-400 uppercase">OPT</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono font-bold text-zinc-600 dark:text-zinc-400">
                        {markDisplay}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono font-bold">
                        <span className={subj.gp === 0 ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                          {subj.gp?.toFixed(1) ?? '—'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <StatusPill status={statusKey} />
                      </td>
                      <td className="px-3 py-2.5 text-zinc-500 dark:text-zinc-400 text-[9px] uppercase tracking-wide max-w-[140px]">
                        {subj.rule_applied ?? (subj.status === 'ABSENT' ? 'ABSENCE POLICY' : subj.gp === 0 ? 'BELOW THRESHOLD' : 'STANDARD SCALE')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Calculation Pipeline Steps */}
      {loading && (
        <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 text-xs py-4 justify-center font-mono">
          <Zap className="h-4 w-4 animate-pulse text-amber-500" />
          LOADING TRACE...
        </div>
      )}

      {trace && !loading && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 font-mono">OFFICIAL CALCULATION STEPS</span>
            <span className="text-[9px] font-mono text-zinc-400">8 STEPS</span>
          </div>
          <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800 max-h-80 overflow-y-auto font-sans">
            {trace.steps.map((step: any, idx) => {
              const stepNum = step.step_number || idx + 1;
              return (
                <div key={idx} className="px-4 py-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors flex flex-col gap-1.5">
                  <div className="flex items-center justify-between font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
                        STEP {stepNum < 10 ? `0${stepNum}` : stepNum}
                      </span>
                      <span className="text-[10px] font-bold text-neutral-800 dark:text-neutral-200">
                        {step.rule_name || step.step.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {step.rule_code && (
                      <span className="text-[8px] bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded font-mono uppercase">
                        {step.rule_code}
                      </span>
                    )}
                  </div>
                  {step.calculation && step.calculation !== 'Identity transformation' && (
                    <p className="text-[9px] font-mono text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1">
                      {step.calculation}
                    </p>
                  )}
                  <p className="text-[9px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-sans">{step.explanation}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
