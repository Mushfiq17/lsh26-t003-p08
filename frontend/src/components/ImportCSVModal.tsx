import React, { useState } from 'react';
import { X, FileSpreadsheet, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { downloadCSVTemplate, parseStudentsCSV, CSVStudentRow } from '../utils/csvImportUtils';
import { api } from '../api';
import { saveBatchToFirebase } from '../firebase';

interface ImportCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportCSVModal: React.FC<ImportCSVModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<CSVStudentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrorMsg(null);
    setSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseStudentsCSV(text);
      if (parsed.length === 0) {
        setErrorMsg('Could not parse any valid student records from the CSV file. Please check the CSV format.');
      }
      setParsedRows(parsed);
    };
    reader.readAsText(selectedFile);
  };

  const handleImportSubmit = async () => {
    if (parsedRows.length === 0) {
      setErrorMsg('No parsed records available to import.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const className = parsedRows[0]?.class_name || '9-A';
      const payload = {
        class_name: className,
        students: parsedRows
      };

      const res = await api.processBatch(payload);
      if (res.errors && res.errors.length > 0) {
        setErrorMsg(`Processed with warnings: ${res.errors.map((e: any) => e.message).join(', ')}`);
      } else {
        await saveBatchToFirebase(parsedRows);
        setSuccessMsg(`Successfully imported and processed ${res.processed ?? parsedRows.length} student records!`);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail?.error?.message || 'Failed to process CSV import.';
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
            <FileSpreadsheet className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Import Students via CSV</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-black dark:hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 flex items-start gap-2 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Template Download Prompt */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">Need a template?</p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Download our pre-formatted CSV template with sample data.</p>
            </div>
            <button
              onClick={downloadCSVTemplate}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black px-3 py-1.5 rounded-lg text-xs font-bold transition uppercase"
            >
              <Download className="h-3.5 w-3.5" /> Template
            </button>
          </div>

          {/* File Upload Box */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-2">
              Select CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full text-xs text-zinc-500 dark:text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-zinc-900 file:text-white dark:file:bg-white dark:file:text-black hover:file:opacity-80 cursor-pointer"
            />
          </div>

          {/* Parsed Preview Table */}
          {parsedRows.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase text-zinc-400">
                <span>PREVIEW ({parsedRows.length} RECORDS FOUND)</span>
                <span>{file?.name}</span>
              </div>
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/40 text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="px-3 py-1.5">ID</th>
                      <th className="px-3 py-1.5">NAME</th>
                      <th className="px-3 py-1.5">CLASS</th>
                      <th className="px-3 py-1.5">OPTIONAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/50 font-mono">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                        <td className="px-3 py-1.5 font-bold">{row.student_id}</td>
                        <td className="px-3 py-1.5 font-sans font-semibold">{row.name}</td>
                        <td className="px-3 py-1.5">{row.class_name}</td>
                        <td className="px-3 py-1.5">{row.optional_subject}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 uppercase"
            >
              Cancel
            </button>
            <button
              onClick={handleImportSubmit}
              disabled={loading || parsedRows.length === 0}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black border border-amber-600 uppercase transition disabled:opacity-50"
            >
              {loading ? 'Importing...' : `Import ${parsedRows.length} Students`}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
