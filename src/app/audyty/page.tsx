'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAudits, Audit } from '@/hooks/useAudits';
import { useAuth } from '@/hooks/useAuth';
import { useStructure } from '@/hooks/useStructure';
import { useToast } from '@/context/ToastContext';
import { SendAuditEmailModal } from '@/components/ui/SendAuditEmailModal';

export default function AuditsPage() {
  const { audits, loading, fetchAudits } = useAudits();
  const { isAdmin } = useAuth();
  const { areas } = useStructure();
  const { showToast } = useToast();

  const [emailModalAudit, setEmailModalAudit] = useState<{ id: string; title: string } | null>(null);
  const [auditTypes, setAuditTypes] = useState<{id: string, name: string}[]>([]);
  
  // Stany filtrów
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterAreaId, setFilterAreaId] = useState('');
  const [filterTypeId, setFilterTypeId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Stan zaznaczonych audytów do eksportu masowego
  const [selectedAuditIds, setSelectedAuditIds] = useState<string[]>([]);

  useEffect(() => {
    fetchAudits(true);
    fetch('/api/audit-types')
      .then(res => res.json())
      .then(data => setAuditTypes(data))
      .catch(console.error);
  }, [fetchAudits]);

  const filteredAudits = useMemo(() => {
    return audits.filter(audit => {
      let match = true;
      
      if (filterAreaId && audit.area?.name !== areas.find(a => a.id === filterAreaId)?.name) {
        match = false;
      }
      
      if (filterTypeId && audit.auditType?.id !== filterTypeId) {
        match = false;
      }
      
      if (filterStatus && audit.status !== filterStatus) {
        match = false;
      }
      
      if (filterDateFrom) {
        if (new Date(audit.createdAt) < new Date(filterDateFrom)) match = false;
      }
      
      if (filterDateTo) {
        const toDate = new Date(filterDateTo);
        toDate.setHours(23, 59, 59, 999);
        if (new Date(audit.createdAt) > toDate) match = false;
      }
      
      return match;
    });
  }, [audits, filterAreaId, filterTypeId, filterStatus, filterDateFrom, filterDateTo, areas]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedAuditIds(filteredAudits.map(a => a.id));
    } else {
      setSelectedAuditIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedAuditIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const exportSelectedToCSV = () => {
    const targetAudits = audits.filter(a => selectedAuditIds.includes(a.id));
    if (targetAudits.length === 0) {
      showToast('Wybierz co najmniej jeden audyt do eksportu', 'error');
      return;
    }

    const headers = ['Audit ID', 'Tytuł Audytu', 'Typ Audytu', 'Rejon', 'Maszyna', 'Status Audytu', 'Data Utworzenia', 'Liczba Spostrzeżeń'];
    
    const rows = targetAudits.map(a => [
      a.id,
      `"${a.title.replace(/"/g, '""')}"`,
      a.auditType?.name || 'Brak',
      `"${a.area?.name || 'Brak'}"`,
      `"${a.machine?.name || 'Brak'}"`,
      a.status,
      new Date(a.createdAt).toLocaleString('pl-PL'),
      (a.observations?.length || 0).toString()
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `eksport_zaznaczonych_audytow_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Pobrano CSV dla ${targetAudits.length} zaznaczonych audytów`, 'success');
  };

  const handlePrintSelected = () => {
    if (selectedAuditIds.length === 0) {
      showToast('Wybierz co najmniej jeden audyt do wydruku', 'error');
      return;
    }
    window.print();
  };

  const resetFilters = () => {
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterAreaId('');
    setFilterTypeId('');
    setFilterStatus('');
  };

  const selectedAuditsList = useMemo(() => {
    return audits.filter(a => selectedAuditIds.includes(a.id));
  }, [audits, selectedAuditIds]);

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto print:hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 border-slate-200 dark:border-slate-800 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
              Lista Audytów
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">
              Otwórz wybrany audyt, aby przeprowadzić inspekcję, drukować lub wyeksportować szczegółowy raport.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link href="/audyty/nowy" className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md transition-all font-bold text-sm whitespace-nowrap flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Rozpocznij nowy audyt
              </Link>
            )}
          </div>
        </div>

        {/* Pasek Akcji Masowych dla Zaznaczonych Audytów */}
        {selectedAuditIds.length > 0 && (
          <div className="p-4 bg-brand-900/90 border border-brand-500/40 text-white rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-4 animate-in slide-in-from-top-3 duration-300">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center font-bold text-sm">
                {selectedAuditIds.length}
              </span>
              <span className="font-semibold text-sm">Zaznaczono {selectedAuditIds.length} audyt(y/ów)</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrintSelected}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Drukuj / PDF zaznaczonych
              </button>
              <button
                onClick={exportSelectedToCSV}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Eksport zaznaczonych (CSV)
              </button>
              <button
                onClick={() => setSelectedAuditIds([])}
                className="px-3 py-2 text-slate-300 hover:text-white text-xs font-semibold underline cursor-pointer"
              >
                Odznacz wszystkie
              </button>
            </div>
          </div>
        )}

        {/* Panel filtrów */}
        <div className="glass-card p-4 space-y-4 border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center border-b pb-3 border-slate-100 dark:border-slate-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Opcje filtrowania</h2>
            <button onClick={resetFilters} className="text-xs text-brand-600 hover:text-brand-700 font-semibold underline cursor-pointer">
              Resetuj filtry
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Data od</label>
              <input 
                type="date" 
                value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Data do</label>
              <input 
                type="date" 
                value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Rejon</label>
              <select 
                value={filterAreaId}
                onChange={e => setFilterAreaId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none"
              >
                <option value="">Wszystkie</option>
                {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Typ</label>
              <select 
                value={filterTypeId}
                onChange={e => setFilterTypeId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none"
              >
                <option value="">Wszystkie</option>
                {auditTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Status</label>
              <select 
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none"
              >
                <option value="">Wszystkie</option>
                <option value="DRAFT">Draft</option>
                <option value="IN_PROGRESS">W trakcie</option>
                <option value="COMPLETED">Zakończone</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center text-sm text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <input 
              type="checkbox"
              id="selectAll"
              checked={filteredAudits.length > 0 && selectedAuditIds.length === filteredAudits.length}
              onChange={handleSelectAll}
              className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer"
            />
            <label htmlFor="selectAll" className="cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
              Zaznacz wszystkie ({filteredAudits.length})
            </label>
          </div>
          <span>Wyświetlam: {filteredAudits.length} z {audits.length} audytów</span>
        </div>

        {loading ? (
          <div className="text-center p-8 animate-pulse text-slate-400 font-bold">Ładowanie audytów...</div>
        ) : (
          <div className="grid gap-4">
            {filteredAudits.length === 0 ? (
              <div className="glass-card text-center text-slate-500 py-12">
                Brak audytów spełniających kryteria.
              </div>
            ) : (
              filteredAudits.map(audit => (
                <div key={audit.id} className={`glass-card flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all border ${
                  selectedAuditIds.includes(audit.id) ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-900/10' : 'border-slate-200 dark:border-slate-800'
                }`}>
                  <div className="flex items-start gap-4">
                    <input 
                      type="checkbox"
                      checked={selectedAuditIds.includes(audit.id)}
                      onChange={() => handleToggleSelect(audit.id)}
                      className="mt-1.5 w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 cursor-pointer"
                    />
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center flex-wrap gap-2">
                        {audit.title}
                        {audit.auditType && (
                          <span className="text-xs bg-brand-600 text-white px-2.5 py-0.5 rounded-lg uppercase tracking-wide font-black border border-brand-400 shadow-sm">
                            Rodzaj: {audit.auditType.name}
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">
                        Rejon: <span className="font-medium text-slate-700 dark:text-slate-300">{audit.area?.name}</span> | Maszyna: <span className="font-medium text-slate-700 dark:text-slate-300">{audit.machine?.name || 'Brak'}</span> | Data: {new Date(audit.createdAt).toLocaleDateString()}
                      </p>

                      {(() => {
                        const pendingCount = audit.observations?.filter(o => !o.isFixed && o.severity !== 'POSITIVE' && !o.severity?.includes('Dobra Praktyka')).length || 0;
                        const fixedCount = audit.observations?.filter(o => o.isFixed && o.severity !== 'POSITIVE' && !o.severity?.includes('Dobra Praktyka')).length || 0;
                        const positiveCount = audit.observations?.filter(o => o.severity === 'POSITIVE' || o.severity?.includes('Dobra Praktyka')).length || 0;

                        return (
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className={`text-xs px-2.5 py-0.5 rounded-md font-bold ${pendingCount > 0 ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                              Do naprawy: {pendingCount}
                            </span>
                            <span className="text-xs px-2.5 py-0.5 rounded-md font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300">
                              Wykonane: {fixedCount}
                            </span>
                            {positiveCount > 0 && (
                              <span className="text-xs px-2.5 py-0.5 rounded-md font-bold bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-950/80 dark:text-blue-300">
                                🌟 Pozytywy: {positiveCount}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Icon Actions Bar */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 ml-8 md:ml-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      audit.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 
                      audit.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800' : 
                      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}>
                      {audit.status === 'COMPLETED' ? '✅ Zakończony' : audit.status === 'IN_PROGRESS' ? '⚙️ W trakcie' : '📝 Draft'}
                    </span>

                    {/* Email Icon Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setEmailModalAudit({ id: audit.id, title: audit.title });
                      }}
                      className="p-2 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      title="Wyślij e-mail z raportem audytu"
                    >
                      📧
                    </button>

                    {/* Open Audit Icon Link Button */}
                    <Link 
                      href={`/audyty/${audit.id}`} 
                      className="p-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center cursor-pointer"
                      title="Otwórz ten audyt"
                    >
                      🔍
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {emailModalAudit && (
        <SendAuditEmailModal
          isOpen={!!emailModalAudit}
          auditId={emailModalAudit.id}
          auditTitle={emailModalAudit.title}
          onClose={() => setEmailModalAudit(null)}
          onSuccess={(msg) => showToast(msg, 'success')}
        />
      )}

      {/* Szablon Drukarski dla Masowego Wydruku Zaznaczonych Audytów */}
      <div className="hidden print:block p-8 bg-white text-black font-sans max-w-4xl mx-auto space-y-8">
        <div className="border-b-2 border-black pb-4 text-center">
          <h1 className="text-2xl font-black uppercase">Zestawienie Audytów Zakładowych</h1>
          <p className="text-xs text-gray-600 mt-1">Wygenerowano: {new Date().toLocaleDateString('pl-PL')}</p>
        </div>

        {selectedAuditsList.map((audit, idx) => (
          <div key={audit.id} className="border-2 border-black p-6 space-y-4 page-break-inside-avoid">
            <div className="flex justify-between items-center border-b border-black pb-2">
              <h2 className="text-lg font-black uppercase"># {idx + 1}. {audit.title}</h2>
              <span className="text-xs font-bold border border-black px-2 py-0.5 uppercase">[{audit.status}]</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><strong>Rejon:</strong> {audit.area?.name || 'Brak'}</div>
              <div><strong>Maszyna:</strong> {audit.machine?.name || 'Brak'}</div>
              <div><strong>Typ:</strong> {audit.auditType?.name || 'Standardowy'}</div>
              <div><strong>Data:</strong> {new Date(audit.createdAt).toLocaleDateString('pl-PL')}</div>
            </div>

            <div className="pt-2">
              <p className="text-xs font-bold uppercase border-b border-gray-400 mb-2">Zarejestrowane Usterki ({audit.observations?.length || 0}):</p>
              {(!audit.observations || audit.observations.length === 0) ? (
                <p className="text-xs italic text-gray-600">Brak zgłoszonych usterek.</p>
              ) : (
                <ul className="space-y-1 text-xs">
                  {audit.observations.map((obs, oIdx) => (
                    <li key={obs.id} className="p-1 bg-gray-50 border border-gray-300">
                      <strong>{oIdx + 1}. [{obs.severity}]</strong> {obs.description} - <em>Status: {obs.isFixed ? 'Naprawiono' : 'Do naprawy'}</em>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
