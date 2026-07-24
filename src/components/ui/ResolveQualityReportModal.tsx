'use client';

import { useState } from 'react';
import { ImageUploadWithCamera } from '@/components/ui/ImageUploadWithCamera';

interface ResolveQualityReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (actionTaken: string, fixPhotoUrl?: string) => Promise<void>;
  title: string;
}

export function ResolveQualityReportModal({
  isOpen,
  onClose,
  onConfirm,
  title,
}: ResolveQualityReportModalProps) {
  const [actionTaken, setActionTaken] = useState('');
  const [fixPhotoUrl, setFixPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTaken.trim()) {
      setError('Wpisz podjęte działania korygujące i zapobiegawcze (CAPA)');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onConfirm(actionTaken.trim(), fixPhotoUrl || undefined);
      setActionTaken('');
      setFixPhotoUrl(null);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Wystąpił błąd podczas zapisywania akcji CAPA');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-full">
            Działania Korygujące CAPA
          </span>
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
            Rozlicz Niezgodność Jakościową
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
            {title}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 text-red-600 text-xs font-bold">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Podjęte Działania Korygujące i Zapobiegawcze (CAPA) *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Opisz jakie kroki podjęto (np. odizolowanie partii, zmiana parametrów procesu, ponowna kontrola surowca)..."
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-300 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <ImageUploadWithCamera
            label="Zdjęcie po korekcie / próbka kontrolna (opcjonalnie)"
            value={fixPhotoUrl}
            onChange={(url) => setFixPhotoUrl(url)}
          />

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              {loading ? 'Zapisywanie...' : '✅ Zatwierdź CAPA & Zamknij Niezgodność'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
