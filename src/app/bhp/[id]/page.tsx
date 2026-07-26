'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBhpHazardReports, BhpHazardReport } from '@/hooks/useBhpHazardReports';
import { CATEGORY_LABELS, SEVERITY_LABELS, STATUS_LABELS } from '@/components/ui/BhpHazardDrawer';
import { ImageModal } from '@/components/ui/ImageModal';
import { ImageUploadWithCamera } from '@/components/ui/ImageUploadWithCamera';
import { DocumentAccessHistoryModal } from '@/components/ui/DocumentAccessHistoryModal';
import { useAccessTracker } from '@/hooks/useAccessTracker';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/hooks/useAuth';

interface UserOption {
  id: string;
  name: string;
  role?: string;
}

const HAZARD_CATEGORIES = [
  'Mechaniczne (zgniecenie, pochwycenie, skaleczenie)',
  'Chemiczne (substancje żrące, toksyczne, dymy)',
  'Ergonomiczne (dźwiganie, obciążenie kręgosłupa)',
  'Pożarowe / Wybuchowe (iskry, zastawione przejścia)',
  'Elektryczne (odkryte przewody, przebicie)',
  'Biologiczne (pleśń, ścieki, kurz)',
  'Termiczne (gorące powierzchnie, oparzenia)',
  'Upadek z wysokości / Poślizgnięcie',
  'Inne Zagrożenie BHP',
];

export default function BhpHazardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { showToast, showConfirm } = useToast();
  const { isAdmin, user } = useAuth();
  const { deleteReport } = useBhpHazardReports();

  const [report, setReport] = useState<BhpHazardReport | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Analysis Form State
  const [hazardCategory, setHazardCategory] = useState('Mechaniczne (zgniecenie, pochwycenie, skaleczenie)');
  const [probability, setProbability] = useState<number>(2);
  const [injurySeverity, setInjurySeverity] = useState<number>(3);
  const [actionTakenInput, setActionTakenInput] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [dueDateInput, setDueDateInput] = useState('');
  const [fixPhotoUrl, setFixPhotoUrl] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [analysisAttempted, setAnalysisAttempted] = useState(false);

  useAccessTracker({
    entityType: 'BHP',
    entityId: resolvedParams.id,
    entityTitle: report?.title || 'Zgłoszenie BHP',
  });

  useEffect(() => {
    loadData();
    fetchUsers();
  }, [resolvedParams.id]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setUsers(data);
      }
    } catch (e) {
      console.error('Error fetching users:', e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bhp/${resolvedParams.id}`);
      if (!res.ok) throw new Error('Nie znaleziono zgłoszenia BHP');
      const data: BhpHazardReport = await res.json();
      setReport(data);

      // Pre-fill analysis fields
      if (data.actionTaken) setActionTakenInput(data.actionTaken);
      if (data.hazardCategory) setHazardCategory(data.hazardCategory);
      if (data.probability) setProbability(data.probability);
      if (data.injurySeverity) setInjurySeverity(data.injurySeverity);
      if (data.assignedToId) setAssignedToId(data.assignedToId);
      if (data.dueDate) setDueDateInput(data.dueDate.split('T')[0]);
      if (data.fixPhotoUrl) setFixPhotoUrl(data.fixPhotoUrl);
    } catch (err: any) {
      showToast(err.message || 'Błąd ładowania zgłoszenia BHP', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Calculated Risk Matrix (Risk = Probability x Injury Severity)
  const riskScore = probability * injurySeverity;
  const riskLevel = riskScore <= 6 ? 'LOW' : riskScore <= 14 ? 'MEDIUM' : 'HIGH';

  // Authorization for Analysis: Admin, Zarząd, BHP role/notification, or Assigned Inspector
  const userRoleUpper = String(user?.role || '').toUpperCase();
  const isBhpRole = userRoleUpper.includes('BHP') || userRoleUpper.includes('SAFETY') || userRoleUpper.includes('EHS');
  const canAnalyze = isAdmin || isBhpRole || Boolean(user?.notifyBhp) || Boolean(report?.assignedToId && report.assignedToId === user?.id);

  const handleStartAnalysis = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/bhp/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'IN_PROGRESS',
          hazardCategory,
          probability,
          injurySeverity,
          actionTaken: actionTakenInput,
          assignedToId: assignedToId || null,
          dueDate: dueDateInput || null,
        }),
      });
      if (!res.ok) throw new Error('Błąd rozpoczęcia analizy');
      showToast('⚙️ Rozpoczęto analizę BHP! Zgłoszenie przeszło w stan "W trakcie".', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Błąd rozpoczęcia analizy', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAnalysis = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAnalysisAttempted(true);

    if (!actionTakenInput.trim()) {
      showToast('Opis ustaleń z analizy i planu działań jest bezwzględnie wymagany!', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/bhp/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hazardCategory,
          probability,
          injurySeverity,
          actionTaken: actionTakenInput.trim(),
          assignedToId: assignedToId || null,
          dueDate: dueDateInput || null,
        }),
      });
      if (!res.ok) throw new Error('Błąd zapisu wyników analizy');
      showToast('💾 Wyniki analizy BHP i ocena ryzyka zostały pomyślnie zapisane!', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Błąd zapisu analizy', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResolveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnalysisAttempted(true);

    if (!actionTakenInput.trim()) {
      showToast('Opis ustaleń z analizy i działań korygujących jest bezwzględnie wymagany!', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/bhp/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve',
          fixedBy: user?.name || user?.login || 'Inspektor BHP',
          fixPhotoUrl: fixPhotoUrl || null,
          actionTaken: actionTakenInput.trim(),
          hazardCategory,
          probability,
          injurySeverity,
        }),
      });
      if (!res.ok) throw new Error('Błąd wyeliminowania zagrożenia');
      showToast('✅ Zagrożenie BHP zostało pomyślnie wyeliminowane i zamknięte!', 'success');
      setIsResolving(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Błąd zamknięcia zgłoszenia', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    showConfirm({
      title: 'Usuń Zgłoszenie BHP',
      message: 'Czy na pewno chcesz usunąć to zgłoszenie zagrożenia BHP?',
      confirmText: 'Usuń',
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteReport(resolvedParams.id);
          showToast('Zgłoszenie BHP usunięte', 'success');
          router.push('/bhp');
        } catch (err: any) {
          showToast(err.message || 'Błąd usuwania', 'error');
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 font-bold animate-pulse">
        Ładowanie formularza analizy BHP...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-red-500 font-bold">Nie znaleziono zgłoszenia BHP.</p>
        <Link href="/bhp" className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl font-bold text-xs inline-block">
          ← Powrót do rejestru BHP
        </Link>
      </div>
    );
  }

  const cat = CATEGORY_LABELS[report.category] || { label: report.category, icon: '🛡️' };
  const sev = SEVERITY_LABELS[report.severity] || { label: report.severity, cls: 'bg-slate-100 text-slate-700' };
  const st = STATUS_LABELS[report.status] || { label: report.status, cls: 'bg-slate-100 text-slate-700' };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/bhp"
            className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-2xl font-bold text-xs transition-colors"
          >
            ← Powrót do BHP
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>{cat.icon}</span> {report.title}
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Kategoria: <strong>{cat.label}</strong> | Utworzono: {new Date(report.createdAt).toLocaleString('pl-PL')}
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIsHistoryModalOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-300 dark:border-slate-700"
          >
            👥 Historia Zapoznań
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-3.5 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-950/60 text-red-700 dark:text-red-300 rounded-xl text-xs font-bold transition-all border border-red-200 dark:border-red-800"
            >
              🗑️ Usuń
            </button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Report Information */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-3 py-1 text-xs font-black rounded-xl border ${st.cls}`}>
                {st.label}
              </span>
              <span className={`px-3 py-1 text-xs font-black rounded-xl border ${sev.cls}`}>
                {sev.label}
              </span>
            </div>

            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">Opis Zgłoszenia BHP</h2>
              <p className="text-slate-800 dark:text-slate-200 text-xs font-medium whitespace-pre-wrap leading-relaxed">
                {report.description || '(Brak opisu)'}
              </p>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 font-bold block">📍 Obszar / Rejon</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{report.area?.name || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">⚙️ Maszyna / Linia</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{report.machine?.name || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">👤 Zgłaszający</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{report.reportedBy || '—'}</span>
              </div>
              {report.assignedTo && (
                <div>
                  <span className="text-slate-400 font-bold block">🛡️ Przypisany Inspektor</span>
                  <span className="font-extrabold text-brand-600 dark:text-brand-400">{report.assignedTo.name}</span>
                </div>
              )}
              {report.dueDate && (
                <div>
                  <span className="text-slate-400 font-bold block">📅 Planowany Termin Eliminacji</span>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400">{new Date(report.dueDate).toLocaleDateString('pl-PL')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Photo documentation */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Zdjęcie Zgłoszenia</h3>
            {report.photoUrl ? (
              <button
                type="button"
                onClick={() => setSelectedImage(report.photoUrl!)}
                className="block relative w-full h-48 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 group cursor-pointer"
              >
                <img src={report.photoUrl} alt="Zdjęcie zagrożenia BHP" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs">
                  🔍 Powiększ Zdjęcie
                </div>
              </button>
            ) : (
              <div className="w-full h-24 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 text-xs font-medium">
                Brak zdjęcia zgłoszenia
              </div>
            )}
          </div>
        </div>

        {/* Right Column: INTERACTIVE ANALYSIS & RISK ASSESSMENT PANEL */}
        <div className="lg:col-span-2 space-y-6">
          {report.status === 'OPEN' && canAnalyze && (
            <div className="p-6 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl shadow-lg space-y-4 border border-blue-700">
              <div className="flex items-center gap-3">
                <span className="text-3xl">⚙️</span>
                <div>
                  <h3 className="text-lg font-black">Zgłoszenie Oczekuje na Analizę</h3>
                  <p className="text-xs text-blue-200">
                    Kliknij poniżej, aby rozpocząć proces analizy zagrożenia, wyznaczyć ocenę ryzyka i określić działania zaradcze.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleStartAnalysis}
                disabled={isSaving}
                className="w-full py-3.5 bg-blue-500 hover:bg-blue-400 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isSaving ? 'Uruchamianie...' : '⚙️ Rozpocznij Analizę Zgłoszenia (Przejdź do analizy)'}
              </button>
            </div>
          )}

          {report.status === 'OPEN' && !canAnalyze && (
            <div className="p-5 bg-slate-100 dark:bg-slate-800/80 rounded-3xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <span className="text-2xl">⏳</span>
              <div>
                <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Zgłoszenie oczekuje na analizę</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Analizę przyczyn i wyznaczenie działań korygujących przeprowadza uprawniony Inspektor BHP lub Administrator.
                </p>
              </div>
            </div>
          )}

          {/* Formularz Analizy i Oceny Ryzyka */}
          <div className="p-6 bg-white dark:bg-slate-900 border-2 border-brand-500/40 dark:border-brand-600/40 rounded-3xl shadow-md space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>🛡️</span> Formularz Analizy i Oceny Ryzyka BHP
              </h3>
              <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-brand-100 dark:bg-brand-950 text-brand-800 dark:text-brand-200">
                EHS / Analiza Przyczyn
              </span>
            </div>

            {!canAnalyze && (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <span>🔒</span>
                <span>Tryb podglądu (OPERATOR). Analizę przyczyn zagrożenia oraz wyznaczenie działań prowadzi uprawniony Inspektor BHP lub Administrator.</span>
              </div>
            )}

            {/* Matryca Ryzyka (Risk Assessment) */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>📊 Matryca Ryzyka Zawodowego / Incydentu</span>
                <span className={`px-2.5 py-1 text-xs font-black rounded-xl ${
                  riskLevel === 'LOW' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' :
                  riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' :
                  'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
                }`}>
                  Wynik Ryzyka: {riskScore} / 25 ({riskLevel === 'LOW' ? '🟢 NISKIE' : riskLevel === 'MEDIUM' ? '🟡 ŚREDNIE' : '🔴 WYSOKIE'})
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Kategoria zagrożenia */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Kategoria Zagrożenia
                  </label>
                  <select
                    disabled={!canAnalyze}
                    value={hazardCategory}
                    onChange={e => setHazardCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60 cursor-pointer"
                  >
                    {HAZARD_CATEGORIES.map(hc => (
                      <option key={hc} value={hc}>{hc}</option>
                    ))}
                  </select>
                </div>

                {/* Prawdopodobieństwo */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Prawdopodobieństwo (P: 1-5)
                  </label>
                  <select
                    disabled={!canAnalyze}
                    value={probability}
                    onChange={e => setProbability(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60 cursor-pointer"
                  >
                    <option value={1}>1 - Znikome (raz w roku)</option>
                    <option value={2}>2 - Małe (raz w miesiącu)</option>
                    <option value={3}>3 - Średnie (raz w tygodniu)</option>
                    <option value={4}>4 - Duże (raz dziennie)</option>
                    <option value={5}>5 - Bardzo duże (ciągłe)</option>
                  </select>
                </div>

                {/* Ciężkość Skutków */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Ciężkość Skutków (C: 1-5)
                  </label>
                  <select
                    disabled={!canAnalyze}
                    value={injurySeverity}
                    onChange={e => setInjurySeverity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60 cursor-pointer"
                  >
                    <option value={1}>1 - Znikoma (pierwsza pomoc)</option>
                    <option value={2}>2 - Mała (lekkie skaleczenie)</option>
                    <option value={3}>3 - Średnia (zwolnienie lekarskie)</option>
                    <option value={4}>4 - Duża (ciężki uszczerbek)</option>
                    <option value={5}>5 - Krytyczna (zagrożenie życia)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Przypisanie Odpowiedzialnego i Terminu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Inspektor BHP / Odpowiedzialny
                </label>
                <select
                  disabled={!canAnalyze}
                  value={assignedToId}
                  onChange={e => setAssignedToId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
                >
                  <option value="">— Wybierz inspektora / pracownika —</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      👤 {u.name} {u.role ? `(${u.role})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Planowany Termin Eliminacji
                </label>
                <input
                  disabled={!canAnalyze}
                  type="date"
                  value={dueDateInput}
                  onChange={e => setDueDateInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
                />
              </div>
            </div>

            {/* Notatki z Analizy i Plan Działań Korygujących */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Notatki z Analizy i Plan Działań Zapobiegawczych * (Wymagane)
              </label>
              <textarea
                disabled={!canAnalyze}
                required
                rows={4}
                value={actionTakenInput}
                onChange={e => setActionTakenInput(e.target.value)}
                placeholder="Wpisz poczynione ustalenia, opis przyczyn źródłowych oraz planowane lub wykonane działania korygujące..."
                className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border rounded-2xl text-xs font-medium outline-none transition-all disabled:opacity-60 ${
                  analysisAttempted && !actionTakenInput.trim()
                    ? 'border-red-500 ring-2 ring-red-500/30 bg-red-50/50 dark:bg-red-950/30'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-brand-500'
                }`}
              />
              {analysisAttempted && !actionTakenInput.trim() && (
                <p className="text-xs font-bold text-red-500 mt-1 flex items-center gap-1">
                  ⚠️ Opis ustaleń z analizy i działań korygujących jest bezwzględnie wymagany!
                </p>
              )}
            </div>

            {/* Zapisz Wyniki Analizy Button */}
            {canAnalyze && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleSaveAnalysis()}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  💾 {isSaving ? 'Zapisywanie...' : 'Zapisz Wyniki Analizy i Ocenę Ryzyka'}
                </button>

                {report.status !== 'RESOLVED' && !isResolving && (
                  <button
                    type="button"
                    onClick={() => setIsResolving(true)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    ✅ Wyeliminuj Zagrożenie (Zakończ)
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Formularz Zamknięcia / Eliminacji Zagrożenia */}
          {isResolving && (
            <form onSubmit={handleResolveReport} className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 rounded-3xl shadow-lg space-y-4 animate-in fade-in">
              <h4 className="text-sm font-black text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                <span>✅</span> Eliminacja Zagrożenia BHP i Zamknięcie Zgłoszenia
              </h4>

              <div>
                <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-200 mb-1">
                  Opis wykonanych działań korygujących (wymagane przed zamknięciem) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={actionTakenInput}
                  onChange={e => setActionTakenInput(e.target.value)}
                  placeholder="np. Zabezpieczono odsłoniętą osłonę, wymieniono taśmę ostrzegawczą..."
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <ImageUploadWithCamera
                label="Zdjęcie po wyeliminowaniu zagrożenia (Dowód wykonania)"
                value={fixPhotoUrl}
                onChange={url => setFixPhotoUrl(url)}
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResolving(false)}
                  className="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Anuluj
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  ✅ {isSaving ? 'Zapisywanie...' : 'Zatwierdź i Zamknij Zgłoszenie BHP'}
                </button>
              </div>
            </form>
          )}

          {/* Działania Wykonane (Widok historyczny po zamknięciu) */}
          {report.status === 'RESOLVED' && (
            <div className="p-5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-3xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5">
                  <span>✅</span> Zgłoszenie Wyeliminowane i Zamknięte
                </span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                  {report.fixedAt ? new Date(report.fixedAt).toLocaleString('pl-PL') : ''}
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium whitespace-pre-wrap">
                Osoba odpowiedzialna: <strong>{report.fixedBy || 'Inspektor BHP'}</strong>
              </p>
              {report.actionTaken && (
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium whitespace-pre-wrap italic bg-white/60 dark:bg-slate-900/60 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  "{report.actionTaken}"
                </p>
              )}
              {report.fixPhotoUrl && (
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">Zdjęcie Po Eliminacji:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedImage(report.fixPhotoUrl!)}
                    className="block relative w-32 h-32 rounded-xl overflow-hidden border border-emerald-300 dark:border-emerald-700 group cursor-pointer"
                  >
                    <img src={report.fixPhotoUrl} alt="Zdjęcie eliminacji" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ImageModal isOpen={!!selectedImage} onClose={() => setSelectedImage(null)} imageUrl={selectedImage} />
      <DocumentAccessHistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} entityType="BHP" entityId={report.id} entityTitle={report.title} />
    </div>
  );
}
