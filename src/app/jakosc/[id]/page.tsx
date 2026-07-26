'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQualityReports, QualityReport } from '@/hooks/useQualityReports';
import { QUALITY_CATEGORY_LABELS, QUALITY_SEVERITY_LABELS, QUALITY_STATUS_LABELS } from '@/components/ui/QualityReportDrawer';
import { ImageModal } from '@/components/ui/ImageModal';
import { ImageUploadWithCamera } from '@/components/ui/ImageUploadWithCamera';
import { DocumentAccessHistoryModal } from '@/components/ui/DocumentAccessHistoryModal';
import { PromptEmailModal } from '@/components/ui/PromptEmailModal';
import { downloadQualityEml } from '@/utils/qualityEmailBuilder';
import { printQualityReport } from '@/utils/qualityPrintBuilder';
import { useAccessTracker } from '@/hooks/useAccessTracker';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/hooks/useAuth';

interface UserOption {
  id: string;
  name: string;
  role?: string;
}

const QUALITY_DEFECT_CATEGORIES = [
  'Wada Produktu Gotowego (Product Defect)',
  'Wada Surowca / Komponentu Dostawcy (Raw Material / Supplier Defect)',
  'Odstępstwo od Parametrów Procesu (Process Deviation)',
  'Wada Opakowania / Etykietowania (Packaging / Labeling)',
  'Reklamacja Klienta (Customer Complaint)',
  'Niezgodność ze Standardem Jakości (IFS / BRC / HACCP)',
  'Inne Odstępstwo Jakościowe',
];

const BATCH_DISPOSITIONS = [
  { value: 'REWORK', label: '♻️ Przerób / Naprawa Partii (Rework)' },
  { value: 'SCRAP', label: '🗑️ Złomowanie / Wrzuta (Scrap)' },
  { value: 'HOLD', label: '🛡️ Kwarantanna / Blokada Magazynowa (Hold)' },
  { value: 'RETURN_TO_SUPPLIER', label: '🚚 Zwrot do Dostawcy (Supplier Return)' },
  { value: 'CONCESSION', label: '✅ Warunkowe Zwolnienie / Odstępstwo (Concession)' },
];

export default function QualityReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { showToast, showConfirm } = useToast();
  const { isAdmin, user } = useAuth();
  const { deleteReport } = useQualityReports();

  const [report, setReport] = useState<QualityReport | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  // Form state for Quality Analysis & CAPA
  const [defectCategory, setDefectCategory] = useState(QUALITY_DEFECT_CATEGORIES[0]);
  const [detectionScore, setDetectionScore] = useState<number>(2);
  const [severityScore, setSeverityScore] = useState<number>(3);
  const [batchNumberInput, setBatchNumberInput] = useState('');
  const [quantityAffectedInput, setQuantityAffectedInput] = useState('');
  const [disposition, setDisposition] = useState('REWORK');
  const [actionTakenInput, setActionTakenInput] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [dueDateInput, setDueDateInput] = useState('');
  const [fixPhotoUrl, setFixPhotoUrl] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [analysisAttempted, setAnalysisAttempted] = useState(false);

  useAccessTracker({
    entityType: 'QUALITY',
    entityId: resolvedParams.id,
    entityTitle: report?.title || 'Niezgodność Jakościowa',
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
      const res = await fetch(`/api/jakosc/${resolvedParams.id}`);
      if (!res.ok) throw new Error('Nie znaleziono zgłoszenia jakościowego');
      const data: QualityReport = await res.json();
      setReport(data);

      if (data.actionTaken) setActionTakenInput(data.actionTaken);
      if (data.batchNumber) setBatchNumberInput(data.batchNumber);
      if (data.quantityAffected) setQuantityAffectedInput(data.quantityAffected);
      if (data.assignedToId) setAssignedToId(data.assignedToId);
      if (data.dueDate) setDueDateInput(data.dueDate.split('T')[0]);
      if (data.fixPhotoUrl) setFixPhotoUrl(data.fixPhotoUrl);
    } catch (err: any) {
      showToast(err.message || 'Błąd ładowania zgłoszenia', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Calculated Quality Risk Matrix (Risk = Detection × Severity)
  const qualityRiskScore = detectionScore * severityScore;
  const qualityRiskLevel = qualityRiskScore <= 6 ? 'LOW' : qualityRiskScore <= 14 ? 'MEDIUM' : 'HIGH';

  // Authorization for Quality Analysis: Admin, Zarząd, Quality role/notification, or Assigned Inspector
  const userRoleUpper = String(user?.role || '').toUpperCase();
  const isQualityRole = userRoleUpper.includes('JAKOŚĆ') || userRoleUpper.includes('JAKOSC') || userRoleUpper.includes('QUALITY') || userRoleUpper.includes('QC') || userRoleUpper.includes('QA');
  const canAnalyze = isAdmin || isQualityRole || Boolean(user?.notifyQuality) || Boolean(report?.assignedToId && report.assignedToId === user?.id);

  const handleStartAnalysis = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/jakosc/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'IN_PROGRESS',
          actionTaken: actionTakenInput,
          batchNumber: batchNumberInput || null,
          quantityAffected: quantityAffectedInput || null,
          assignedToId: assignedToId || null,
          dueDate: dueDateInput || null,
        }),
      });
      if (!res.ok) throw new Error('Błąd rozpoczęcia analizy');
      showToast('⚙️ Rozpoczęto analizę jakościową! Zgłoszenie przeszło w stan "W trakcie".', 'success');
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
      showToast('Opis analizy przyczyn źródłowych i działań CAPA jest bezwzględnie wymagany!', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/jakosc/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionTaken: actionTakenInput.trim(),
          batchNumber: batchNumberInput || null,
          quantityAffected: quantityAffectedInput || null,
          assignedToId: assignedToId || null,
          dueDate: dueDateInput || null,
        }),
      });
      if (!res.ok) throw new Error('Błąd zapisu wyników analizy');
      showToast('💾 Wyniki analizy jakościowej i plan CAPA zostały pomyślnie zapisane!', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Błąd zapisu analizy', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnalysisAttempted(true);

    if (!actionTakenInput.trim()) {
      showToast('Opis analizy przyczyn źródłowych i działań CAPA jest bezwzględnie wymagany!', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/jakosc/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve',
          fixedBy: user?.name || user?.login || 'Kontroler Jakości',
          actionTaken: actionTakenInput.trim(),
          fixPhotoUrl: fixPhotoUrl || null,
        }),
      });
      if (!res.ok) throw new Error('Błąd zamknięcia zgłoszenia');
      showToast('✅ Niezgodność jakościowa została pomyślnie zatwierdzona i rozwiązana (CAPA)!', 'success');
      setIsResolving(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Błąd zapisu', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    showConfirm({
      title: 'Usuń Niezgodność Jakościową',
      message: 'Czy na pewno chcesz usunąć to zgłoszenie jakościowe?',
      confirmText: 'Usuń',
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteReport(resolvedParams.id);
          showToast('Zgłoszenie jakościowe usunięte', 'success');
          router.push('/jakosc');
        } catch (err: any) {
          showToast(err.message || 'Błąd usuwania', 'error');
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 font-bold animate-pulse">
        Ładowanie formularza analizy jakościowej...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-red-500 font-bold">Nie znaleziono zgłoszenia jakościowego.</p>
        <Link href="/jakosc" className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl font-bold text-xs inline-block">
          ← Powrót do rejestru jakości
        </Link>
      </div>
    );
  }

  const cat = QUALITY_CATEGORY_LABELS[report.category] || { label: report.category, icon: '📦' };
  const sev = QUALITY_SEVERITY_LABELS[report.severity] || { label: report.severity, cls: 'bg-slate-100 text-slate-700' };
  const st = QUALITY_STATUS_LABELS[report.status] || { label: report.status, cls: 'bg-slate-100 text-slate-700' };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/jakosc"
            className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-2xl font-bold text-xs transition-colors"
          >
            ← Powrót do Jakości
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>{cat.icon}</span> {report.title}
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Kategoria: <strong>{cat.label}</strong> | Nr Partii: <strong>{report.batchNumber || '—'}</strong> | Utworzono: {new Date(report.createdAt).toLocaleString('pl-PL')}
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
          <button
            type="button"
            onClick={() => setIsEmailModalOpen(true)}
            className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 rounded-xl text-xs font-bold transition-all border border-amber-300 dark:border-amber-800"
          >
            📧 E-mail (.EML)
          </button>
          <button
            type="button"
            onClick={() => printQualityReport(report)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            🖨️ Drukuj / PDF
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

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
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
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">Opis Niezgodności Jakościowej</h2>
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
                <span className="text-slate-400 font-bold block">📦 Nr Partii / Zlecenia</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200 font-mono">{report.batchNumber || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">⚖️ Ilość Zakwestionowana</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{report.quantityAffected || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">👤 Zgłaszający</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{report.reportedBy || '—'}</span>
              </div>
              {report.assignedTo && (
                <div>
                  <span className="text-slate-400 font-bold block">🛡️ Przypisany Kontroler Jakości</span>
                  <span className="font-extrabold text-purple-600 dark:text-purple-400">{report.assignedTo.name}</span>
                </div>
              )}
              {report.dueDate && (
                <div>
                  <span className="text-slate-400 font-bold block">📅 Planowany Termin CAPA</span>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400">{new Date(report.dueDate).toLocaleDateString('pl-PL')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Photo documentation */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Zdjęcie Wady Jakościowej</h3>
            {report.photoUrl ? (
              <button
                type="button"
                onClick={() => setSelectedImage(report.photoUrl!)}
                className="block relative w-full h-48 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 group cursor-pointer"
              >
                <img src={report.photoUrl} alt="Zdjęcie wady" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs">
                  🔍 Powiększ Zdjęcie
                </div>
              </button>
            ) : (
              <div className="w-full h-24 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 text-xs font-medium">
                Brak zdjęcia wady
              </div>
            )}
          </div>
        </div>

        {/* Right Column: INTERACTIVE QUALITY ANALYSIS & CAPA PANEL */}
        <div className="lg:col-span-2 space-y-6">
          {report.status === 'OPEN' && canAnalyze && (
            <div className="p-6 bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-3xl shadow-lg space-y-4 border border-purple-700">
              <div className="flex items-center gap-3">
                <span className="text-3xl">⚙️</span>
                <div>
                  <h3 className="text-lg font-black">Zgłoszenie Jakościowe Oczekuje na Analizę CAPA</h3>
                  <p className="text-xs text-purple-200">
                    Rozpocznij proces analizy przyczyn źródłowych, wyznaczenia oceny ryzyka jakościowego dla klienta oraz określenia dyspozycji partii.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleStartAnalysis}
                disabled={isSaving}
                className="w-full py-3.5 bg-purple-500 hover:bg-purple-400 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isSaving ? 'Uruchamianie...' : '⚙️ Rozpocznij Analizę Jakościową (Przejdź do analizy i CAPA)'}
              </button>
            </div>
          )}

          {report.status === 'OPEN' && !canAnalyze && (
            <div className="p-5 bg-slate-100 dark:bg-slate-800/80 rounded-3xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <span className="text-2xl">⏳</span>
              <div>
                <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Zgłoszenie jakościowe oczekuje na analizę</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Analizę przyczyn źródłowych 5-Why i plan działań CAPA przeprowadza uprawniony Kontroler Jakości lub Administrator.
                </p>
              </div>
            </div>
          )}

          {/* Formularz Analizy Jakościowej & CAPA */}
          <div className="p-6 bg-white dark:bg-slate-900 border-2 border-purple-500/40 dark:border-purple-600/40 rounded-3xl shadow-md space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>🔍</span> Formularz Analizy Jakościowej & Działań Korygujących CAPA
              </h3>
              <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200">
                Kontrola Jakości / CAPA
              </span>
            </div>

            {!canAnalyze && (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <span>🔒</span>
                <span>Tryb podglądu (OPERATOR). Analizę przyczyn źródłowych (5-Why/CAPA) oraz dyspozycję partii prowadzi uprawniony Kontroler Jakości lub Administrator.</span>
              </div>
            )}

            {/* Matryca Ryzyka Jakościowego */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>📊 Ocena Ryzyka Jakościowego i Wpływu na Klienta</span>
                <span className={`px-2.5 py-1 text-xs font-black rounded-xl ${
                  qualityRiskLevel === 'LOW' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' :
                  qualityRiskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' :
                  'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
                }`}>
                  Wynik Ryzyka: {qualityRiskScore} / 25 ({qualityRiskLevel === 'LOW' ? '🟢 NISKIE' : qualityRiskLevel === 'MEDIUM' ? '🟡 ŚREDNIE' : '🔴 WYSOKIE'})
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Klasyfikacja wady */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Klasyfikacja Niezgodności
                  </label>
                  <select
                    disabled={!canAnalyze}
                    value={defectCategory}
                    onChange={e => setDefectCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60 cursor-pointer"
                  >
                    {QUALITY_DEFECT_CATEGORIES.map(dc => (
                      <option key={dc} value={dc}>{dc}</option>
                    ))}
                  </select>
                </div>

                {/* Wykrywalność (Detection) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Wykrywalność Wady (D: 1-5)
                  </label>
                  <select
                    disabled={!canAnalyze}
                    value={detectionScore}
                    onChange={e => setDetectionScore(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60 cursor-pointer"
                  >
                    <option value={1}>1 - Bardzo łatwa (automatyczna na linii)</option>
                    <option value={2}>2 - Łatwa (Standardowa kontrola organoleptyczna)</option>
                    <option value={3}>3 - Średnia (Wykrywalna w lab / próby)</option>
                    <option value={4}>4 - Trudna (Słabo widoczna)</option>
                    <option value={5}>5 - Bardzo trudna (Niewykrywalna / Klient)</option>
                  </select>
                </div>

                {/* Wpływ na Klienta (Severity) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Wpływ na Klienta / Produkt (S: 1-5)
                  </label>
                  <select
                    disabled={!canAnalyze}
                    value={severityScore}
                    onChange={e => setSeverityScore(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60 cursor-pointer"
                  >
                    <option value={1}>1 - Znikomy (Drobny błąd estetyczny)</option>
                    <option value={2}>2 - Mały (Lekkie odstępstwo nieistotne)</option>
                    <option value={3}>3 - Średni (Utrudnienie / Przerób)</option>
                    <option value={4}>4 - Duży (Reklamacja / Zastopowanie wysyłki)</option>
                    <option value={5}>5 - Krytyczny (Wycofanie z rynku / Bezpieczeństwo)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Zakwestionowana Partia & Dyspozycja */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nr Partii / Zlecenia
                </label>
                <input
                  disabled={!canAnalyze}
                  type="text"
                  value={batchNumberInput}
                  onChange={e => setBatchNumberInput(e.target.value)}
                  placeholder="np. BATCH-2026/04"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ilość Zakwestionowana
                </label>
                <input
                  disabled={!canAnalyze}
                  type="text"
                  value={quantityAffectedInput}
                  onChange={e => setQuantityAffectedInput(e.target.value)}
                  placeholder="np. 250 kg, 40 szt"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Dyspozycja Partii
                </label>
                <select
                  disabled={!canAnalyze}
                  value={disposition}
                  onChange={e => setDisposition(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60"
                >
                  {BATCH_DISPOSITIONS.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Przypisanie Kontrolera i Terminu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Inspektor / Kontroler Jakości
                </label>
                <select
                  disabled={!canAnalyze}
                  value={assignedToId}
                  onChange={e => setAssignedToId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60"
                >
                  <option value="">— Wybierz kontrolera / pracownika —</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      👤 {u.name} {u.role ? `(${u.role})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Planowany Termin Wdrożenia CAPA
                </label>
                <input
                  disabled={!canAnalyze}
                  type="date"
                  value={dueDateInput}
                  onChange={e => setDueDateInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60"
                />
              </div>
            </div>

            {/* Notatki z Analizy Przyczyn Źródłowych & Działania Korygujące CAPA */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Analiza Przyczyn Źródłowych (5-Why / Ishikawa) & Działania Korygujące CAPA * (Wymagane)
              </label>
              <textarea
                disabled={!canAnalyze}
                required
                rows={4}
                value={actionTakenInput}
                onChange={e => setActionTakenInput(e.target.value)}
                placeholder="Wpisz przyczynę główną wady, wynik analizy 5-Why oraz opis wdrożonych lub planowanych działań korygujących (CAPA)..."
                className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border rounded-2xl text-xs font-medium outline-none transition-all disabled:opacity-60 ${
                  analysisAttempted && !actionTakenInput.trim()
                    ? 'border-red-500 ring-2 ring-red-500/30 bg-red-50/50 dark:bg-red-950/30'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-purple-500'
                }`}
              />
              {analysisAttempted && !actionTakenInput.trim() && (
                <p className="text-xs font-bold text-red-500 mt-1 flex items-center gap-1">
                  ⚠️ Opis analizy przyczyn źródłowych i działań CAPA jest bezwzględnie wymagany!
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
                  className="px-6 py-2.5 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  💾 {isSaving ? 'Zapisywanie...' : 'Zapisz Wyniki Analizy i Plan CAPA'}
                </button>

                {report.status !== 'RESOLVED' && !isResolving && (
                  <button
                    type="button"
                    onClick={() => setIsResolving(true)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    ✅ Zatwierdź Działania CAPA (Zamknij)
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Formularz Zamknięcia CAPA */}
          {isResolving && (
            <form onSubmit={handleResolve} className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 rounded-3xl shadow-lg space-y-4 animate-in fade-in">
              <h4 className="text-sm font-black text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                <span>✅</span> Zatwierdzenie Działań CAPA i Zamknięcie Zgłoszenia
              </h4>

              <div>
                <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-200 mb-1">
                  Opis wdrożonych działań korygujących i zapobiegawczych (wymagane przed zamknięciem) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={actionTakenInput}
                  onChange={e => setActionTakenInput(e.target.value)}
                  placeholder="np. Skorygowano nastawę temperatury na zgrzewarce, wymieniono czujnik wizyjny, przeszkolono operatorów..."
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <ImageUploadWithCamera
                label="Zdjęcie po poprawie jakości / dowód wykonania CAPA"
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
                  ✅ {isSaving ? 'Zapisywanie...' : 'Zatwierdź i Zamknij Zgłoszenie Jakościowe'}
                </button>
              </div>
            </form>
          )}

          {/* Działania Wykonane (Widok historyczny po zamknięciu CAPA) */}
          {report.status === 'RESOLVED' && (
            <div className="p-5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-3xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-200 flex items-center gap-1.5">
                  <span>✅</span> Niezgodność Jakościowa Rozwiązana (CAPA Zakończone)
                </span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                  {report.fixedAt ? new Date(report.fixedAt).toLocaleString('pl-PL') : ''}
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium whitespace-pre-wrap">
                Osoba rozliczająca CAPA: <strong>{report.fixedBy || 'Kontroler Jakości'}</strong>
              </p>
              {report.actionTaken && (
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium whitespace-pre-wrap italic bg-white/60 dark:bg-slate-900/60 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  "{report.actionTaken}"
                </p>
              )}
              {report.fixPhotoUrl && (
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">Zdjęcie Po Poprawie Jakości:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedImage(report.fixPhotoUrl!)}
                    className="block relative w-32 h-32 rounded-xl overflow-hidden border border-emerald-300 dark:border-emerald-700 group cursor-pointer"
                  >
                    <img src={report.fixPhotoUrl} alt="Zdjęcie poprawy" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ImageModal isOpen={!!selectedImage} onClose={() => setSelectedImage(null)} imageUrl={selectedImage} />
      <PromptEmailModal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} title="Wysyłanie powiadomienia o wylosowanej wadze jakości" defaultEmail="jakosc@zaklad.pl" onConfirm={(email) => downloadQualityEml(report, email, window.location.origin)} />
      <DocumentAccessHistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} entityType="QUALITY" entityId={report.id} entityTitle={report.title} />
    </div>
  );
}
