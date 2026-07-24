'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAudits, Audit } from '@/hooks/useAudits';
import { ImageModal } from '@/components/ui/ImageModal';
import { ExtendDeadlineModal } from '@/components/ui/ExtendDeadlineModal';
import { SendAuditEmailModal } from '@/components/ui/SendAuditEmailModal';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/hooks/useUsers';
import { useToast } from '@/context/ToastContext';
import { AuditChecklistFormatka } from '@/components/audit/AuditChecklistFormatka';
import { useAccessTracker } from '@/hooks/useAccessTracker';
import { DocumentAccessHistoryModal } from '@/components/ui/DocumentAccessHistoryModal';

export default function AuditDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { fetchAuditById, enhanceDescription, addObservation, updateAuditStatus, deleteObservation, extendDueDate } = useAudits();
  const { user, isAdmin } = useAuth();
  const { users, fetchUsers } = useUsers();
  const { showToast, showConfirm } = useToast();

  const isOperatorOrEmployee = user?.role === 'OPERATOR' || user?.role === 'PRACOWNIK';
  const canSendEmail = isAdmin || (Boolean(user) && !isOperatorOrEmployee);
  
  const [audit, setAudit] = useState<Audit | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'checklist' | 'observations'>('checklist');

  useAccessTracker({
    entityType: 'AUDIT',
    entityId: resolvedParams.id,
    entityTitle: audit?.title || 'Audyt',
  });

  // Email & Actions Modal State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);

  // Zmienne do nowego spostrzeżenia
  const [isAdding, setIsAdding] = useState(false);
  const [rawDesc, setRawDesc] = useState('');
  const [aiDesc, setAiDesc] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [severity, setSeverity] = useState('');
  const [dueDateInput, setDueDateInput] = useState('');
  const [kaizenSubmittedBy, setKaizenSubmittedBy] = useState('');
  const [kaizenBenefits, setKaizenBenefits] = useState('');
  const [availableSeverities, setAvailableSeverities] = useState<{ id: string; name: string; color: string; isPositive: boolean }[]>([]);
  
  // Extension Modal State
  const [extendingObs, setExtendingObs] = useState<any | null>(null);

  // Image Viewer State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    loadAudit(true);
    fetchUsers();
    fetch('/api/observation-severities')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAvailableSeverities(data);
        }
      })
      .catch(console.error);
  }, [resolvedParams.id, fetchUsers]);

  const loadAudit = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const data = await fetchAuditById(resolvedParams.id);
      setAudit(data);
    } catch (error) {
      showToast('Nie udało się załadować audytu', 'error');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleEnhance = async () => {
    if (!rawDesc) return;
    setIsEnhancing(true);
    try {
      const improved = await enhanceDescription(rawDesc);
      setAiDesc(improved);
      showToast('Spostrzeżenie udoskonalone przez AI', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSaveObservation = async () => {
    if (!audit) return;
    if (!severity) {
      showToast('Musisz wybrać wagę zdarzenia przed zapisaniem!', 'error');
      return;
    }
    if (!rawDesc.trim() && !aiDesc.trim()) {
      showToast('Podaj opis spostrzeżenia przed zapisaniem!', 'error');
      return;
    }

    const sLower = severity.toLowerCase();
    const isKaizen = sLower.includes('udoskonalen') || sLower.includes('kaizen');
    const finalSubmittedBy = kaizenSubmittedBy.trim() || (user ? user.name : '');

    if (isKaizen) {
      if (!finalSubmittedBy) {
        showToast('Wpisz lub wybierz osobę, do której przypisujesz Kaizen!', 'error');
        return;
      }
      if (!kaizenBenefits.trim()) {
        showToast('Podaj oczekiwane korzyści z udoskonalenia!', 'error');
        return;
      }
    }

    try {
      await addObservation(audit.id, rawDesc, aiDesc, photoUrl || undefined, severity, dueDateInput || undefined);
      
      if (isKaizen) {
        const fullDesc = aiDesc || rawDesc;
        const titleText = fullDesc.length > 70 ? `${fullDesc.slice(0, 70)}...` : fullDesc;

        await fetch('/api/kaizen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: titleText,
            description: fullDesc,
            benefits: kaizenBenefits.trim(),
            submittedBy: finalSubmittedBy,
            areaId: audit.areaId,
            machineId: audit.machineId,
            photoUrl: photoUrl || undefined
          })
        });
        showToast('Zapisano wpis audytowy oraz automatycznie utworzono wniosek Kaizen!', 'success');
      } else {
        showToast('Zapisano spostrzeżenie!', 'success');
      }

      setRawDesc('');
      setAiDesc('');
      setPhotoUrl(null);
      setSeverity('');
      setDueDateInput('');
      setKaizenSubmittedBy('');
      setKaizenBenefits('');
      setIsAdding(false);
      loadAudit(false); // Odśwież listę spostrzeżeń po cichu
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleExtendDueDateSubmit = async (newDueDate: string, reason: string) => {
    if (!extendingObs) return;
    try {
      const operatorName = user ? user.name : 'Operator';
      await extendDueDate(extendingObs.id, newDueDate, reason, operatorName);
      showToast('Termin rozwiązania został przedłużony', 'success');
      loadAudit(false);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPhotoUrl(data.url);
      showToast('Zdjęcie wgrane', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCompleteAudit = () => {
    showConfirm({
      title: 'Zakończenie Audytu',
      message: 'Czy na pewno chcesz zakończyć ten audyt? Zostanie on oznaczony jako ukończony.',
      confirmText: 'Zakończ audyt',
      isDanger: false,
      onConfirm: async () => {
        try {
          await updateAuditStatus(resolvedParams.id, 'COMPLETED');
          showToast('Audyt został zakończony', 'success');
          router.push('/audyty');
        } catch (error) {
          showToast('Błąd podczas zakańczania audytu', 'error');
        }
      }
    });
  };

  const handleDelete = () => {
    showConfirm({
      title: 'Usuwanie Audytu',
      message: 'Czy na pewno chcesz bezpowrotnie usunąć ten audyt wraz ze wszystkimi spostrzeżeniami?',
      confirmText: 'Usuń audyt',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/audits/${resolvedParams.id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Błąd podczas usuwania audytu');
          showToast('Audyt został usunięty', 'success');
          router.push('/audyty');
        } catch (err: any) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  const handleExportCSV = () => {
    if (!audit) return;
    const headers = ['Audit ID', 'Tytuł Audytu', 'Typ Audytu', 'Rejon', 'Maszyna', 'Status Audytu', 'Data Utworzenia', 'Usterka ID', 'Opis Surowy', 'Opis AI', 'Ważność', 'Czy Naprawione', 'Naprawił', 'Data Naprawy', 'Komentarz Operatora'];
    
    let rows: string[][] = [];
    if (audit.observations && audit.observations.length > 0) {
      rows = audit.observations.map(obs => [
        audit.id,
        `"${audit.title.replace(/"/g, '""')}"`,
        audit.auditType?.name || 'Brak',
        `"${audit.area?.name || 'Brak'}"`,
        `"${audit.machine?.name || 'Brak'}"`,
        audit.status,
        new Date(audit.createdAt).toLocaleString('pl-PL'),
        obs.id,
        `"${obs.description.replace(/"/g, '""')}"`,
        `"${(obs.aiSuggestion || '').replace(/"/g, '""')}"`,
        obs.severity,
        obs.isFixed ? 'TAK' : 'NIE',
        `"${(obs.fixedBy || '').replace(/"/g, '""')}"`,
        obs.fixedAt ? new Date(obs.fixedAt).toLocaleString('pl-PL') : '',
        `"${(obs.operatorComment || '').replace(/"/g, '""')}"`
      ]);
    } else {
      rows = [[
        audit.id,
        `"${audit.title.replace(/"/g, '""')}"`,
        audit.auditType?.name || 'Brak',
        `"${audit.area?.name || 'Brak'}"`,
        `"${audit.machine?.name || 'Brak'}"`,
        audit.status,
        new Date(audit.createdAt).toLocaleString('pl-PL'),
        'BRAK USTEREK', '', '', '', '', '', '', ''
      ]];
    }

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `raport_audyt_${audit.id.substring(0,8)}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Raport CSV został pobrany', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-8 text-center animate-pulse print:hidden">Wczytywanie szczegółów audytu...</div>;
  if (!audit) return <div className="p-8 text-center text-red-500 print:hidden">Nie znaleziono audytu.</div>;

  const isCompleted = audit.status === 'COMPLETED';
  const canEdit = !isCompleted || isAdmin;

  return (
    <>
      <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto print:hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b pb-5 border-slate-200 dark:border-slate-800 gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                {audit.title}
              </h1>
              <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 ${
                audit.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800' :
                audit.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800' :
                'bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
              }`}>
                {audit.status === 'COMPLETED' ? '🔒 Audyt Zamknięty' : audit.status === 'IN_PROGRESS' ? 'W trakcie' : audit.status}
              </span>
            </div>

            {/* Single horizontal row containing Rejon, Maszyna, Typ & Zgłoszenia stats */}
            {(() => {
              const pendingCount = audit.observations?.filter(o => !o.isFixed && o.severity !== 'POSITIVE' && !o.severity?.includes('Dobra Praktyka')).length || 0;
              const fixedCount = audit.observations?.filter(o => o.isFixed && o.severity !== 'POSITIVE' && !o.severity?.includes('Dobra Praktyka')).length || 0;
              const positiveCount = audit.observations?.filter(o => o.severity === 'POSITIVE' || o.severity?.includes('Dobra Praktyka')).length || 0;

              return (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-slate-600 dark:text-slate-400">
                  <span>Rejon: <strong className="font-extrabold text-slate-800 dark:text-slate-200">{audit.area?.name || 'Brak'}</strong></span>
                  <span>•</span>
                  <span>Maszyna: <strong className="font-extrabold text-slate-800 dark:text-slate-200">{audit.machine?.name || 'Brak'}</strong></span>
                  {audit.auditType && (
                    <>
                      <span>•</span>
                      <span>Typ: <strong className="font-black text-brand-600 dark:text-brand-400">{audit.auditType.name}</strong></span>
                    </>
                  )}

                  <span className="text-slate-300 dark:text-slate-700 mx-1">|</span>

                  <span className="text-slate-400 uppercase text-[10px] tracking-wider">Zgłoszenia:</span>
                  <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-black ${pendingCount > 0 ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950 dark:text-amber-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                    Do naprawy: {pendingCount}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300">
                    Wykonane: {fixedCount}
                  </span>
                  {positiveCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-black bg-blue-100 text-blue-900 border border-blue-300 dark:bg-blue-950 dark:text-blue-300">
                      🌟 Dobre praktyki: {positiveCount}
                    </span>
                  )}
                </div>
              );
            })()}
          </div>
          
          {/* Main Action Bar & Hamburger Options Menu */}
          <div className="flex flex-wrap items-center gap-3 shrink-0 relative">
            {audit.status !== 'COMPLETED' ? (
              <>
                <button
                  type="button"
                  onClick={() => router.push('/audyty')}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer"
                >
                  Wróć (Zapisz roboczo)
                </button>
                <button
                  type="button"
                  onClick={handleCompleteAudit}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  ✅ Zakończ Audyt
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => router.push('/audyty')}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer"
              >
                ← Powrót do listy
              </button>
            )}

            {/* Hamburger Dropdown Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsActionsMenuOpen(!isActionsMenuOpen)}
                className={`px-3.5 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 border shadow-sm cursor-pointer ${
                  isActionsMenuOpen
                    ? 'bg-brand-600 text-white border-brand-700 shadow-md'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title="Otwórz menu akcji i narzędzi audytu"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span>Akcje i Opcje</span>
                <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isActionsMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Hamburger Popup Dropdown Menu */}
              {isActionsMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsActionsMenuOpen(false)}
                  />

                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-40 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Opcje i Narzędzia Audytu
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsActionsMenuOpen(false);
                        setIsHistoryModalOpen(true);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-900 dark:hover:text-amber-300 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <span className="text-base">👥</span>
                      <span>Kto zapoznał się z audytem</span>
                    </button>

                    {canSendEmail && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsActionsMenuOpen(false);
                          setIsEmailModalOpen(true);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-900 dark:hover:text-indigo-300 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <span className="text-base">✉️</span>
                        <span>Wyślij Raport E-mail</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setIsActionsMenuOpen(false);
                        handlePrint();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <span className="text-base">🖨️</span>
                      <span>Drukuj / Pobierz PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsActionsMenuOpen(false);
                        handleExportCSV();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-900 dark:hover:text-emerald-300 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <span className="text-base">📥</span>
                      <span>Eksportuj do CSV</span>
                    </button>

                    {isAdmin && (
                      <>
                        <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                        <button
                          type="button"
                          onClick={() => {
                            setIsActionsMenuOpen(false);
                            handleDelete();
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <span className="text-base">🗑️</span>
                          <span>Usuń ten audyt</span>
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mt-8 gap-2">
        <button
          onClick={() => setActiveTab('checklist')}
          className={`px-5 py-3 font-extrabold text-sm border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'checklist'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/20 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          📋 Formatka Pytań ({audit.auditType?.name || 'Standardowa'})
        </button>

        <button
          onClick={() => setActiveTab('observations')}
          className={`px-5 py-3 font-extrabold text-sm border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'observations'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/20 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          ⚠️ Zarejestrowane Spostrzeżenia ({audit.observations?.length || 0})
        </button>
      </div>

      {activeTab === 'checklist' ? (
        <div className="mt-6">
          <AuditChecklistFormatka auditId={audit.id} isReadOnly={!canEdit} onObservationAdded={() => loadAudit(false)} />
        </div>
      ) : (
        <div className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Zarejestrowane spostrzeżenia</h2>
            {canEdit && !isAdding && (
              <button 
                onClick={() => setIsAdding(true)}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg shadow-sm transition-colors text-sm font-medium flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Dodaj nowe
              </button>
            )}
          </div>

      {isAdmin && isAdding && (
        <section className="glass-card space-y-6 bg-brand-50 dark:bg-brand-900/10 border-brand-200 dark:border-brand-800">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-brand-700 dark:text-brand-400">Nowe spostrzeżenie</h3>
            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              Anuluj
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notatka / Opis</label>
              <textarea 
                value={rawDesc}
                onChange={e => setRawDesc(e.target.value)}
                placeholder="Co zauważyłeś?"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 outline-none min-h-[100px]"
              />
            </div>
            
            <button 
              type="button"
              onClick={handleEnhance}
              disabled={isEnhancing || !rawDesc}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white rounded-xl shadow-md transition-all font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              {isEnhancing ? 'Analiza AI...' : 'Popraw profesjonalnie (AI)'}
            </button>

            {aiDesc && (
              <div className="p-4 border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <h4 className="text-sm font-bold text-purple-700 dark:text-purple-300 mb-2">Opis wygenerowany:</h4>
                <p className="text-slate-700 dark:text-slate-300 text-sm">{aiDesc}</p>
              </div>
            )}

            {photoUrl && (
              <div className="mt-4">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Załączone zdjęcie:</p>
                <img src={photoUrl} alt="Podgląd" className="h-32 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
              </div>
            )}

            {(() => {
              const sLower = severity.toLowerCase();
              const isKaizenSeverity = sLower.includes('udoskonalen') || sLower.includes('kaizen');

              if (!isKaizenSeverity) return null;

              return (
                <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-700/80 rounded-xl space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-extrabold text-sm">
                    <span className="text-xl">💡</span>
                    <span>Automatyczny Wniosek Kaizen</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    Wybrano wagę "Propozycja Udoskonalenia". Uzupełnij pola poniżej — po zapisaniu wpisu automatycznie utworzy się nowy wniosek Kaizen w module Kaizen.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                        Do kogo przypisać / Pomysłodawca *
                      </label>
                      <select
                        value={kaizenSubmittedBy}
                        onChange={e => setKaizenSubmittedBy(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500 font-medium cursor-pointer"
                      >
                        <option value="">-- Wybierz użytkownika z systemu --</option>
                        {user && (
                          <option value={user.name}>Ja ({user.name})</option>
                        )}
                        {users.map(u => (
                          <option key={u.id} value={u.name}>
                            {u.name} ({u.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                        Oczekiwane korzyści z udoskonalenia *
                      </label>
                      <textarea
                        rows={2}
                        value={kaizenBenefits}
                        onChange={e => setKaizenBenefits(e.target.value)}
                        placeholder="np. Oszczędność czasu o 15 minut, poprawa ergonomii i bezpieczeństwa stanowiska"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div>
                <input 
                  type="file" 
                  accept="image/*" 
                  id="photo-upload-detail" 
                  className="hidden" 
                  onChange={handleFileUpload} 
                />
                <label 
                  htmlFor="photo-upload-detail" 
                  className="cursor-pointer px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  {isUploading ? 'Wgrywanie...' : (photoUrl ? 'Zmień zdjęcie' : 'Załącz zdjęcie')}
                </label>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">

                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Waga zdarzenia:</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className={`px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg text-sm outline-none focus:border-brand-500 font-medium ${
                      !severity ? 'border-amber-500 dark:border-amber-600 ring-2 ring-amber-500/20 text-amber-600 dark:text-amber-400 font-bold' : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    <option value="" disabled>-- Wybierz wagę zdarzenia (wymagane) --</option>
                    {availableSeverities.length > 0 ? (
                      availableSeverities.map(sev => (
                        <option key={sev.id} value={sev.name}>{sev.name}</option>
                      ))
                    ) : (
                      <>
                        <option value="🔴 Krytyczna Niezgodność">🔴 Krytyczna Niezgodność</option>
                        <option value="🟠 Umiarkowana Niezgodność">🟠 Umiarkowana Niezgodność</option>
                        <option value="🟡 Mało istotna zmiana">🟡 Mało istotna zmiana</option>
                        <option value="🟢 Dobra Praktyka (Pozytyw)">🟢 Dobra Praktyka (Pozytyw)</option>
                        <option value="💡 Propozycja Udoskonalenia (Kaizen)">💡 Propozycja Udoskonalenia (Kaizen)</option>
                      </>
                    )}
                  </select>
                </div>

                {(() => {
                  const sLower = severity.toLowerCase();
                  const isKaizenSeverity = sLower.includes('udoskonalen') || sLower.includes('kaizen');
                  const isFormValid = (!!rawDesc.trim() || !!aiDesc.trim()) && !!severity && (!isKaizenSeverity || (!!(kaizenSubmittedBy.trim() || user?.name) && !!kaizenBenefits.trim()));

                  return (
                    <button 
                      onClick={handleSaveObservation}
                      disabled={!isFormValid}
                      className={`px-6 py-2 rounded-lg font-bold transition-all shadow-sm ${
                        isFormValid 
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-emerald-600/30' 
                          : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-50'
                      }`}
                      title={!isFormValid ? 'Uzupełnij treść, wagę zdarzenia oraz pola Kaizen' : 'Zapisz wpis'}
                    >
                      Zapisz wpis
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="grid gap-4">
        {(!audit.observations || audit.observations.length === 0) ? (
          <div className="glass-card text-center text-slate-500 py-12">
            Ten audyt nie ma jeszcze żadnych spostrzeżeń.
          </div>
        ) : (
          audit.observations.map(obs => {
            const matchingSev = availableSeverities.find(s => s.name === obs.severity);
            const isPositiveObs = obs.severity === 'POSITIVE' || matchingSev?.isPositive || obs.severity?.includes('Dobra Praktyka') || obs.severity?.includes('Pozytyw') || obs.severity?.includes('Udoskonaleni');

            return (
              <div key={obs.id} className={`glass-card p-5 ${isPositiveObs ? 'border-l-4 border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/10' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {isPositiveObs ? (
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                        {obs.severity || '🌟 Dobra Praktyka'}
                      </span>
                    ) : (
                      <>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${obs.isFixed ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {obs.isFixed ? 'Naprawione' : 'Do naprawy'}
                        </span>
                        
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {obs.severity || 'Niezgodność'}
                        </span>
                      </>
                    )}
                  </div>
                <div className="flex flex-wrap items-center gap-2">
                  {obs.dueDate && (
                    <span className={`text-xs px-2.5 py-0.5 rounded-lg font-bold flex items-center gap-1 ${
                      new Date(obs.dueDate) < new Date() && !obs.isFixed
                        ? 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-950/80 dark:text-red-300 animate-pulse'
                        : 'bg-indigo-100 text-indigo-800 border border-indigo-300 dark:bg-indigo-950/80 dark:text-indigo-300'
                    }`}>
                      📅 Termin: {new Date(obs.dueDate).toLocaleDateString('pl-PL')}
                      {new Date(obs.dueDate) < new Date() && !obs.isFixed && ' ⚠️ PRZEKROCZONY'}
                    </span>
                  )}

                  {canEdit && !obs.isFixed && obs.severity !== 'POSITIVE' && (
                    <button
                      onClick={() => setExtendingObs(obs)}
                      className="text-xs font-bold px-2.5 py-0.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-all shadow-xs flex items-center gap-1"
                      title="Przedłuż termin z podaniem powodu"
                    >
                      <span>⏳ Przedłuż termin</span>
                    </button>
                  )}

                  <span className="text-xs text-slate-400">
                    {new Date(obs.createdAt).toLocaleString()}
                  </span>
                  {canEdit && isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        showConfirm({
                          title: 'Usuwanie Zgłoszenia',
                          message: 'Czy na pewno chcesz usunąć to zgłoszenie?',
                          confirmText: 'Usuń',
                          isDanger: true,
                          onConfirm: async () => {
                            await deleteObservation(obs.id, audit.id);
                            showToast('Zgłoszenie usunięte', 'success');
                          }
                        });
                      }}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                      title="Usuń zgłoszenie"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
                </div>
              </div>
              <p className="text-slate-800 dark:text-slate-100 font-medium">
                {obs.description}
              </p>
              {obs.photoUrl && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Zdjęcie z audytu:</p>
                  <button onClick={() => setSelectedImage(obs.photoUrl!)} className="block relative group focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-lg">
                    <img src={obs.photoUrl} alt="Zgłoszenie" className="h-32 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-opacity group-hover:opacity-80" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/20 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </button>
                </div>
              )}

              {obs.extensions && obs.extensions.length > 0 && (
                <div className="mt-4 p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-400 flex items-center gap-1.5">
                      📜 Historia przedłużeń terminu ({obs.extensions.length})
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    {obs.extensions.map((ext: any) => (
                      <li key={ext.id} className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-amber-100 dark:border-amber-900/40 shadow-xs">
                        <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 mb-0.5">
                          <span>
                            Termin: {ext.previousDueDate ? new Date(ext.previousDueDate).toLocaleDateString('pl-PL') : 'Brak'} ➔ <span className="text-amber-600 dark:text-amber-400 font-extrabold">{new Date(ext.newDueDate).toLocaleDateString('pl-PL')}</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {new Date(ext.createdAt).toLocaleString('pl-PL')} przez <strong className="text-slate-600 dark:text-slate-300">{ext.requestedBy}</strong>
                          </span>
                        </div>
                        <div className="text-slate-600 dark:text-slate-400 italic">
                          Powód: "{ext.reason}"
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {obs.isFixed && obs.severity !== 'POSITIVE' && (
                <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400 mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Potwierdzenie Naprawy
                  </h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-1">
                    <span className="font-semibold">Naprawione przez:</span> {obs.fixedBy || 'Brak danych'}
                  </p>
                  {obs.fixedAt && (
                    <p className="text-xs text-slate-500 mb-3">
                      Data naprawy: {new Date(obs.fixedAt).toLocaleString()}
                    </p>
                  )}
                  {obs.operatorComment && (
                    <div className="mb-3 p-3 bg-white dark:bg-slate-800 rounded border border-emerald-100 dark:border-emerald-800/50">
                      <p className="text-xs text-slate-500 font-bold uppercase mb-1">Komentarz operatora:</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{obs.operatorComment}"</p>
                    </div>
                  )}
                  {obs.fixPhotoUrl && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Zdjęcie po naprawie:</p>
                      <button onClick={() => setSelectedImage(obs.fixPhotoUrl!)} className="block relative group focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg">
                        <img src={obs.fixPhotoUrl} alt="Naprawa" className="h-32 object-cover rounded-lg border border-emerald-300 dark:border-emerald-700 shadow-sm transition-opacity group-hover:opacity-80" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/20 rounded-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
      </div>
      </div>
      )}

      <ImageModal 
        isOpen={!!selectedImage} 
        imageUrl={selectedImage || ''} 
        onClose={() => setSelectedImage(null)} 
      />
    </div>

    {/* Szablon Raportu Drukarskiego / PDF dla konkretnego Audytu */}
    {(() => {
      const printAttachments: { num: number; obsIndex: number; title: string; type: string; url: string; desc: string }[] = [];
      let attachmentCounter = 0;

      if (audit.observations) {
        audit.observations.forEach((obs, idx) => {
          if (obs.photoUrl) {
            attachmentCounter++;
            printAttachments.push({
              num: attachmentCounter,
              obsIndex: idx + 1,
              title: `ZAŁĄCZNIK NR ${attachmentCounter}`,
              type: 'Zdjęcie z Audytu (Usterka / Obserwacja)',
              url: obs.photoUrl,
              desc: obs.aiSuggestion || obs.description
            });
          }
          if (obs.fixPhotoUrl) {
            attachmentCounter++;
            printAttachments.push({
              num: attachmentCounter,
              obsIndex: idx + 1,
              title: `ZAŁĄCZNIK NR ${attachmentCounter}`,
              type: 'Zdjęcie po naprawie (Potwierdzenie)',
              url: obs.fixPhotoUrl,
              desc: obs.operatorComment || `Potwierdzenie wykonania naprawy usterki #${idx + 1}`
            });
          }
        });
      }

      return (
        <div className="hidden print:block p-8 bg-white text-black font-sans max-w-4xl mx-auto space-y-6 border-2 border-black">
          <div className="flex justify-between items-center border-b-2 border-black pb-4">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-wider">Raport z Audytu</h1>
              <p className="text-sm font-bold text-gray-700 mt-1">{audit.title}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold">ID: #{audit.id.substring(0, 8).toUpperCase()}</p>
              <p className="text-xs text-gray-600">Data: {new Date(audit.createdAt).toLocaleDateString('pl-PL')}</p>
            </div>
          </div>

          <table className="w-full border-collapse border border-black text-sm">
            <tbody>
              <tr>
                <td className="border border-black p-2 font-bold bg-gray-100 w-1/4">Rejon:</td>
                <td className="border border-black p-2 font-semibold w-1/4">{audit.area?.name || 'Brak'}</td>
                <td className="border border-black p-2 font-bold bg-gray-100 w-1/4">Maszyna:</td>
                <td className="border border-black p-2 w-1/4">{audit.machine?.name || 'Brak'}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold bg-gray-100">Typ Audytu:</td>
                <td className="border border-black p-2">{audit.auditType?.name || 'Standardowy'}</td>
                <td className="border border-black p-2 font-bold bg-gray-100">Status:</td>
                <td className="border border-black p-2 font-bold uppercase">{audit.status}</td>
              </tr>
            </tbody>
          </table>

          <div className="space-y-4">
            <h2 className="text-lg font-black uppercase border-b border-black pb-1">Lista Zarejestrowanych Spostrzeżeń ({audit.observations?.length || 0})</h2>
            {(!audit.observations || audit.observations.length === 0) ? (
              <p className="text-sm italic text-gray-600">Brak zarejestrowanych usterek w tym audycie.</p>
            ) : (
              audit.observations.map((obs, idx) => {
                const obsAuditPhotoAtt = printAttachments.find(a => a.obsIndex === idx + 1 && a.type.includes('Audytu'));
                const obsFixPhotoAtt = printAttachments.find(a => a.obsIndex === idx + 1 && a.type.includes('naprawie'));

                return (
                  <div key={obs.id} className="border border-black p-3 space-y-2 break-inside-avoid">
                    <div className="flex justify-between items-center bg-gray-100 p-1.5 border-b border-black text-xs font-bold">
                      <span># {idx + 1}. WAŻNOŚĆ: [{obs.severity}]</span>
                      <span>STATUS: [{obs.isFixed ? 'NAPRAWIONE' : 'DO NAPRAWY'}]</span>
                    </div>
                    <p className="text-sm font-semibold">{obs.description}</p>
                    {obs.isFixed && (
                      <div className="text-xs text-gray-700">
                        <strong>Naprawione przez:</strong> {obs.fixedBy || 'N.N.'} {obs.fixedAt ? `(${new Date(obs.fixedAt).toLocaleDateString('pl-PL')})` : ''}
                        {obs.operatorComment && <div><strong>Komentarz:</strong> {obs.operatorComment}</div>}
                      </div>
                    )}

                    {/* Odnotowane Odnośniki do Załączników Fotograficznych */}
                    {obsAuditPhotoAtt && (
                      <div className="mt-2 text-xs font-bold text-black bg-gray-100 p-1.5 border border-black flex justify-between items-center">
                        <span>📷 ZAZNACZONY ZAŁĄCZNIK FOTOGRAFICZNY: {obsAuditPhotoAtt.title}</span>
                        <span className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">(Pełne zdjęcie w sekcji Załączników)</span>
                      </div>
                    )}
                    {obsFixPhotoAtt && (
                      <div className="mt-1 text-xs font-bold text-black bg-gray-100 p-1.5 border border-black flex justify-between items-center">
                        <span>📷 ZAZNACZONY ZAŁĄCZNIK Z NAPRAWY: {obsFixPhotoAtt.title}</span>
                        <span className="text-[10px] uppercase tracking-wider text-gray-600 font-semibold">(Pełne zdjęcie w sekcji Załączników)</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
            <div className="border-t border-black pt-2 font-bold">
              Podpis Audytora
            </div>
            <div className="border-t border-black pt-2 font-bold">
              Podpis Szefa Jakości / Managera
            </div>
          </div>

          {/* Sekcja Podpisu Elektronicznego i Rejestru Zapoznania się */}
          <div className="pt-6 space-y-2 border-t-2 border-black break-inside-avoid">
            <div className="border border-black p-3 bg-gray-50 space-y-1">
              <div className="font-bold text-xs uppercase tracking-wider flex justify-between">
                <span>✒️ KLAUZULA PODPISU ELEKTRONICZNEGO I WGLĄDU DO DOKUMENTU</span>
                <span>SYSTEM CYFROWY AUDYT</span>
              </div>
              <p className="text-[11px] text-gray-800 leading-snug font-medium">
                Zgodnie z wewnętrznym regulaminem, zidentyfikowany login użytkownika <strong>{user?.name || user?.login || 'Użytkownik Systemu'}</strong> (@{user?.login || 'login'}) otwierający i przeglądający niniejszy raport stanowi prawnie wiążący podpis elektroniczny potwierdzający zapoznanie się z treścią dokumentu, ustaleniami audytu oraz przypisanymi działaniami naprawczymi. Zdarzenie zostało automatycznie zewidencjonowane w historii dostępów.
              </p>
            </div>
          </div>

          {/* Sekcja Pełnoskalowych Załączników Fotograficznych na Końcu Raportu */}
          {printAttachments.length > 0 && (
            <div className="pt-12 space-y-6 border-t-2 border-black break-before-page">
              <div className="text-center border-b-2 border-black pb-3">
                <h2 className="text-xl font-black uppercase tracking-wider">ZAŁĄCZNIKI FOTOGRAFICZNE DO AUDYTU</h2>
                <p className="text-xs text-gray-600 font-semibold mt-0.5">Pełnoskalowa dokumentacja fotograficzna (Łącznie załączników: {printAttachments.length})</p>
              </div>

              <div className="space-y-8">
                {printAttachments.map(att => (
                  <div key={att.num} className="border-2 border-black p-4 space-y-3 break-inside-avoid bg-white">
                    <div className="flex justify-between items-center bg-gray-200 p-2 border-b border-black font-black text-sm uppercase">
                      <span>{att.title}</span>
                      <span>Dotyczy Spostrzeżenia #{att.obsIndex} [{att.type}]</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-800">
                      <strong>Opis / Kontekst:</strong> {att.desc}
                    </p>
                    <div className="flex justify-center p-3 bg-gray-50 border border-gray-300">
                      <img 
                        src={att.url} 
                        alt={att.title} 
                        className="max-h-[550px] max-w-full w-auto object-contain border border-black shadow-sm" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    })()}
      <ExtendDeadlineModal
        isOpen={!!extendingObs}
        onClose={() => setExtendingObs(null)}
        currentDueDate={extendingObs?.dueDate}
        onExtend={handleExtendDueDateSubmit}
      />
      {audit && (
        <SendAuditEmailModal
          isOpen={isEmailModalOpen}
          auditId={audit.id}
          auditTitle={audit.title}
          onClose={() => setIsEmailModalOpen(false)}
          onSuccess={(msg) => showToast(msg, 'success')}
        />
      )}
      {audit && (
        <DocumentAccessHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          entityType="AUDIT"
          entityId={audit.id}
          entityTitle={audit.title}
        />
      )}
    </>
  );
}
