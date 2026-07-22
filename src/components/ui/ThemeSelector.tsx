'use client';

import { useTheme, ThemeMode } from '@/context/ThemeContext';

interface ThemeSelectorProps {
  compact?: boolean;
}

export function ThemeSelector({ compact = false }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();

  const options: { mode: ThemeMode; label: string; icon: string }[] = [
    { mode: 'light', label: 'Jasny', icon: '☀️' },
    { mode: 'dark', label: 'Ciemny', icon: '🌙' },
    { mode: 'system', label: 'Systemowy', icon: '💻' },
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
        {options.map((opt) => (
          <button
            key={opt.mode}
            type="button"
            onClick={() => setTheme(opt.mode)}
            title={`Przełącz na tryb ${opt.label.toLowerCase()}`}
            className={`w-7 h-7 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
              theme === opt.mode
                ? 'bg-brand-600 text-white shadow-sm scale-105'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {opt.icon}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
        Motyw Wyglądu
      </label>
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        {options.map((opt) => (
          <button
            key={opt.mode}
            type="button"
            onClick={() => setTheme(opt.mode)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              theme === opt.mode
                ? 'bg-brand-600 text-white shadow-md font-extrabold scale-102'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <span>{opt.icon}</span>
            <span className="text-[11px]">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
