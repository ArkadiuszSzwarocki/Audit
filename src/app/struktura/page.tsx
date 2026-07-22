'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStructure } from '@/hooks/useStructure';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';

export default function StructurePage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showToast, showConfirm } = useToast();
  const { areas, machines, loading, error, addArea, addMachine, deleteArea, deleteMachine } = useStructure();
  
  const [newAreaName, setNewAreaName] = useState('');
  const [newMachineName, setNewMachineName] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState('');

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, authLoading, router]);

  const handleAddArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAreaName) return;
    try {
      await addArea(newAreaName);
      showToast('Rejon dodany pomyślnie!', 'success');
      setNewAreaName('');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleAddMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMachineName || !selectedAreaId) return;
    try {
      await addMachine(newMachineName, selectedAreaId);
      showToast('Maszyna dodana pomyślnie!', 'success');
      setNewMachineName('');
      setSelectedAreaId('');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Ładowanie struktury...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Błąd: {error}</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 border-b pb-4 border-slate-200 dark:border-slate-800">
        Zarządzanie Strukturą Zakładu
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Rejony */}
        <section className="glass-card">
          <h2 className="text-xl font-semibold mb-4 text-brand-600 dark:text-brand-400">Rejony</h2>
          
          <form onSubmit={handleAddArea} className="flex gap-2 mb-6">
            <input 
              type="text" 
              placeholder="Nazwa nowego rejonu" 
              value={newAreaName}
              onChange={e => setNewAreaName(e.target.value)}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 outline-none"
            />
            <button type="submit" className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors font-medium">
              Dodaj
            </button>
          </form>

          <ul className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {areas.length === 0 ? <li className="text-slate-500 italic">Brak rejonów</li> : null}
            {areas.map(area => (
              <li key={area.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50 flex justify-between items-center">
                <div>
                  <span className="font-medium text-slate-700 dark:text-slate-200">{area.name}</span>
                  <span className="ml-2 text-xs text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                    Maszyn: {machines.filter(m => m.areaId === area.id).length}
                  </span>
                </div>
                <button
                  onClick={() => {
                    showConfirm({
                      title: 'Usuwanie Rejonu',
                      message: `Czy na pewno chcesz usunąć rejon "${area.name}" wraz ze wszystkimi jego przypisanymi maszynami?`,
                      confirmText: 'Usuń rejon',
                      isDanger: true,
                      onConfirm: async () => {
                        await deleteArea(area.id);
                        showToast('Rejon usunięty', 'success');
                      }
                    });
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                  title="Usuń rejon"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Maszyny */}
        <section className="glass-card">
          <h2 className="text-xl font-semibold mb-4 text-emerald-600 dark:text-emerald-400">Maszyny</h2>
          
          <form onSubmit={handleAddMachine} className="flex flex-col gap-2 mb-6">
            <input 
              type="text" 
              placeholder="Nazwa nowej maszyny" 
              value={newMachineName}
              onChange={e => setNewMachineName(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <div className="flex gap-2">
              <select 
                value={selectedAreaId}
                onChange={e => setSelectedAreaId(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="" disabled>Wybierz rejon</option>
                {areas.map(area => (
                  <option key={area.id} value={area.id}>{area.name}</option>
                ))}
              </select>
              <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors font-medium">
                Dodaj
              </button>
            </div>
          </form>

          <ul className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {machines.length === 0 ? <li className="text-slate-500 italic">Brak maszyn</li> : null}
            {machines.map(machine => {
              const area = areas.find(a => a.id === machine.areaId);
              return (
                <li key={machine.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-700 dark:text-slate-200">{machine.name}</span>
                    <span className="text-xs text-slate-500 mt-0.5">Rejon: {area?.name || 'Nieznany'}</span>
                  </div>
                  <button
                    onClick={() => {
                      showConfirm({
                        title: 'Usuwanie Maszyny',
                        message: `Czy na pewno chcesz usunąć maszynę "${machine.name}"?`,
                        confirmText: 'Usuń maszynę',
                        isDanger: true,
                        onConfirm: async () => {
                          await deleteMachine(machine.id);
                          showToast('Maszyna usunięta', 'success');
                        }
                      });
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                    title="Usuń maszynę"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
