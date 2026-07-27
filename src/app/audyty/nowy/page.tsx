'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStructure } from '@/hooks/useStructure';
import { useAudits } from '@/hooks/useAudits';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';

export default function NewAuditPage() {
  const router = useRouter();
  const { isAdmin, loading: authLoading } = useAuth();
  const { areas, machines, loading: structLoading } = useStructure();
  const { createAudit, enhanceDescription, addObservation } = useAudits();
  const { showToast } = useToast();

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/audyty');
    }
  }, [isAdmin, authLoading, router]);

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedMachine, setSelectedMachine] = useState('');
  const [selectedAuditType, setSelectedAuditType] = useState('');
  
  const [auditTypes, setAuditTypes] = useState<{id: string, name: string}[]>([]);
  
  useEffect(() => {
    fetch('/api/audit-types')
      .then(res => res.json())
      .then(data => setAuditTypes(data))
      .catch(console.error);
  }, []);
  
  const [auditId, setAuditId] = useState<string | null>(null);

  const handleStartAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArea) return;
    try {
      const title = `Audyt ${selectedAuditType ? `${auditTypes.find(t => t.id === selectedAuditType)?.name || ''} ` : ''}z dnia ${new Date().toLocaleDateString('pl-PL')} godz. ${new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}`;
      const audit = await createAudit(selectedArea, selectedMachine || undefined, selectedAuditType || undefined, title);
      showToast('Audyt został pomyślnie rozpoczęty!', 'success');
      router.push(`/audyty/${audit.id}`);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  if (structLoading) return <div className="p-8 text-center animate-pulse">Wczytywanie struktury...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 border-b pb-4 border-slate-200 dark:border-slate-800">
        Kreator Nowego Audytu
      </h1>

      <section className="glass-card">
        <h2 className="text-xl font-semibold mb-6 text-brand-600 dark:text-brand-400">Krok 1: Wybór obszaru i typu</h2>
        <form onSubmit={handleStartAudit} className="space-y-6">
          <div className="p-4 bg-slate-100/90 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/70 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">Tytuł audytu i Rodzaj</p>
              <p className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-0.5 flex items-center gap-2">
                <span>
                  Audyt {selectedAuditType ? `${auditTypes.find(t => t.id === selectedAuditType)?.name || ''} ` : ''}z dnia {new Date().toLocaleDateString('pl-PL')} godz. {new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </p>
            </div>
            {selectedAuditType && (
              <span className="text-xs font-black px-3 py-1 bg-brand-600 text-white rounded-lg shadow-sm uppercase tracking-wide">
                Rodzaj: {auditTypes.find(t => t.id === selectedAuditType)?.name}
              </span>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Typ audytu (opcjonalnie)</label>
            <select 
              value={selectedAuditType}
              onChange={e => setSelectedAuditType(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 outline-none"
            >
              <option value="">Standardowy (bez przypisanego typu)</option>
              {auditTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rejon</label>
            <select 
              required
              value={selectedArea}
              onChange={e => { setSelectedArea(e.target.value); setSelectedMachine(''); }}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 outline-none"
            >
              <option value="" disabled>Wybierz rejon...</option>
              {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          {selectedArea && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Maszyna (opcjonalnie)</label>
              <select 
                value={selectedMachine}
                onChange={e => setSelectedMachine(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 outline-none"
              >
                <option value="">Wszystkie / Brak konkretnej</option>
                {machines.filter(m => m.areaId === selectedArea).map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}

          <button type="submit" className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-lg transition-all font-bold text-lg mt-4 flex items-center justify-center gap-2">
            Zapisz jako draft i dodaj zgłoszenia
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </form>
      </section>
    </div>
  );
}
