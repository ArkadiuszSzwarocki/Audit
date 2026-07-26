'use client';

import { useState, useMemo } from 'react';

// Risk assessment constants
const HAZARD_CATEGORIES = [
  { value: 'MECHANICAL', label: '⚙️ Mechaniczne' },
  { value: 'CHEMICAL', label: '🧪 Chemiczne' },
  { value: 'ERGONOMIC', label: '🪑 Ergonomiczne' },
  { value: 'TOXIC', label: '☠️ Toksyczne' },
  { value: 'BIOLOGICAL', label: '🦠 Biologiczne' },
  { value: 'THERMAL', label: '🔥 Termiczne' },
  { value: 'OTHER', label: '❓ Inne' },
];

const PROBABILITY_SCALE = [
  { value: 1, label: '1 - Bardzo mało prawdopodobne', color: 'bg-green-500' },
  { value: 2, label: '2 - Mało prawdopodobne', color: 'bg-yellow-500' },
  { value: 3, label: '3 - Średnio prawdopodobne', color: 'bg-orange-500' },
  { value: 4, label: '4 - Bardzo prawdopodobne', color: 'bg-red-400' },
  { value: 5, label: '5 - Prawie pewne', color: 'bg-red-600' },
];

const SEVERITY_SCALE = [
  { value: 1, label: '1 - Nieznaczna (drobne obrażenia)', color: 'bg-green-500' },
  { value: 2, label: '2 - Łagodna (obrażenia małe)', color: 'bg-yellow-500' },
  { value: 3, label: '3 - Poważna (hospitalizacja)', color: 'bg-orange-500' },
  { value: 4, label: '4 - Bardzo poważna (trwałe uszkodzenia)', color: 'bg-red-400' },
  { value: 5, label: '5 - Śmierć / Kalectwo', color: 'bg-red-600' },
];

interface ResolveBhpHazardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (actionTaken?: string, hazardCategory?: string, probability?: number, injurySeverity?: number) => Promise<void>;
}

export function ResolveBhpHazardModal({ isOpen, onClose, onConfirm }: ResolveBhpHazardModalProps) {
  const [actionTaken, setActionTaken] = useState('');
  const [hazardCategory, setHazardCategory] = useState('');
  const [probability, setProbability] = useState<number | null>(null);
  const [injurySeverity, setInjurySeverity] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamically calculate risk score and level
  const { riskScore, riskLevel, riskColor } = useMemo(() => {
    if (probability === null || injurySeverity === null) {
      return { riskScore: null, riskLevel: null, riskColor: '' };
    }
    const score = probability * injurySeverity;
    let level = 'MEDIUM';
    let color = 'bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-950/50 dark:border-yellow-800 dark:text-yellow-300';

    if (score >= 1 && score <= 6) {
      level = 'LOW';
      color = 'bg-green-100 border-green-300 text-green-800 dark:bg-green-950/50 dark:border-green-800 dark:text-green-300';
    } else if (score >= 8 && score <= 14) {
      level = 'MEDIUM';
      color = 'bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-950/50 dark:border-yellow-800 dark:text-yellow-300';
    } else if (score >= 15 && score <= 25) {
      level = 'HIGH';
      color = 'bg-red-100 border-red-300 text-red-800 dark:bg-red-950/50 dark:border-red-800 dark:text-red-300';
    }

    return { riskScore: score, riskLevel: level, riskColor: color };
  }, [probability, injurySeverity]);

  const isFormValid = actionTaken.trim() && hazardCategory && probability !== null && injurySeverity !== null;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsSubmitting(true);
    try {
      await onConfirm(actionTaken.trim(), hazardCategory, probability!, injurySeverity!);
      // Reset form
      setActionTaken('');
      setHazardCategory('');
      setProbability(null);
      setInjurySeverity(null);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>🛡️</span> Ocena Ryzyka i Wyeliminowanie Zagrożenia
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold p-1 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Risk Assessment Section */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border border-orange-200 dark:border-orange-800 rounded-2xl p-5 space-y-4">
            <h4 className="text-sm font-extrabold uppercase tracking-wider text-orange-700 dark:text-orange-300 flex items-center gap-2">
              📊 Panel Oceny Ryzyka
            </h4>

            {/* Hazard Category */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Kategoria Zagrożenia *
              </label>
              <select
                required
                value={hazardCategory}
                onChange={(e) => setHazardCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">-- Wybierz kategorię --</option>
                {HAZARD_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Probability - Range Slider */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
                Prawdopodobieństwo Występienia (1-5) *
              </label>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Prawie niemożliwe (1)</span>
                  <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{probability || '—'}</span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">Pewne (5)</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={probability ?? 1}
                  onChange={(e) => setProbability(parseInt(e.target.value))}
                  className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-blue-600"
                />
                {probability !== null && (
                  <div className={`px-3 py-2 rounded-lg text-sm font-bold ${PROBABILITY_SCALE[probability - 1].color} text-white`}>
                    {PROBABILITY_SCALE[probability - 1].label}
                  </div>
                )}
              </div>
            </div>

            {/* Severity - Range Slider */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
                Ciężkość Skutków (1-5) *
              </label>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Drobny uraz (1)</span>
                  <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{injurySeverity || '—'}</span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">Śmierć (5)</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={injurySeverity ?? 1}
                  onChange={(e) => setInjurySeverity(parseInt(e.target.value))}
                  className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-blue-600"
                />
                {injurySeverity !== null && (
                  <div className={`px-3 py-2 rounded-lg text-sm font-bold ${SEVERITY_SCALE[injurySeverity - 1].color} text-white`}>
                    {SEVERITY_SCALE[injurySeverity - 1].label}
                  </div>
                )}
              </div>
            </div>

            {/* Risk Score Display */}
            {riskScore !== null && (
              <div className={`border-2 rounded-xl p-4 text-center ${riskColor}`}>
                <div className="text-xs font-bold uppercase tracking-wider mb-1">Wynik Ryzyka</div>
                <div className="text-4xl font-black mb-1">{riskScore}</div>
                <div className="text-sm font-bold">
                  {riskLevel === 'LOW' && '🟢 RYZYKO NISKIE'}
                  {riskLevel === 'MEDIUM' && '🟡 RYZYKO ŚREDNIE'}
                  {riskLevel === 'HIGH' && '🔴 RYZYKO WYSOKIE'}
                </div>
                <div className="text-xs opacity-75 mt-1">
                  {riskScore >= 1 && riskScore <= 6 && 'Sytuacja akceptowalna'}
                  {riskScore >= 8 && riskScore <= 14 && 'Wymagane zmniejszenie ryzyka'}
                  {riskScore >= 15 && riskScore <= 25 && 'Zagrożenie niedopuszczalne - pilna interwencja!'}
                </div>
              </div>
            )}
          </div>

          {/* Action Taken */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Podjęte Działania Zapobiegawcze / Korygujące *
            </label>
            <textarea
              required
              rows={4}
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              placeholder="np. Zamontowano osłonę bezpieczeństwa na przekładni, oznakowano strefę niebezpieczną taśmą ostrzegawczą, przeszkolono operatorów."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Validation Message */}
          {!isFormValid && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                ⚠️ Wszystkie pola oceny ryzyka i opis działań są obowiązkowe.
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isFormValid}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              {isSubmitting ? 'Zapisywanie...' : '✅ Wyeliminowano Zagrożenie'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
