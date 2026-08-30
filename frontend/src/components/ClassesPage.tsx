import React, { useState } from 'react';
import {
  Layers, Plus, MoreVertical, Edit2, Trash2,
  CheckCircle2, XCircle, ChevronDown, X, Download, Copy, Users, BookOpen
} from 'lucide-react';

export interface ClassItem {
  id: string;
  name: string;        // e.g. "Grade 6-A"
  grade: string;       // e.g. "Grade 6"
  section: string;     // e.g. "A"
  teacher: string;     // e.g. "Mr. Rahman"
  students: number;    // e.g. 32
  subjects: number;    // e.g. 8
  roomNo?: string;     // e.g. "Room 301"
  status: 'ACTIVE' | 'INACTIVE';
}

const GRADES = ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const SECTIONS = ['A', 'B', 'C', 'D'];

const DEFAULT_CLASSES: ClassItem[] = [
  { id: '1', name: 'Grade 6-A', grade: 'Grade 6', section: 'A', teacher: 'Mr. Rahman', students: 32, subjects: 8, roomNo: 'Room 101', status: 'ACTIVE' },
  { id: '2', name: 'Grade 6-B', grade: 'Grade 6', section: 'B', teacher: 'Ms. Sultana', students: 30, subjects: 8, roomNo: 'Room 102', status: 'ACTIVE' },
  { id: '3', name: 'Grade 7-A', grade: 'Grade 7', section: 'A', teacher: 'Mr. Ahmed', students: 35, subjects: 9, roomNo: 'Room 201', status: 'ACTIVE' },
  { id: '4', name: 'Grade 8-A', grade: 'Grade 8', section: 'A', teacher: 'Ms. Karim', students: 31, subjects: 9, roomNo: 'Room 301', status: 'ACTIVE' },
  { id: '5', name: 'Grade 9-A', grade: 'Grade 9', section: 'A', teacher: 'Dr. Hossain', students: 28, subjects: 10, roomNo: 'Room 401', status: 'ACTIVE' },
  { id: '6', name: 'Grade 9-B', grade: 'Grade 9', section: 'B', teacher: 'Mrs. Begum', students: 29, subjects: 10, roomNo: 'Room 402', status: 'ACTIVE' },
  { id: '7', name: 'Grade 10-A', grade: 'Grade 10', section: 'A', teacher: 'Mr. Chowdhury', students: 34, subjects: 10, roomNo: 'Room 501', status: 'ACTIVE' },
  { id: '8', name: 'Grade 11-A', grade: 'Grade 11', section: 'A', teacher: 'Prof. Khan', students: 25, subjects: 7, roomNo: 'Lab 1', status: 'INACTIVE' },
];

interface ClassFormData {
  grade: string;
  section: string;
  teacher: string;
  students: string;
  subjects: string;
  roomNo: string;
  status: 'ACTIVE' | 'INACTIVE';
}

const EMPTY_FORM: ClassFormData = {
  grade: 'Grade 6', section: 'A', teacher: '', students: '30', subjects: '8', roomNo: '', status: 'ACTIVE'
};

export const ClassesPage: React.FC = () => {
  const [classList, setClassList] = useState<ClassItem[]>(DEFAULT_CLASSES);
  const [search, setSearch] = useState('');
  const [filterGrade, setFilterGrade] = useState('ALL');
  const [filterSection, setFilterSection] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editClass, setEditClass] = useState<ClassItem | null>(null);
  const [form, setForm] = useState<ClassFormData>(EMPTY_FORM);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [copiedToast, setCopiedToast] = useState(false);

  const filtered = classList.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.teacher.toLowerCase().includes(search.toLowerCase());
    const matchGrade = filterGrade === 'ALL' || c.grade === filterGrade;
    const matchSection = filterSection === 'ALL' || c.section === filterSection;
    const matchStatus = filterStatus === 'ALL' || c.status === filterStatus;
    return matchSearch && matchGrade && matchSection && matchStatus;
  });

  const openAdd = () => {
    setEditClass(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (cls: ClassItem) => {
    setEditClass(cls);
    setForm({
      grade: cls.grade,
      section: cls.section,
      teacher: cls.teacher,
      students: String(cls.students),
      subjects: String(cls.subjects),
      roomNo: cls.roomNo || '',
      status: cls.status
    });
    setShowModal(true);
    setOpenMenuId(null);
  };

  const handleSave = () => {
    if (!form.teacher.trim()) return;
    const className = `${form.grade}-${form.section}`;

    if (editClass) {
      setClassList(prev => prev.map(c => c.id === editClass.id ? {
        ...c,
        name: className,
        grade: form.grade,
        section: form.section,
        teacher: form.teacher.trim(),
        students: parseInt(form.students) || 0,
        subjects: parseInt(form.subjects) || 0,
        roomNo: form.roomNo.trim() || undefined,
        status: form.status
      } : c));
    } else {
      const newClass: ClassItem = {
        id: Date.now().toString(),
        name: className,
        grade: form.grade,
        section: form.section,
        teacher: form.teacher.trim(),
        students: parseInt(form.students) || 0,
        subjects: parseInt(form.subjects) || 0,
        roomNo: form.roomNo.trim() || undefined,
        status: form.status
      };
      setClassList(prev => [...prev, newClass]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    setClassList(prev => prev.filter(c => c.id !== id));
    setDeleteConfirmId(null);
    setOpenMenuId(null);
  };

  const toggleStatus = (id: string) => {
    setClassList(prev => prev.map(c =>
      c.id === id ? { ...c, status: c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : c
    ));
    setOpenMenuId(null);
  };

  const handleCopySummary = () => {
    const summary = filtered.map(c => `${c.name} | Teacher: ${c.teacher} | Students: ${c.students} | Subjects: ${c.subjects} | Status: ${c.status}`).join('\n');
    navigator.clipboard.writeText(summary);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  const exportCSV = () => {
    const headers = ['Class,Class Teacher,Students,Subjects,Status,Room'];
    const rows = filtered.map(c => `"${c.name}","${c.teacher}",${c.students},${c.subjects},"${c.status}","${c.roomNo || ''}"`);
    const blob = new Blob([[...headers, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `classes_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalStudents = classList.reduce((acc, c) => acc + c.students, 0);

  return (
    <div className="flex flex-col gap-5 font-mono">

      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5">ACADEMIC MANAGEMENT</p>
          <h2 className="text-2xl font-black uppercase tracking-tight text-neutral-900 dark:text-neutral-100 font-sans">Classes</h2>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 uppercase tracking-wide">
            {classList.length} active classes · {totalStudents} total enrolled students
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-xs font-bold uppercase hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black border border-amber-600 rounded-xl px-4 py-2 text-xs font-black uppercase transition"
          >
            <Plus className="h-4 w-4" /> Add Class
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { label: 'TOTAL CLASSES', value: classList.length, sub: 'ACROSS ALL GRADES', icon: Layers },
          { label: 'ACTIVE CLASSES', value: classList.filter(c => c.status === 'ACTIVE').length, sub: 'CURRENTLY IN SESSION', icon: CheckCircle2 },
          { label: 'TOTAL STUDENTS', value: totalStudents, sub: 'ENROLLED', icon: Users },
          { label: 'AVG CLASS SIZE', value: (totalStudents / (classList.length || 1)).toFixed(1), sub: 'STUDENTS / CLASS', icon: BookOpen },
        ].map(card => (
          <div key={card.label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 shadow-sm">
            <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">{card.label}</p>
            <p className="text-2xl font-black text-neutral-900 dark:text-neutral-100 font-sans">{card.value}</p>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Main Classes Card (Styled to match the uploaded screenshot image) */}
      <div className="bg-[#1e1e1e] text-white border border-zinc-800 rounded-2xl shadow-xl p-6 font-mono relative overflow-hidden">
        
        {/* Card Header Title and Copy Action */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold tracking-widest text-zinc-200 uppercase font-mono">CLASSES</h3>
          <button
            onClick={handleCopySummary}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            title="Copy class roster summary"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>

        {/* Search & Filter Controls Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="[ Search class... ]"
              className="w-full bg-[#181818] border border-zinc-700/80 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-mono"
            />
          </div>

          {/* Grade Dropdown */}
          <div className="relative">
            <select
              value={filterGrade}
              onChange={e => setFilterGrade(e.target.value)}
              className="appearance-none bg-[#181818] border border-zinc-700/80 rounded-lg pl-3 pr-7 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500 font-mono cursor-pointer"
            >
              <option value="ALL">[ Grade ▾ ]</option>
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500 pointer-events-none" />
          </div>

          {/* Section Dropdown */}
          <div className="relative">
            <select
              value={filterSection}
              onChange={e => setFilterSection(e.target.value)}
              className="appearance-none bg-[#181818] border border-zinc-700/80 rounded-lg pl-3 pr-7 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500 font-mono cursor-pointer"
            >
              <option value="ALL">[ Section ▾ ]</option>
              {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500 pointer-events-none" />
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="appearance-none bg-[#181818] border border-zinc-700/80 rounded-lg pl-3 pr-7 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500 font-mono cursor-pointer"
            >
              <option value="ALL">[ Status ▾ ]</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500 pointer-events-none" />
          </div>
        </div>

        {/* Classes Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono text-left">
            <thead>
              <tr className="border-b border-zinc-700/70 text-zinc-400 tracking-wider uppercase">
                <th className="pb-3 pr-6 font-bold w-1/5">CLASS</th>
                <th className="pb-3 pr-6 font-bold w-1/4">CLASS TEACHER</th>
                <th className="pb-3 pr-6 font-bold text-center w-1/6">STUDENTS</th>
                <th className="pb-3 pr-6 font-bold text-center w-1/6">SUBJECTS</th>
                <th className="pb-3 pr-6 font-bold w-1/6">STATUS</th>
                <th className="pb-3 text-right font-bold w-12">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40 text-zinc-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">
                    No classes found matching criteria.
                  </td>
                </tr>
              ) : filtered.map(cls => (
                <tr key={cls.id} className="hover:bg-zinc-800/40 transition-colors">
                  {/* CLASS */}
                  <td className="py-3.5 pr-6 font-medium text-white whitespace-nowrap">
                    {cls.name}
                  </td>

                  {/* CLASS TEACHER */}
                  <td className="py-3.5 pr-6 text-zinc-300 whitespace-nowrap">
                    {cls.teacher}
                  </td>

                  {/* STUDENTS */}
                  <td className="py-3.5 pr-6 text-center text-zinc-200 whitespace-nowrap">
                    {cls.students}
                  </td>

                  {/* SUBJECTS */}
                  <td className="py-3.5 pr-6 text-center text-zinc-200 whitespace-nowrap">
                    {cls.subjects}
                  </td>

                  {/* STATUS */}
                  <td className="py-3.5 pr-6 whitespace-nowrap">
                    <span className={cls.status === 'ACTIVE' ? 'text-zinc-200 font-bold' : 'text-zinc-500'}>
                      {cls.status}
                    </span>
                  </td>

                  {/* ACTIONS */}
                  <td className="py-3.5 text-right whitespace-nowrap relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === cls.id ? null : cls.id)}
                      className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {openMenuId === cls.id && (
                      <div className="absolute right-0 top-9 z-30 bg-[#252525] border border-zinc-700 rounded-xl shadow-xl py-1 min-w-[140px] text-left">
                        <button
                          onClick={() => openEdit(cls)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-zinc-200 hover:bg-zinc-700 transition uppercase"
                        >
                          <Edit2 className="h-3.5 w-3.5 text-amber-500" /> Edit Class
                        </button>
                        <button
                          onClick={() => toggleStatus(cls.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-zinc-200 hover:bg-zinc-700 transition uppercase"
                        >
                          {cls.status === 'ACTIVE'
                            ? <><XCircle className="h-3.5 w-3.5 text-zinc-400" /> Set Inactive</>
                            : <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Set Active</>
                          }
                        </button>
                        <div className="my-1 border-t border-zinc-700" />
                        <button
                          onClick={() => { setDeleteConfirmId(cls.id); setOpenMenuId(null); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-950/40 transition uppercase"
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
      </div>

      {/* Copy notification toast */}
      {copiedToast && (
        <div className="fixed bottom-6 right-6 bg-zinc-800 text-white px-4 py-2 rounded-xl border border-zinc-700 text-xs font-mono shadow-2xl z-50 flex items-center gap-2 animate-bounce">
          ✓ Copied summary to clipboard!
        </div>
      )}

      {/* Click outside to close dropdown menu */}
      {openMenuId && (
        <div className="fixed inset-0 z-20" onClick={() => setOpenMenuId(null)} />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#1e1e1e] border border-zinc-700 rounded-2xl shadow-2xl p-6 max-w-sm w-full font-mono text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-rose-950/50 rounded-xl">
                <Trash2 className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase">Delete Class</h3>
                <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Action cannot be undone</p>
              </div>
            </div>
            <p className="text-xs text-zinc-300 font-sans mb-5 leading-relaxed">
              Are you sure you want to delete <strong className="text-white">
                {classList.find(c => c.id === deleteConfirmId)?.name}
              </strong>?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-xs font-bold text-zinc-300 hover:bg-zinc-800 transition uppercase"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Class Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#1e1e1e] border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-md font-mono text-white overflow-y-auto max-h-[90vh]">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-xl">
                  <Layers className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase">
                    {editClass ? 'Edit Class' : 'Add New Class'}
                  </h3>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-wide">
                    {editClass ? `Editing ${editClass.name}` : 'Enter class details'}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 flex flex-col gap-4">
              {/* Grade & Section */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Grade *</label>
                  <div className="relative">
                    <select
                      value={form.grade}
                      onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}
                      className="w-full appearance-none bg-[#141414] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    >
                      {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400 pointer-events-none" />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Section *</label>
                  <div className="relative">
                    <select
                      value={form.section}
                      onChange={e => setForm(f => ({ ...f, section: e.target.value }))}
                      className="w-full appearance-none bg-[#141414] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    >
                      {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Class Teacher */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Class Teacher *</label>
                <input
                  value={form.teacher}
                  onChange={e => setForm(f => ({ ...f, teacher: e.target.value }))}
                  placeholder="e.g. Mr. Rahman"
                  className="w-full bg-[#141414] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              {/* Students & Subjects */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Students Count</label>
                  <input
                    type="number"
                    min="0"
                    value={form.students}
                    onChange={e => setForm(f => ({ ...f, students: e.target.value }))}
                    className="w-full bg-[#141414] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Subjects Count</label>
                  <input
                    type="number"
                    min="0"
                    value={form.subjects}
                    onChange={e => setForm(f => ({ ...f, subjects: e.target.value }))}
                    className="w-full bg-[#141414] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Room No & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Room No (Optional)</label>
                  <input
                    value={form.roomNo}
                    onChange={e => setForm(f => ({ ...f, roomNo: e.target.value }))}
                    placeholder="e.g. Room 101"
                    className="w-full bg-[#141414] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Status</label>
                  <div className="relative">
                    <select
                      value={form.status}
                      onChange={e => setForm(f => ({ ...f, status: e.target.value as 'ACTIVE' | 'INACTIVE' }))}
                      className="w-full appearance-none bg-[#141414] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 px-6 pb-5">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-xs font-bold text-zinc-300 hover:bg-zinc-800 transition uppercase"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!form.teacher.trim()}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold uppercase transition disabled:opacity-40"
              >
                {editClass ? 'Save Changes' : 'Add Class'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
