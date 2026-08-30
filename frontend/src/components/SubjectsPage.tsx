import React, { useState } from 'react';
import {
  BookOpen, Plus, Search, MoreVertical, Edit2, Trash2,
  CheckCircle2, XCircle, ChevronDown, X, Download
} from 'lucide-react';

export interface Subject {
  id: string;
  code: string;
  name: string;
  credit: number;
  department: string;
  semester: string;
  students: number;
  status: 'Active' | 'Inactive';
}

const DEPARTMENTS = ['CSE', 'EEE', 'BBA', 'ENGLISH', 'MATHEMATICS', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY'];
const SEMESTERS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', 'Final'];

const DEFAULT_SUBJECTS: Subject[] = [
  // Compulsory subjects — all 62 students enrolled
  { id: '1', code: 'BAN', name: 'Bangla Language & Literature', credit: 3.0, department: 'ENGLISH', semester: '1st', students: 62, status: 'Active' },
  { id: '2', code: 'ENG', name: 'English Language & Literature', credit: 3.0, department: 'ENGLISH', semester: '1st', students: 62, status: 'Active' },
  { id: '3', code: 'MAT', name: 'General Mathematics', credit: 3.0, department: 'MATHEMATICS', semester: '1st', students: 62, status: 'Active' },
  { id: '4', code: 'PHY', name: 'Physics (Theory & Lab)', credit: 3.0, department: 'PHYSICS', semester: '1st', students: 62, status: 'Active' },
  { id: '5', code: 'CHE', name: 'Chemistry (Theory & Lab)', credit: 3.0, department: 'CHEMISTRY', semester: '1st', students: 62, status: 'Active' },
  { id: '6', code: 'BIO', name: 'Biology (Theory & Lab)', credit: 3.0, department: 'BIOLOGY', semester: '1st', students: 62, status: 'Active' },
  // Optional subjects — student counts from demo dataset
  { id: '7', code: 'HMT', name: 'Higher Mathematics (Optional)', credit: 3.0, department: 'MATHEMATICS', semester: '2nd', students: 35, status: 'Active' },
  { id: '8', code: 'AGR', name: 'Agriculture Studies (Optional)', credit: 3.0, department: 'BIOLOGY', semester: '2nd', students: 14, status: 'Active' },
  { id: '9', code: 'REL', name: 'Religion & Moral Studies (Optional)', credit: 2.0, department: 'ENGLISH', semester: '2nd', students: 13, status: 'Active' },
];

interface SubjectFormData {
  code: string;
  name: string;
  credit: string;
  department: string;
  semester: string;
  students: string;
  status: 'Active' | 'Inactive';
}

const EMPTY_FORM: SubjectFormData = {
  code: '', name: '', credit: '3.0', department: 'CSE', semester: '1st', students: '0', status: 'Active'
};

export const SubjectsPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>(DEFAULT_SUBJECTS);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('ALL');
  const [filterSemester, setFilterSemester] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editSubject, setEditSubject] = useState<Subject | null>(null);
  const [form, setForm] = useState<SubjectFormData>(EMPTY_FORM);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filtered = subjects.filter(s => {
    const matchSearch = s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase());
    const matchDept = filterDept === 'ALL' || s.department === filterDept;
    const matchSem = filterSemester === 'ALL' || s.semester === filterSemester;
    const matchStatus = filterStatus === 'ALL' || s.status === filterStatus;
    return matchSearch && matchDept && matchSem && matchStatus;
  });

  const openAdd = () => {
    setEditSubject(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (sub: Subject) => {
    setEditSubject(sub);
    setForm({
      code: sub.code,
      name: sub.name,
      credit: String(sub.credit),
      department: sub.department,
      semester: sub.semester,
      students: String(sub.students),
      status: sub.status
    });
    setShowModal(true);
    setOpenMenuId(null);
  };

  const handleSave = () => {
    if (!form.code.trim() || !form.name.trim()) return;
    if (editSubject) {
      setSubjects(prev => prev.map(s => s.id === editSubject.id ? {
        ...s,
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        credit: parseFloat(form.credit) || 3.0,
        department: form.department,
        semester: form.semester,
        students: parseInt(form.students) || 0,
        status: form.status
      } : s));
    } else {
      const newSub: Subject = {
        id: Date.now().toString(),
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        credit: parseFloat(form.credit) || 3.0,
        department: form.department,
        semester: form.semester,
        students: parseInt(form.students) || 0,
        status: form.status
      };
      setSubjects(prev => [...prev, newSub]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
    setDeleteConfirmId(null);
    setOpenMenuId(null);
  };

  const toggleStatus = (id: string) => {
    setSubjects(prev => prev.map(s =>
      s.id === id ? { ...s, status: s.status === 'Active' ? 'Inactive' : 'Active' } : s
    ));
    setOpenMenuId(null);
  };

  const exportSubjectsCSV = () => {
    const headers = ['Code,Subject Name,Credit,Department,Semester,Students,Status'];
    const rows = filtered.map(s =>
      `"${s.code}","${s.name}",${s.credit},"${s.department}","${s.semester}",${s.students},"${s.status}"`
    );
    const blob = new Blob([[...headers, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subjects_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-5 font-mono">

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5 font-mono">ACADEMIC MANAGEMENT</p>
          <h2 className="text-2xl font-black uppercase tracking-tight text-neutral-900 dark:text-neutral-100 font-sans">Subjects</h2>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 uppercase tracking-wide">
            {subjects.length} subjects enrolled · {subjects.filter(s => s.status === 'Active').length} active
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportSubjectsCSV}
            className="flex items-center gap-2 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-xs font-bold uppercase hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
          >
            <Download className="h-4 w-4" /> Export
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black border border-amber-600 rounded-xl px-4 py-2 text-xs font-black uppercase transition"
          >
            <Plus className="h-4 w-4" /> Add Subject
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: 'TOTAL SUBJECTS', value: subjects.length, sub: 'IN CURRICULUM' },
          { label: 'ACTIVE SUBJECTS', value: subjects.filter(s => s.status === 'Active').length, sub: 'CURRENTLY OFFERED' },
          { label: 'DEPARTMENTS', value: new Set(subjects.map(s => s.department)).size, sub: 'ACROSS CAMPUS' },
          { label: 'AVG CREDIT', value: (subjects.reduce((a, s) => a + s.credit, 0) / (subjects.length || 1)).toFixed(1), sub: 'CREDIT HOURS' },
        ].map(card => (
          <div key={card.label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 shadow-sm">
            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">{card.label}</p>
            <p className="text-2xl font-black text-neutral-900 dark:text-neutral-100 font-sans">{card.value}</p>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Table Card (Styled matching exact dark design in image) */}
      <div className="bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-sm overflow-hidden">

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800/80">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by code or subject name..."
              className="w-full pl-8 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
            />
          </div>

          {/* Department Filter */}
          <div className="relative">
            <select
              value={filterDept}
              onChange={e => setFilterDept(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
            >
              <option value="ALL">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400 pointer-events-none" />
          </div>

          {/* Semester Filter */}
          <div className="relative">
            <select
              value={filterSemester}
              onChange={e => setFilterSemester(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
            >
              <option value="ALL">All Semesters</option>
              {SEMESTERS.map(s => <option key={s} value={s}>{s} Semester</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
            >
              <option value="ALL">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400 pointer-events-none" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-zinc-50 dark:bg-[#0c0c0e] border-b border-zinc-100 dark:border-zinc-800/80">
                <th className="px-6 py-4 text-left font-bold text-zinc-600 dark:text-zinc-200 uppercase tracking-wider font-mono">Code</th>
                <th className="px-6 py-4 text-left font-bold text-zinc-600 dark:text-zinc-200 uppercase tracking-wider font-mono">Subject Name</th>
                <th className="px-6 py-4 text-right font-bold text-zinc-600 dark:text-zinc-200 uppercase tracking-wider font-mono">Credit</th>
                <th className="px-6 py-4 text-left font-bold text-zinc-600 dark:text-zinc-200 uppercase tracking-wider font-mono">Department</th>
                <th className="px-6 py-4 text-center font-bold text-zinc-600 dark:text-zinc-200 uppercase tracking-wider font-mono">Semester</th>
                <th className="px-6 py-4 text-right font-bold text-zinc-600 dark:text-zinc-200 uppercase tracking-wider font-mono">Students</th>
                <th className="px-6 py-4 text-left font-bold text-zinc-600 dark:text-zinc-200 uppercase tracking-wider font-mono">Status</th>
                <th className="px-6 py-4 text-right font-bold text-zinc-600 dark:text-zinc-200 uppercase tracking-wider font-mono">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-zinc-400 dark:text-zinc-600">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs uppercase tracking-wide">No subjects found matching filter criteria</p>
                  </td>
                </tr>
              ) : filtered.map(sub => (
                <tr key={sub.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors">
                  {/* Code */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100 font-mono tracking-wide">{sub.code}</span>
                  </td>

                  {/* Subject Name */}
                  <td className="px-6 py-4">
                    <span className="font-normal text-neutral-800 dark:text-neutral-200 font-sans leading-relaxed">{sub.name}</span>
                  </td>

                  {/* Credit */}
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <span className="font-normal text-neutral-800 dark:text-neutral-300 font-mono">{sub.credit.toFixed(1)}</span>
                  </td>

                  {/* Department */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-normal text-neutral-800 dark:text-neutral-300 font-mono uppercase">{sub.department}</span>
                  </td>

                  {/* Semester */}
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <span className="text-neutral-800 dark:text-neutral-300 font-mono">{sub.semester}</span>
                  </td>

                  {/* Students */}
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <span className="font-normal text-neutral-800 dark:text-neutral-300 font-mono">{sub.students}</span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {sub.status === 'Active' ? (
                      <span className="text-neutral-800 dark:text-neutral-200 font-mono">Active</span>
                    ) : (
                      <span className="text-zinc-400 dark:text-zinc-500 font-mono">Inactive</span>
                    )}
                  </td>

                  {/* Actions Menu */}
                  <td className="px-6 py-4 text-right whitespace-nowrap relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === sub.id ? null : sub.id)}
                      className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition inline-flex items-center justify-center"
                      title="Actions"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {openMenuId === sub.id && (
                      <div className="absolute right-6 top-10 z-30 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl py-1 min-w-[150px] text-left">
                        <button
                          onClick={() => openEdit(sub)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition uppercase"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-amber-500" /> Edit Subject
                        </button>
                        <button
                          onClick={() => toggleStatus(sub.id)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition uppercase"
                        >
                          {sub.status === 'Active'
                            ? <><XCircle className="h-3.5 w-3.5 text-zinc-400" /> Deactivate</>
                            : <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Activate</>
                          }
                        </button>
                        <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
                        <button
                          onClick={() => { setDeleteConfirmId(sub.id); setOpenMenuId(null); }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition uppercase"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-100 dark:border-zinc-800/80 text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex justify-between items-center">
          <span>Showing {filtered.length} of {subjects.length} subjects</span>
          <span>CURRICULUM v1.0</span>
        </div>
      </div>

      {/* Click outside to close menu */}
      {openMenuId && (
        <div className="fixed inset-0 z-20" onClick={() => setOpenMenuId(null)} />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl p-6 max-w-sm w-full font-mono">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-rose-100 dark:bg-rose-950/40 rounded-xl">
                <Trash2 className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <h3 className="font-black text-sm text-neutral-900 dark:text-neutral-100 uppercase">Delete Subject</h3>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wide">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-sans mb-5 leading-relaxed">
              Are you sure you want to delete <strong className="text-neutral-900 dark:text-neutral-100">
                {subjects.find(s => s.id === deleteConfirmId)?.code}
              </strong>? This subject will be permanently removed from curriculum.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition uppercase"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold uppercase transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl w-full max-w-md font-mono overflow-y-auto max-h-[90vh]">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-xl">
                  <BookOpen className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-neutral-900 dark:text-neutral-100 uppercase">
                    {editSubject ? 'Edit Subject' : 'Add New Subject'}
                  </h3>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wide">
                    {editSubject ? `Editing ${editSubject.code}` : 'Fill in subject details'}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 flex flex-col gap-4">
              {/* Code */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Subject Code *</label>
                <input
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. CSE 1101"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>

              {/* Name */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Subject Name *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Programming Fundamentals"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans"
                />
              </div>

              {/* Credit & Semester row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Credit Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="6"
                    value={form.credit}
                    onChange={e => setForm(f => ({ ...f, credit: e.target.value }))}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Semester</label>
                  <div className="relative">
                    <select
                      value={form.semester}
                      onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}
                      className="w-full appearance-none pl-3 pr-7 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                    >
                      {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Department */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Department</label>
                <div className="relative">
                  <select
                    value={form.department}
                    onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                    className="w-full appearance-none pl-3 pr-7 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  >
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400 pointer-events-none" />
                </div>
              </div>

              {/* Students & Status row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Enrolled Students</label>
                  <input
                    type="number"
                    min="0"
                    value={form.students}
                    onChange={e => setForm(f => ({ ...f, students: e.target.value }))}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Status</label>
                  <div className="relative">
                    <select
                      value={form.status}
                      onChange={e => setForm(f => ({ ...f, status: e.target.value as 'Active' | 'Inactive' }))}
                      className="w-full appearance-none pl-3 pr-7 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-2 px-6 pb-5">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition uppercase"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!form.code.trim() || !form.name.trim()}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase transition disabled:opacity-40"
              >
                {editSubject ? 'Save Changes' : 'Add Subject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
