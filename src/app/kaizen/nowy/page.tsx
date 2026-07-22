'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useKaizen } from '@/hooks/useKaizen';
import { useStructure } from '@/hooks/useStructure';
import { useToast } from '@/context/ToastContext';
import { downloadKaizenEml } from '@/utils/kaizenEmailBuilder';

export default function NewKaizenPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createKaizen } = useKaizen();
  const { areas, machines, loading: structLoading } = useStructure();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [benefits, setBenefits] = useState('');
  const [submittedBy, setSubmittedBy] = useState('');
  const [areaId, setAreaId] = useState('');
  const [machineId, setMachineId] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [notifyEmails, setNotifyEmails] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const qTitle = searchParams.get('title');
    const qDesc = searchParams.get('description');
    if (qTitle) setTitle(qTitle);
    if (qDesc) setDescription(qDesc);
  }, [searchParams]);

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
      showToast('Zdjęcie wgrane pomyślnie', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !submittedBy) return;
    
    setIsSubmitting(true);
    try {
      const created = await createKaizen({
        title,
        description,
        benefits,
        submittedBy,
        areaId: areaId || undefined,
        machineId: machineId || undefined,
        photoUrl: photoUrl || undefined,
      });
      showToast('Pomysł zgłoszony pomyślnie!', 'success');

      // Auto-send EML notification if emails provided
      if (notifyEmails.trim()) {
        const baseUrl = window.location.origin;
        const area = areas.find(a => a.id === areaId);
        const machine = machines.find(m => m.id === machineId);

        downloadKaizenEml(
          {
            id: created.id ?? 'kaizen',
            title: title.trim(),
            description: description.trim(),
            benefits: benefits.trim() || null,
            submittedBy: submittedBy.trim(),
            areaName: area?.name,
            machineName: machine?.name,
            photoUrl: photoUrl || null,
          },
          notifyEmails.trim(),
          baseUrl
        );
      }

      router.push('/kaizen');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Zgłoś pomysł Kaizen</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">Opisz swój pomysł na usprawnienie procesu, poprawę bezpieczeństwa lub redukcję kosztów.</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Twoje Imię i Nazwisko</label>
          <input required type="text" value={submittedBy} onChange={e => setSubmittedBy(e.target.value)} placeholder="Jan Kowalski" className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Krótki tytuł pomysłu</label>
          <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="np. Montaż lustra na skrzyżowaniu wózków" className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Opis problemu i rozwiązanie</label>
          <textarea required value={description} onChange={e => setDescription(e.target.value)} placeholder="Obecnie jest tak, a proponuję zrobić to w ten sposób..." className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 outline-none min-h-[120px]" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Korzyści (Co zyskamy?)</label>
          <textarea value={benefits} onChange={e => setBenefits(e.target.value)} placeholder="np. Szybsze przezbrojenie, większe bezpieczeństwo..." className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 outline-none min-h-[80px]" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Załącznik (Zdjęcie problemu lub szkic rozwiązania)</label>
          <div className="flex items-center gap-4">
            <input 
              type="file" 
              accept="image/*" 
              id="kaizen-upload" 
              className="hidden" 
              onChange={handleFileUpload} 
            />
            <label 
              htmlFor="kaizen-upload" 
              className="cursor-pointer px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              {isUploading ? 'Wgrywanie...' : 'Wybierz zdjęcie'}
            </label>
            {photoUrl && <span className="text-sm text-emerald-600 font-medium">Zdjęcie załączone poprawnie!</span>}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-bold text-slate-500 mb-3">Opcjonalnie: Gdzie wdrożyć pomysł?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Rejon / Hala</label>
              <select value={areaId} onChange={e => { setAreaId(e.target.value); setMachineId(''); }} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none text-sm">
                <option value="">Wybierz rejon</option>
                {!structLoading && areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Maszyna (opcjonalnie)</label>
              <select value={machineId} onChange={e => setMachineId(e.target.value)} disabled={!areaId} className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none text-sm disabled:opacity-50">
                <option value="">Wybierz maszynę</option>
                {!structLoading && machines.filter(m => m.areaId === areaId).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            📧 Powiadom e-mailem (oddziel przecinkami, np. komisja kaizen, kierownik)
          </label>
          <input
            type="text"
            placeholder="np. komisja.kaizen@zaklad.pl, kierownik@zaklad.pl"
            value={notifyEmails}
            onChange={e => setNotifyEmails(e.target.value)}
            className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
          />
          {notifyEmails.trim() && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
              💡 Po zgłoszeniu zostanie automatycznie pobrany plik .eml z powiadomieniem Kaizen do wysłania w Outlooku.
            </p>
          )}
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full py-4 mt-6 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-lg shadow-md transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Zgłaszanie...' : 'Zgłoś pomysł!'}
        </button>
      </form>
    </div>
  );
}
