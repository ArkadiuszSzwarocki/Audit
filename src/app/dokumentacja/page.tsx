'use client';

import { useEffect, useState } from 'react';
import { useDocuments } from '@/hooks/useDocuments';
import { useStructure } from '@/hooks/useStructure';
import { DocumentModal } from '@/components/ui/DocumentModal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';

export default function DocumentationPage() {
  const { documents, loading, fetchDocuments, addDocument } = useDocuments();
  const { areas, machines, loading: structLoading } = useStructure();
  const { isAdmin } = useAuth();
  const { showToast, showConfirm } = useToast();

  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [url, setUrl] = useState('');
  const [areaId, setAreaId] = useState('');
  const [machineId, setMachineId] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments(documents.length === 0);
  }, [fetchDocuments, documents.length]);

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
      setUrl(data.url);
      showToast('Plik wgrany pomyślnie', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !category || !url) {
      showToast('Wypełnij wszystkie pola i wgraj plik!', 'error');
      return;
    }
    try {
      await addDocument({
        title,
        category,
        url,
        areaId: areaId || undefined,
        machineId: machineId || undefined
      });
      setIsAdding(false);
      setTitle('');
      setCategory('');
      setUrl('');
      setAreaId('');
      setMachineId('');
      showToast('Dokument dodany!', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // prevent opening modal
    showConfirm({
      title: 'Usuwanie Dokumentu',
      message: 'Czy na pewno chcesz usunąć ten dokument?',
      confirmText: 'Usuń dokument',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Błąd podczas usuwania dokumentu');
          showToast('Dokument został usunięty', 'success');
          fetchDocuments();
        } catch (err: any) {
          showToast(err.message, 'error');
        }
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex justify-between items-center border-b pb-4 border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            Baza Wiedzy i Dokumentacja
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Zarządzaj standardami 5S, procedurami GMP i instrukcjami stanowiskowymi.
          </p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-md transition-all font-medium"
        >
          {isAdding ? 'Anuluj dodawanie' : 'Dodaj dokument'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="glass-card space-y-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Nowy dokument</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tytuł dokumentu</label>
              <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="np. Standard 5S - Mycie" className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kategoria</label>
              <select required value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="" disabled>Wybierz kategorię</option>
                <option value="5S">Standardy 5S</option>
                <option value="GMP">Zasady GMP / Higiena</option>
                <option value="BHP">Instrukcje BHP</option>
                <option value="INSTRUKCJA">Instrukcja Obsługi (Maszyny)</option>
                <option value="INNE">Inne</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Plik (PDF / Obraz)</label>
              <div className="flex items-center gap-4">
                <input 
                  type="file" 
                  accept=".pdf,image/*" 
                  id="doc-upload" 
                  className="hidden" 
                  onChange={handleFileUpload} 
                />
                <label 
                  htmlFor="doc-upload" 
                  className="cursor-pointer px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  {isUploading ? 'Wgrywanie...' : 'Wybierz plik z komputera'}
                </label>
                {url && <span className="text-sm text-emerald-600 font-medium">Plik załączony poprawnie!</span>}
              </div>
            </div>
            
            {/* Opcjonalne przypisanie */}
            <div className="md:col-span-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-500 mb-2">Opcjonalnie: Przypisz do lokalizacji</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Rejon</label>
                  <select value={areaId} onChange={e => { setAreaId(e.target.value); setMachineId(''); }} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none">
                    <option value="">(Globalny / Brak)</option>
                    {!structLoading && areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Maszyna</label>
                  <select value={machineId} onChange={e => setMachineId(e.target.value)} disabled={!areaId} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none disabled:opacity-50">
                    <option value="">(Brak / Cały rejon)</option>
                    {!structLoading && machines.filter(m => m.areaId === areaId).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          <button type="submit" className="w-full py-3 mt-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors">
            Zapisz dokument
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center p-8">Ładowanie dokumentacji...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {documents.length === 0 ? (
            <div className="col-span-2 text-center text-slate-500 py-12 glass-card">
              Baza wiedzy jest pusta.
            </div>
          ) : (
            documents.map(doc => (
              <div 
                key={doc.id} 
                onClick={() => setSelectedDocument(doc.url)}
                className="group flex flex-col bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer text-left w-full"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-md">
                    {doc.category}
                  </span>
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <button 
                        onClick={(e) => handleDelete(e, doc.id)}
                        className="text-red-400 hover:text-red-600 p-1 transition-colors"
                        title="Usuń dokument"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {doc.title}
                </h3>
                
                {(doc.area || doc.machine) ? (
                  <p className="text-xs text-slate-500 mt-auto pt-4 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {doc.area?.name} {doc.machine ? `> ${doc.machine.name}` : ''}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 mt-auto pt-4 flex items-center gap-1 italic">
                    Dokument globalny
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <DocumentModal 
        isOpen={!!selectedDocument} 
        documentUrl={selectedDocument} 
        onClose={() => setSelectedDocument(null)} 
      />
    </div>
  );
}
