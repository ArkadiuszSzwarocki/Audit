'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { downloadFaultReportEml } from '@/utils/faultReportEmailBuilder';

interface Area { id: string; name: string; machines: { id: string; name: string }[] }
interface User { id: string; name: string; email: string | null }

const SEVERITIES = [
  { value: 'CRITICAL', label: '🔴 Krytyczna', desc: 'Zatrzymanie produkcji / zagrożenie BHP' },
  { value: 'MODERATE', label: '🟡 Umiarkowana', desc: 'Ogranicza pracę, wymaga szybkiej naprawy' },
  { value: 'MINOR',    label: '🟢 Mało istotna', desc: 'Drobna usterka, nie blokuje pracy' },
];

export default function NowaUsterkaPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [areas, setAreas] = useState<Area[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('MODERATE');
  const [areaId, setAreaId] = useState('');
  const [machineId, setMachineId] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notifyEmails, setNotifyEmails] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const selectedArea = areas.find(a => a.id === areaId);
  const machines = selectedArea?.machines ?? [];

  useEffect(() => {
    fetch('/api/areas?withMachines=true')
      .then(r => r.json())
      .then(data => setAreas(Array.isArray(data) ? data : []))
      .catch(console.error);

    fetch('/api/users')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setUsers(data);
          // Pre-fill notify emails from assigned user
        }
      })
      .catch(console.error);
  }, []);

  // Auto-fill notify email when assignedTo changes
  useEffect(() => {
    const assignedUser = users.find(u => u.id === assignedToId);
    if (assignedUser?.email) {
      setNotifyEmails(prev => {
        const existing = prev.split(',').map(e => e.trim()).filter(Boolean);
        if (!existing.includes(assignedUser.email!)) {
          return [...existing, assignedUser.email!].join(', ');
        }
        return prev;
      });
    }
  }, [assignedToId, users]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      showToast('Tytuł i opis są wymagane', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/fault-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          severity,
          reportedBy: user?.name ?? 'Anonimowy',
          photoUrl,
          notifyEmails: notifyEmails.trim() || null,
          dueDate: dueDate || null,
          areaId: areaId || null,
          machineId: machineId || null,
          assignedToId: assignedToId || null,
        }),
      });
      const created = await res.json();
      if (!res.ok) throw new Error(created.error);

      showToast('Zgłoszenie usterki zapisane!', 'success');

      // Auto-send EML notification if emails provided
      if (notifyEmails.trim()) {
        const baseUrl = window.location.origin;
        const assignedUser = users.find(u => u.id === assignedToId);
        const area = areas.find(a => a.id === areaId);
        const machine = machines.find(m => m.id === machineId);

        downloadFaultReportEml(
          {
            id: created.id,
            title: created.title,
            description: created.description,
            severity: created.severity,
            reportedBy: created.reportedBy,
            dueDate: created.dueDate,
            areaName: area?.name,
            machineName: machine?.name,
            assignedToName: assignedUser?.name,
            photoUrl,
          },
          notifyEmails.trim(),
          baseUrl
        );
      }

      router.push('/usterki');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="border-b pb-4 border-slate-200 dark:border-slate-800">
        <button
          onClick={() => router.push('/usterki')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-3 transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Wróć do listy
        </button>
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          🔧 Nowe Zgłoszenie Usterki
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Uzupełnij formularz — po zapisaniu zostanie automatycznie wysłane powiadomienie email.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Severity selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Waga usterki *
          </label>
          <div className="grid grid-cols-3 gap-3">
            {SEVERITIES.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => setSeverity(s.value)}
                className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  severity === s.value
                    ? s.value === 'CRITICAL' ? 'border-red-500 bg-red-50 dark:bg-red-950/40'
                    : s.value === 'MODERATE' ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/40'
                    : 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                }`}
              >
                <div className="font-bold text-sm">{s.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Tytuł usterki *
          </label>
          <input
            type="text"
            required
            placeholder="np. Wyciek oleju przy maszynie CNC-3"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Opis usterki *
          </label>
          <textarea
            required
            rows={3}
            placeholder="Opisz dokładnie co się dzieje, gdzie i od kiedy..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Area + Machine */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Obszar / Rejon
            </label>
            <select
              value={areaId}
              onChange={e => { setAreaId(e.target.value); setMachineId(''); }}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">— wybierz —</option>
              {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Maszyna / Linia
            </label>
            <select
              value={machineId}
              onChange={e => setMachineId(e.target.value)}
              disabled={!areaId}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
            >
              <option value="">— wybierz maszynę —</option>
              {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        </div>

        {/* Assigned + Due Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Przypisz do osoby
            </label>
            <select
              value={assignedToId}
              onChange={e => setAssignedToId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">— nieprzypisane —</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Termin naprawy
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Photo */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Zdjęcie usterki
          </label>
          {photoUrl ? (
            <div className="flex items-center gap-3">
              <img src={photoUrl} alt="Zdjęcie usterki" className="w-20 h-20 object-cover rounded-xl border border-slate-200" />
              <button type="button" onClick={() => setPhotoUrl(null)} className="text-xs text-red-500 hover:text-red-700 cursor-pointer">Usuń</button>
            </div>
          ) : (
            <label className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:border-brand-400 transition-colors">
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-slate-500">{isUploading ? 'Wgrywanie...' : 'Kliknij aby dodać zdjęcie'}</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={isUploading} />
            </label>
          )}
        </div>

        {/* Notify Emails */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            📧 Powiadom e-mailem (oddziel przecinkami)
          </label>
          <input
            type="text"
            placeholder="np. kierownik@zaklad.pl, serwis@zaklad.pl"
            value={notifyEmails}
            onChange={e => setNotifyEmails(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
          />
          {notifyEmails.trim() && (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
              ✅ Po zapisaniu zostanie automatycznie pobrany plik .eml — otwórz go w Outlooku i wyślij.
            </p>
          )}
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => router.push('/usterki')}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Anuluj
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            {loading ? (
              <><span className="animate-spin">⏳</span> Zapisywanie...</>
            ) : (
              <><span>🔧</span> Zapisz Zgłoszenie</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
