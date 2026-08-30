import React from 'react';
import { ChevronRight, ClipboardCheck, UserX } from 'lucide-react';

interface VerificationItem {
  id: string;
  label: string;
  count: string;
  timing: string;
  icon: React.ReactNode;
  accentClass: string;
  onClick?: () => void;
}

interface VerificationPanelProps {
  practicalCount: number;
  absentCount: number;
  onViewPractical: () => void;
  onViewAbsent: () => void;
}

export const VerificationPanel: React.FC<VerificationPanelProps> = ({
  practicalCount, absentCount, onViewPractical, onViewAbsent
}) => {
  const items: VerificationItem[] = [
    {
      id: 'practical',
      label: 'PRACTICAL MARK AUDIT',
      count: `${practicalCount} STUDENT${practicalCount !== 1 ? 'S' : ''} FLAGGED`,
      timing: '2H LEFT',
      icon: <ClipboardCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
      accentClass: 'border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20',
      onClick: onViewPractical,
    },
    {
      id: 'absent',
      label: 'ABSENTEE RE-ENTRY',
      count: `${absentCount} REGISTR${absentCount !== 1 ? 'IES' : 'Y'}`,
      timing: 'TOMORROW',
      icon: <UserX className="h-4 w-4 text-rose-500 dark:text-rose-400" />,
      accentClass: 'border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20',
      onClick: onViewAbsent,
    }
  ];

  return (
    <div className="flex flex-col font-mono">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">UPCOMING VERIFICATIONS</p>
        <button className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase hover:text-black dark:hover:text-white transition">VIEW ALL</button>
      </div>

      <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {items.map(item => (
          <button
            key={item.id}
            onClick={item.onClick}
            className={`flex items-center gap-3 px-4 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all text-left group border-l-2 ${item.accentClass}`}
          >
            <div className="w-8 h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex items-center justify-center flex-shrink-0">
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 truncate uppercase">{item.label}</p>
              <p className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5 uppercase">
                {item.count} · <span className="text-zinc-500 dark:text-zinc-400">{item.timing}</span>
              </p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-300 dark:text-zinc-600 group-hover:text-black dark:group-hover:text-white transition-colors flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};
