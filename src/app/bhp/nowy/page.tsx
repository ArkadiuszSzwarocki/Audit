'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { ImageUploadWithCamera } from '@/components/ui/ImageUploadWithCamera';
import { UserEmailPicker } from '@/components/ui/UserEmailPicker';

interface Area { id: string; name: string; machines: { id: string; name: string }[] }
interface User { id: string; name: string; email: string | null }

const CATEGORIES = [
  { value: 'NEAR_MISS', label: '⚠️ Near Miss (Zdarzenie potencjalnie wypadkowe)', desc: 'Sytuacja, w której o mało nie doszło do wypadku' },
  { value: 'UNSAFE_COND', label: '🛠️ Niebezpieczne Warunki Pracy', desc: 'Uszkodzony sprzęt, wyciek, brak osłon, śliska nawierzchnia' },
  { value: 'UNSAFE_BEHAVIOR', label: '🚷 Niebezpieczne Zachowanie', desc: 'Praca niezgodnie z instrukcją BHP, omijanie zabezpieczeń' },
  { value: 'FIRE_HAZARD', label: '🔥 Zagrożenie Pożarowe', desc: 'Zastawione drogi ewakuacyjne, gaśnice, iskry' },
  { value: 'PPE', label: '🥽 Brak lub Uszkodzenie ŚOI', desc: 'Brak okularów, rękawic, obuwia ochronnego' },
  { value: 'OTHER', label: '❓ Inne Zagrożenie BHP / Inna Sytuacja', desc: 'Pozostałe zagrożenia i incydenty BHP niewymienione powyżej' },
];

const SEVERITIES = [
  { value: 'CRITICAL', label: '🔴 Wysokie Ryzyko', desc: 'Bezpośrednie zagrożenie życia lub zdrowia' },
  { value: 'MODERATE', label: '🟡 Średnie Ryzyko', desc: 'Może prowadzić do urazu lub skaleczenia' },
  { value: 'LOW',      label: '🟢 Niskie Ryzyko', desc: 'Drobne odstępstwo od zasad BHP' },
];

export default function NoweZgloszenieBhpPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [areas, setAreas] = useState<Area[]>([]);
  const [machinesList, setMachinesList] = useState<{ id: string; name: string }[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reportedBy, setReportedBy] = useState('');
  const [category, setCategory] = useState('');
  const [probability, setProbability] = useState<number | ''>('');
  const [injurySeverity, setInjurySeverity] = useState<number | ''>('');
  const [areaId, setAreaId] = useState('');
  const [machineId, setMachineId] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notifyEmails, setNotifyEmails] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Dynamic risk calculation
  const pVal = typeof probability === 'number' ? probability : 1;
  const cVal = typeof injurySeverity === 'number' ? injurySeverity : 1;
  const riskScore = pVal * cVal;
  const severity = riskScore <= 6 ? 'LOW' : riskScore <= 14 ? 'MODERATE' : 'CRITICAL';
  const riskLevel = riskScore <= 6 ? 'LOW' : riskScore <= 14 ? 'MEDIUM' : 'HIGH';

  useEffect(() => {
    if (user && !reportedBy) {
      setReportedBy(user.name || user.login || '');
    }
  }, [user, reportedBy]);

  useEffect(() => {
    fetch('/api/areas?withMachines=true')
      .then((r) => r.json())
      .then((data) => setAreas(Array.isArray(data) ? data : []))
      .catch(console.error);

    fetch('/api/users')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!areaId) {
      setMachinesList([]);
      setMachineId('');
      return;
    }
    const selectedArea = areas.find((a) => a.id === areaId);
    if (selectedArea?.machines && selectedArea.machines.length > 0) {
      setMachinesList(selectedArea.machines);
    } else {
      fetch(`/api/machines?areaId=${areaId}`)
        .then((r) => r.json())
        .then((data) => setMachinesList(Array.isArray(data) ? data : []))
        .catch(() => setMachinesList([]));
    }
  }, [areaId, areas]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);
    if (!title.trim() || !description.trim() || !reportedBy.trim()) {
      showToast('Wypełnij wszystkie wymagane pola zaznaczone na czerwono!', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/bhp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          severity,
          probability,
          injurySeverity,
          riskScore,
          riskLevel,
          reportedBy: reportedBy.trim() || user?.name || user?.login || 'Pracownik',
          photoUrl,
          notifyEmails: notifyEmails.trim() || null,
          dueDate: dueDate || null,
          areaId: areaId || null,
          machineId: machineId || null,
          assignedToId: assignedToId || null,
        }),
      });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || resJson.message || 'Błąd zapisu zgłoszenia BHP');
      const created = resJson.data || resJson;

      showToast('Zgłoszenie zagrożenia BHP zostało zarejestrowane z Twoją wstępną oceną ryzyka!', 'success');
      router.push('/bhp');
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
          onClick={() => router.push('/bhp')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-3 transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Wróć do rejestru BHP
        </button>
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          🛡️ Zgłoszenie Zagrożenia BHP / Near Miss
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Rejestracja zdarzeń potencjalnie wypadkowych, niebezpiecznych warunków i zagrożeń w zakładzie.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Category selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Kategoria Zagrożenia BHP *
          </label>
          <div className="space-y-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={`w-full p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex items-start gap-3 ${
                  category === c.value
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                }`}
              >
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex-1">
                  {c.label}
                  <div className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">{c.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Initial Risk Assessment Matrix */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              📊 Wstępna Ocena Ryzyka Zgłaszającego (Matryca P × C) *
            </label>
            <span className={`px-3 py-1 text-xs font-black rounded-xl border shadow-2xs ${
              riskLevel === 'LOW' ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200' :
              riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200' :
              'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-200'
            }`}>
              Wynik Ryzyka: {riskScore} / 25 ({riskLevel === 'LOW' ? '🟢 NISKIE RYZYKO' : riskLevel === 'MEDIUM' ? '🟡 ŚREDNIE RYZYKO' : '🔴 WYSOKIE RYZYKO'})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Jak często zagrożenie występuje / może wystąpić? (P: 1-5) *
              </label>
              <select
                value={probability}
                onChange={(e) => setProbability(e.target.value ? Number(e.target.value) : '')}
                className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 outline-none transition-all cursor-pointer ${
                  hasAttemptedSubmit && probability === ''
                    ? 'border-red-500 ring-2 ring-red-500/30 bg-red-50/50 dark:bg-red-950/30'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-orange-500'
                }`}
              >
                <option value="">— Wybierz prawdopodobieństwo (1-5) —</option>
                <option value={1}>1 - Znikome (raz w roku / rzadko)</option>
                <option value={2}>2 - Małe (raz w miesiącu)</option>
                <option value={3}>3 - Średnie (raz w tygodniu)</option>
                <option value={4}>4 - Duże (raz dziennie)</option>
                <option value={5}>5 - Bardzo duże (ciągłe / stałe)</option>
              </select>
              {hasAttemptedSubmit && probability === '' && (
                <p className="text-[10px] font-bold text-red-500 mt-1">⚠️ Wybierz prawdopodobieństwo!</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Potencjalna ciężkość skutków urazu (C: 1-5) *
              </label>
              <select
                value={injurySeverity}
                onChange={(e) => setInjurySeverity(e.target.value ? Number(e.target.value) : '')}
                className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 outline-none transition-all cursor-pointer ${
                  hasAttemptedSubmit && injurySeverity === ''
                    ? 'border-red-500 ring-2 ring-red-500/30 bg-red-50/50 dark:bg-red-950/30'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-orange-500'
                }`}
              >
                <option value="">— Wybierz ciężkość urazu (1-5) —</option>
                <option value={1}>1 - Znikoma (brak urazu / pierwsza pomoc)</option>
                <option value={2}>2 - Mała (lekkie skaleczenie / stłuczenie)</option>
                <option value={3}>3 - Średnia (uraz / zwolnienie L4)</option>
                <option value={4}>4 - Duża (ciężki uszczerbek na zdrowiu)</option>
                <option value={5}>5 - Krytyczna (zagrożenie życia / wypadkowe)</option>
              </select>
              {hasAttemptedSubmit && injurySeverity === '' && (
                <p className="text-[10px] font-bold text-red-500 mt-1">⚠️ Wybierz ciężkość skutków!</p>
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
            ℹ️ Po zgłoszeniu Inspektor BHP / Komisja zweryfikuje Twoją wstępną ocenę podczas analizy i w razie potrzeby zatwierdzi lub skoryguje skala zagrożenia.
          </p>
        </div>

        {/* ReportedBy */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Zgłaszający (Imię i Nazwisko z loginu) *
          </label>
          <input
            type="text"
            required
            placeholder="Jan Kowalski"
            value={reportedBy}
            onChange={(e) => setReportedBy(e.target.value)}
            className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 border rounded-xl text-sm outline-none font-bold transition-all ${
              hasAttemptedSubmit && !reportedBy.trim()
                ? 'border-red-500 ring-2 ring-red-500/30 bg-red-50/50 dark:bg-red-950/30'
                : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-orange-500'
            }`}
          />
          {hasAttemptedSubmit && !reportedBy.trim() && (
            <p className="text-xs font-bold text-red-500 mt-1 flex items-center gap-1">
              ⚠️ Pole "Zgłaszający" jest wymagane!
            </p>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Tytuł Zagrożenia *
          </label>
          <input
            type="text"
            required
            placeholder="np. Odkryty przewód elektryczny przy prasie P-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 border rounded-xl text-sm outline-none transition-all ${
              hasAttemptedSubmit && !title.trim()
                ? 'border-red-500 ring-2 ring-red-500/30 bg-red-50/50 dark:bg-red-950/30'
                : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-orange-500'
            }`}
          />
          {hasAttemptedSubmit && !title.trim() && (
            <p className="text-xs font-bold text-red-500 mt-1 flex items-center gap-1">
              ⚠️ Pole "Tytuł Zagrożenia" jest wymagane!
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Opis Zagrożenia / Zdarzenia BHP *
          </label>
          <textarea
            required
            rows={3}
            placeholder="Opisz jak doszło do zdarzenia, jakie były okoliczności oraz jakie jest ryzyko urazu..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 border rounded-xl text-sm outline-none transition-all ${
              hasAttemptedSubmit && !description.trim()
                ? 'border-red-500 ring-2 ring-red-500/30 bg-red-50/50 dark:bg-red-950/30'
                : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-orange-500'
            }`}
          />
          {hasAttemptedSubmit && !description.trim() && (
            <p className="text-xs font-bold text-red-500 mt-1 flex items-center gap-1">
              ⚠️ Pole "Opis Zagrożenia" jest wymagane!
            </p>
          )}
        </div>

        {/* Area + Machine */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Obszar / Rejon
            </label>
            <select
              value={areaId}
              onChange={(e) => {
                setAreaId(e.target.value);
                setMachineId('');
              }}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">— wybierz obszar —</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Maszyna / Stanowisko
            </label>
            <select
              value={machineId}
              onChange={(e) => setMachineId(e.target.value)}
              disabled={!areaId}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
            >
              <option value="">— wybierz maszynę —</option>
              {machinesList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Assigned User */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Inspektor BHP / Odpowiedzialny
          </label>
          <select
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">— wyznaczenie osoby lub wybór z listy —</option>
            {users.map((u: any) => (
              <option key={u.id} value={u.id}>
                👤 {u.name} {u.role ? `(${u.role})` : ''}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400 mt-1">
            ℹ️ Termin eliminacji zagrożenia zostanie określony przez przypisanego inspektora BHP.
          </p>
        </div>

        <UserEmailPicker
          value={notifyEmails}
          onChange={setNotifyEmails}
          users={users}
          selectedAreaId={areaId}
          moduleType="BHP"
          label="📧 Powiadomienie e-mailem (Wybór z bazy lub własny adres)"
        />

        <ImageUploadWithCamera
          label="Zdjęcie zagrożenia BHP / dowód"
          value={photoUrl}
          onChange={(url) => setPhotoUrl(url)}
        />

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => router.push('/bhp')}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Anuluj
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span> Zapisywanie...
              </>
            ) : (
              <>
                <span>🛡️</span> Zarejestruj Zgłoszenie BHP
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
