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
  { value: 'PRODUCT_DEFECT', label: '📦 Wada Wyrobu Gotowego / Półproduktu', desc: 'Wada estetyczna, wymiarowa lub uszkodzenie fizyczne' },
  { value: 'RAW_MATERIAL', label: '🧪 Niezgodność Surowca / Opakowania', desc: 'Dostawa surowca niezgodna ze specyfikacją' },
  { value: 'PROCESS_DEVIATION', label: '⚙️ Odchylenie Procesu Technologicznego', desc: 'Przekroczenie temperatur, ciśnienia lub czasu mieszania' },
  { value: 'PACKAGING', label: '🏷️ Błąd Etykiety / Opakowania', desc: 'Błędny kod kreskowy, data ważności lub oznaczenie alergenów' },
  { value: 'CUSTOMER_COMPLAINT', label: '🗣️ Reklamacja Klienta / Powiadomienie Zewnętrzne', desc: 'Zgłoszenie wady przez klienta lub kontrolę jakości' },
  { value: 'OTHER', label: '❓ Inne Niezgodności / Zgłoszenie Niestandardowe', desc: 'Pozostałe odchylenia jakościowe i proceduralne niewymienione powyżej' },
];

const SEVERITIES = [
  { value: 'CRITICAL', label: '🔴 Krytyczna (Blokada Wysyłki)', desc: 'Zagrożenie bezpieczeństwa produktu lub wymogów prawnych' },
  { value: 'MODERATE', label: '🟡 Średnia Niezgodność', desc: 'Wymaga selekcji, naprawy lub zgody na odstępstwo' },
  { value: 'MINOR',    label: '🟢 Drobne Odchylenie', desc: 'Drobna wada niewpływająca na funkcjonowanie' },
];

export default function NoweZgloszenieJakosciowePage() {
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
  const [detectionScore, setDetectionScore] = useState<number | ''>('');
  const [severityScore, setSeverityScore] = useState<number | ''>('');
  const [batchNumber, setBatchNumber] = useState('');
  const [quantityAffected, setQuantityAffected] = useState('');
  const [areaId, setAreaId] = useState('');
  const [machineId, setMachineId] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [notifyEmails, setNotifyEmails] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Dynamic Quality risk calculation
  const dVal = typeof detectionScore === 'number' ? detectionScore : 1;
  const sVal = typeof severityScore === 'number' ? severityScore : 1;
  const qualityRiskScore = dVal * sVal;
  const severity = qualityRiskScore <= 6 ? 'MINOR' : qualityRiskScore <= 14 ? 'MODERATE' : 'CRITICAL';
  const qualityRiskLevel = qualityRiskScore <= 6 ? 'LOW' : qualityRiskScore <= 14 ? 'MEDIUM' : 'HIGH';

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
      const res = await fetch('/api/jakosc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          severity,
          batchNumber: batchNumber.trim() || null,
          quantityAffected: quantityAffected.trim() || null,
          reportedBy: reportedBy.trim() || user?.name || user?.login || 'Kontroler Jakości / Operator',
          photoUrl,
          notifyEmails: notifyEmails.trim() || null,
          areaId: areaId || null,
          machineId: machineId || null,
          assignedToId: assignedToId || null,
        }),
      });
      const created = await res.json();
      if (!res.ok) throw new Error(created.error);

      showToast('Zgłoszenie jakościowe zostało zarejestrowane z Twoją wstępną oceną ryzyka!', 'success');
      router.push('/jakosc');
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
          onClick={() => router.push('/jakosc')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-3 transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Wróć do rejestru jakościowego
        </button>
        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          📦 Zgłoszenie Niezgodności Jakościowej
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Rejestracja wad wyrobów, odchyleń surowcowych i problemów jakościowych z akcjami CAPA.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Category selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Kategoria Niezgodności *
          </label>
          <div className="space-y-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={`w-full p-3 rounded-xl border-2 text-left transition-all cursor-pointer flex items-start gap-3 ${
                  category === c.value
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40'
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

        {/* Interactive Initial Quality Risk Assessment Matrix */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              📊 Wstępna Ocena Ryzyka Jakościowego Zgłaszającego (Matryca D × S) *
            </label>
            <span className={`px-3 py-1 text-xs font-black rounded-xl border shadow-2xs ${
              qualityRiskLevel === 'LOW' ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200' :
              qualityRiskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200' :
              'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-200'
            }`}>
              Wynik Ryzyka: {qualityRiskScore} / 25 ({qualityRiskLevel === 'LOW' ? '🟢 DROBNE ODCHYLENIE' : qualityRiskLevel === 'MEDIUM' ? '🟡 ŚREDNIA NIEZGODNOŚĆ' : '🔴 KRYTYCZNA NIEZGODNOŚĆ'})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Wykrywalność Wady na Linii (D: 1-5) *
              </label>
              <select
                value={detectionScore}
                onChange={(e) => setDetectionScore(e.target.value ? Number(e.target.value) : '')}
                className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 outline-none transition-all cursor-pointer ${
                  hasAttemptedSubmit && detectionScore === ''
                    ? 'border-red-500 ring-2 ring-red-500/30 bg-red-50/50 dark:bg-red-950/30'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-purple-500'
                }`}
              >
                <option value="">— Wybierz trudność wykrycia wady (D: 1-5) —</option>
                <option value={1}>1 - Bardzo łatwa (automatyczna na linii)</option>
                <option value={2}>2 - Łatwa (Standardowa kontrola organoleptyczna)</option>
                <option value={3}>3 - Średnia (Wykrywalna w lab / próby)</option>
                <option value={4}>4 - Trudna (Słabo widoczna)</option>
                <option value={5}>5 - Bardzo trudna (Niewykrywalna / Klient)</option>
              </select>
              {hasAttemptedSubmit && detectionScore === '' && (
                <p className="text-[10px] font-bold text-red-500 mt-1">⚠️ Wybierz trudność wykrycia!</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                Wpływ na Klienta / Jakość Produktu (S: 1-5) *
              </label>
              <select
                value={severityScore}
                onChange={(e) => setSeverityScore(e.target.value ? Number(e.target.value) : '')}
                className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 outline-none transition-all cursor-pointer ${
                  hasAttemptedSubmit && severityScore === ''
                    ? 'border-red-500 ring-2 ring-red-500/30 bg-red-50/50 dark:bg-red-950/30'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-purple-500'
                }`}
              >
                <option value="">— Wybierz wpływ na jakość produktu (S: 1-5) —</option>
                <option value={1}>1 - Znikomy (Drobny błąd estetyczny)</option>
                <option value={2}>2 - Mały (Lekkie odstępstwo nieistotne)</option>
                <option value={3}>3 - Średni (Utrudnienie / Przerób)</option>
                <option value={4}>4 - Duży (Reklamacja / Zastopowanie wysyłki)</option>
                <option value={5}>5 - Krytyczny (Wycofanie z rynku / Bezpieczeństwo)</option>
              </select>
              {hasAttemptedSubmit && severityScore === '' && (
                <p className="text-[10px] font-bold text-red-500 mt-1">⚠️ Wybierz wpływ na jakość!</p>
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
            ℹ️ Po zgłoszeniu Dział Kontroli Jakości zweryfikuje Twoją wstępną ocenę podczas analizy CAPA i w razie potrzeby zatwierdzi lub skoryguje poziom istotności.
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
                : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-purple-500'
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
            Tytuł Niezgodności *
          </label>
          <input
            type="text"
            required
            placeholder="np. Przekroczony poziom wilgotności surowca A-102"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 border rounded-xl text-sm outline-none transition-all ${
              hasAttemptedSubmit && !title.trim()
                ? 'border-red-500 ring-2 ring-red-500/30 bg-red-50/50 dark:bg-red-950/30'
                : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-purple-500'
            }`}
          />
          {hasAttemptedSubmit && !title.trim() && (
            <p className="text-xs font-bold text-red-500 mt-1 flex items-center gap-1">
              ⚠️ Pole "Tytuł Niezgodności" jest wymagane!
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Opis Niezgodności / Szczegóły Wady *
          </label>
          <textarea
            required
            rows={3}
            placeholder="Opisz dokładnie wykrytą wadę, parametry próbki lub zastrzeżenia dotyczące wyrobu..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 border rounded-xl text-sm outline-none transition-all ${
              hasAttemptedSubmit && !description.trim()
                ? 'border-red-500 ring-2 ring-red-500/30 bg-red-50/50 dark:bg-red-950/30'
                : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-purple-500'
            }`}
          />
          {hasAttemptedSubmit && !description.trim() && (
            <p className="text-xs font-bold text-red-500 mt-1 flex items-center gap-1">
              ⚠️ Pole "Opis Niezgodności" jest wymagane!
            </p>
          )}
        </div>

        {/* Batch Number & Quantity */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Numer Partii / Szarży / Zlecenia
            </label>
            <input
              type="text"
              placeholder="np. LOT-2026/07/A"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Ilość Zakwestionowana
            </label>
            <input
              type="text"
              placeholder="np. 250 kg / 4 palety / 12 szt"
              value={quantityAffected}
              onChange={(e) => setQuantityAffected(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
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
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
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
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
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
            Odpowiedzialny Technolog / Inżynier Jakości
          </label>
          <select
            value={assignedToId}
            onChange={(e) => setAssignedToId(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">— wyznaczenie osoby lub wybór z listy —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400 mt-1">
            ℹ️ Termin wykonania akcji korygującej CAPA zostanie określony przez przypisanego inżyniera jakości.
          </p>
        </div>

        <UserEmailPicker
          value={notifyEmails}
          onChange={setNotifyEmails}
          users={users}
          selectedAreaId={areaId}
          moduleType="QUALITY"
          label="📧 Powiadomienie e-mailem (Wybór z bazy lub własny adres)"
        />

        <ImageUploadWithCamera
          label="Zdjęcie wady / próby laboratoryjnej"
          value={photoUrl}
          onChange={(url) => setPhotoUrl(url)}
        />

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => router.push('/jakosc')}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Anuluj
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span> Zapisywanie...
              </>
            ) : (
              <>
                <span>📦</span> Zarejestruj Niezgodność Jakościową
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
