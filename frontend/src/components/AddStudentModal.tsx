import React, { useState } from 'react';
import { X, UserPlus, AlertCircle } from 'lucide-react';
import { api } from '../api';
import { saveStudentToFirebase } from '../firebase';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [className, setClassName] = useState('Grade 9-A');
  const [optionalSubject, setOptionalSubject] = useState('HMT');

  // Core Compulsory Subjects Marks (Non-practical)
  const [banTotal, setBanTotal] = useState<number | ''>(75);
  const [engTotal, setEngTotal] = useState<number | ''>(75);
  const [matTotal, setMatTotal] = useState<number | ''>(80);

  // Practical Compulsory Subjects Marks (Theory / Practical split)
  const [phyTheory, setPhyTheory] = useState<number | ''>(55);
  const [phyPractical, setPhyPractical] = useState<number | ''>(18);
  const [cheTheory, setCheTheory] = useState<number | ''>(50);
  const [chePractical, setChePractical] = useState<number | ''>(17);
  const [bioTheory, setBioTheory] = useState<number | ''>(55);
  const [bioPractical, setBioPractical] = useState<number | ''>(18);

  // Optional Subject Marks
  const [optTheory, setOptTheory] = useState<number | ''>(55);
  const [optPractical, setOptPractical] = useState<number | ''>(20);
  const [optTotal, setOptTotal] = useState<number | ''>(75);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim() || !name.trim() || !className.trim()) {
      setErrorMsg('Student ID, Name, and Class Name are required.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    // Build marks dictionary including all compulsory subjects: BAN, ENG, MAT, PHY, CHE, BIO
    const marks: Record<string, any> = {
      BAN: { total_mark: Number(banTotal) || 0 },
      ENG: { total_mark: Number(engTotal) || 0 },
      MAT: { total_mark: Number(matTotal) || 0 },
      PHY: { theory_mark: Number(phyTheory) || 0, practical_mark: Number(phyPractical) || 0 },
      CHE: { theory_mark: Number(cheTheory) || 0, practical_mark: Number(chePractical) || 0 },
      BIO: { theory_mark: Number(bioTheory) || 0, practical_mark: Number(bioPractical) || 0 }
    };

    // Format optional subject according to practical rules (HMT & AGR are practical, REL is non-practical)
    if (optionalSubject === 'REL') {
      marks['REL'] = { total_mark: Number(optTotal) || 0 };
    } else if (optionalSubject === 'HMT') {
      const th = optTheory !== '' ? Number(optTheory) : Math.round((Number(optTotal) || 75) * 0.75);
      const pr = optPractical !== '' ? Number(optPractical) : Math.round((Number(optTotal) || 75) * 0.25);
      marks['HMT'] = { theory_mark: th, practical_mark: pr };
    } else if (optionalSubject === 'AGR') {
      const th = optTheory !== '' ? Number(optTheory) : Math.round((Number(optTotal) || 75) * 0.75);
      const pr = optPractical !== '' ? Number(optPractical) : Math.round((Number(optTotal) || 75) * 0.25);
      marks['AGR'] = { theory_mark: th, practical_mark: pr };
    }

    try {
      const payload = {
        class_name: className.trim(),
        students: [
          {
            student_id: studentId.trim(),
            name: name.trim(),
            class_name: className.trim(),
            optional_subject: optionalSubject,
            marks
          }
        ]
      };

      const res = await api.processBatch(payload);
      if (res.errors && res.errors.length > 0) {
        setErrorMsg(res.errors.map((err: any) => `${err.field}: ${err.message}`).join(', '));
      } else {
        await saveStudentToFirebase(payload.students[0]);
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail?.error?.message || 'Failed to add student record.';
      setErrorMsg(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-mono">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
          <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
            <UserPlus className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Add Student Record</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-black dark:hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex flex-col gap-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 flex items-start gap-2 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Basic Student Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">
                Student ID *
              </label>
              <input
                type="text"
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                placeholder="e.g. STU-101 or EDGE-01"
                required
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">
                Student Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Full Name"
                required
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-sans text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">
                Class Name * (Can be any class)
              </label>
              <input
                type="text"
                value={className}
                onChange={e => setClassName(e.target.value)}
                placeholder="e.g. Grade 6-A, 9-A, Class 10"
                required
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">
                Optional Subject
              </label>
              <select
                value={optionalSubject}
                onChange={e => setOptionalSubject(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="HMT">Higher Math (HMT)</option>
                <option value="AGR">Agriculture (AGR)</option>
                <option value="REL">Religion (REL)</option>
              </select>
            </div>
          </div>

          {/* Core Subject Marks */}
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-2">
              Compulsory Non-Practical Subjects
            </span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[9px] text-zinc-400">BANGLA (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={banTotal}
                  onChange={e => setBanTotal(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[9px] text-zinc-400">ENGLISH (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={engTotal}
                  onChange={e => setEngTotal(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[9px] text-zinc-400">MATH (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={matTotal}
                  onChange={e => setMatTotal(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Science / Practical Compulsory Subject Marks */}
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-2">
              Compulsory Practical Subjects (PHY, CHE, BIO)
            </span>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase text-zinc-600 dark:text-zinc-300">Physics (PHY)</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="block text-[9px] text-zinc-400">TH (0-75)</label>
                    <input
                      type="number"
                      min="0"
                      max="75"
                      value={phyTheory}
                      onChange={e => setPhyTheory(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-zinc-400">PR (0-25)</label>
                    <input
                      type="number"
                      min="0"
                      max="25"
                      value={phyPractical}
                      onChange={e => setPhyPractical(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase text-zinc-600 dark:text-zinc-300">Chemistry (CHE)</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="block text-[9px] text-zinc-400">TH (0-75)</label>
                    <input
                      type="number"
                      min="0"
                      max="75"
                      value={cheTheory}
                      onChange={e => setCheTheory(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-zinc-400">PR (0-25)</label>
                    <input
                      type="number"
                      min="0"
                      max="25"
                      value={chePractical}
                      onChange={e => setChePractical(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase text-zinc-600 dark:text-zinc-300">Biology (BIO)</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="block text-[9px] text-zinc-400">TH (0-75)</label>
                    <input
                      type="number"
                      min="0"
                      max="75"
                      value={bioTheory}
                      onChange={e => setBioTheory(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-zinc-400">PR (0-25)</label>
                    <input
                      type="number"
                      min="0"
                      max="25"
                      value={bioPractical}
                      onChange={e => setBioPractical(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Optional Subject Input */}
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-2">
              Optional Subject Marks ({optionalSubject})
            </span>
            {optionalSubject === 'REL' ? (
              <div>
                <label className="block text-[9px] text-zinc-400 font-bold uppercase">Religion Total Mark (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={optTotal}
                  onChange={e => setOptTotal(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] text-zinc-400 font-bold uppercase">Theory (0-75)</label>
                  <input
                    type="number"
                    min="0"
                    max="75"
                    value={optTheory}
                    onChange={e => setOptTheory(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-zinc-400 font-bold uppercase">Practical (0-25)</label>
                  <input
                    type="number"
                    min="0"
                    max="25"
                    value={optPractical}
                    onChange={e => setOptPractical(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 uppercase"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black border border-amber-600 uppercase transition font-mono"
            >
              {loading ? 'Processing...' : 'Save & Calculate GPA'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
