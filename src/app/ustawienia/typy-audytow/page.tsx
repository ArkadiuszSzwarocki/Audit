'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

import { useToast } from '@/context/ToastContext';

interface AuditType {
  id: string;
  name: string;
  description: string | null;
}

export default function AuditTypesSettings() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const { showToast, showConfirm } = useToast();
  
  const [types, setTypes] = useState<AuditType[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  
  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit-types');
      if(res.ok) {
        const data = await res.json();
        setTypes(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    try {
      const res = await fetch('/api/audit-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, description: newDesc }),
      });
      if(res.ok) {
        showToast('Nowy typ audytu dodany', 'success');
        setNewName('');
        setNewDesc('');
        setIsAdding(false);
        fetchTypes();
      } else {
        const data = await res.json();
        showToast(data.error || 'Błąd podczas dodawania typu audytu', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Wystąpił błąd podczas dodawania typu audytu', 'error');
    }
  };

  const handleDelete = (id: string) => {
    showConfirm({
      title: 'Usuwanie Typu Audytu',
      message: 'Czy na pewno chcesz usunąć ten typ audytu?',
      confirmText: 'Usuń typ',
      isDanger: true,
      onConfirm: async () => {
        const res = await fetch(`/api/audit-types/${id}`, { method: 'DELETE' });
        if(res.ok) {
          showToast('Typ audytu został usunięty', 'success');
          fetchTypes();
        } else {
          showToast('Wystąpił błąd podczas usuwania', 'error');
        }
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Typy Audytów</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Zarządzaj dostępnymi typami audytów (np. HACCP, GMP+, IFS)</p>
        </div>
        
        {isAdmin && !isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg shadow-sm font-medium transition-colors"
          >
            Dodaj nowy typ
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="glass-card p-6 border-brand-200 dark:border-brand-800">
          <h2 className="text-lg font-bold mb-4">Nowy typ audytu</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nazwa (np. HACCP, 5S)</label>
              <input 
                autoFocus
                type="text" 
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Opis (opcjonalnie)</label>
              <textarea 
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 h-24"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
              >
                Anuluj
              </button>
              <button 
                type="submit"
                className="px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-md font-bold"
              >
                Zapisz
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center p-8">Ładowanie...</div>
      ) : (
        <div className="grid gap-4">
          {types.length === 0 ? (
            <div className="text-center p-8 glass-card text-slate-500">
              Brak zdefiniowanych typów audytów.
            </div>
          ) : (
            types.map(t => (
              <div key={t.id} className="glass-card p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="font-bold text-lg text-brand-700 dark:text-brand-400">{t.name}</h3>
                  {t.description && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{t.description}</p>}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => router.push(`/ustawienia/typy-audytow/${t.id}/pytania`)}
                    className="px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-indigo-200 dark:border-indigo-800"
                  >
                    📋 Formatka Pytań
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="px-3 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Usuń
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
