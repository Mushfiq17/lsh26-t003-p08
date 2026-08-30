import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  subtitle?: string;
  subtitleColor?: string;
  extra?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title, value, icon, iconBg, subtitle, subtitleColor, extra
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm flex flex-col gap-3 flex-1 min-w-0 transition-colors">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
        <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-0.5 leading-tight">{value}</p>
      </div>
      {(subtitle || extra) && (
        <div className={`text-xs font-medium ${subtitleColor ?? 'text-slate-400 dark:text-slate-500'}`}>
          {subtitle}
          {extra}
        </div>
      )}
    </div>
  );
};
