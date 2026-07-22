'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/context/ToastContext';

interface NetworkAddress {
  name: string;
  ip: string;
  url: string;
}

export default function SiecPage() {
  const { showToast } = useToast();
  const [localUrl, setLocalUrl] = useState('http://localhost:3000');
  const [primaryUrl, setPrimaryUrl] = useState('');
  const [networkAddresses, setNetworkAddresses] = useState<NetworkAddress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/system-info')
      .then(r => r.json())
      .then(data => {
        if (data.localUrl) setLocalUrl(data.localUrl);
        if (data.primaryUrl) setPrimaryUrl(data.primaryUrl);
        if (Array.isArray(data.networkAddresses)) setNetworkAddresses(data.networkAddresses);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Skopiowano adres do schowka!', 'success');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b pb-4 border-slate-200 dark:border-slate-800">
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3">
          🌐 Dostęp Sieciowy & Adresy IP
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">
          Dynamicznie wykrywane adresy IP tego komputera. Użyj tych adresów, aby połączyć się z aplikacją z innych urządzeń w sieci LAN/Wi-Fi (np. z drugiego komputera, telefonu lub tabletu).
        </p>
      </div>

      {loading ? (
        <div className="text-center p-8 animate-pulse text-slate-400">Wykrywanie adresów sieciowych...</div>
      ) : (
        <div className="space-y-6">

          {/* Main Network Card with QR Code */}
          {primaryUrl ? (
            <div className="rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 p-8 text-white shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex justify-between items-start">
                    <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-black uppercase tracking-wider">
                      Główny Adres Zewnętrzny (LAN / Wi-Fi)
                    </span>
                  </div>

                  <div>
                    <div className="text-xs text-emerald-100 font-semibold mb-1">
                      Wpisz ten adres w przeglądarce na innym komputerze lub telefonie:
                    </div>
                    <div className="text-3xl md:text-4xl font-black font-mono tracking-tight break-all">
                      {primaryUrl}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      onClick={() => handleCopy(primaryUrl)}
                      className="px-5 py-2.5 bg-white text-emerald-800 font-bold rounded-xl shadow-md hover:bg-emerald-50 transition-all text-sm flex items-center gap-2 cursor-pointer"
                    >
                      📋 Kopiuj Adres IP
                    </button>
                    <a
                      href={primaryUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-5 py-2.5 bg-emerald-900/40 hover:bg-emerald-900/60 text-white font-bold rounded-xl transition-all text-sm flex items-center gap-2"
                    >
                      🚀 Testuj Połączenie
                    </a>
                  </div>
                </div>

                {/* QR Code Box */}
                <div className="bg-white p-4 rounded-2xl shadow-lg text-slate-800 text-center shrink-0 mx-auto md:mx-0">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(primaryUrl)}`}
                    alt="Kod QR do połączenia"
                    className="w-40 h-40 rounded-lg mx-auto"
                  />
                  <span className="text-[11px] font-bold text-slate-600 block mt-2">
                    📷 Zeskanuj telefonem
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-bold">
              Nie wykryto zewnętrznych kart sieciowych. Aplikacja działa lokalnie pod: {localUrl}
            </div>
          )}

          {/* All Network Interfaces */}
          {networkAddresses.length > 0 && (
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
                🔌 Wszystkie Wykryte Karty Sieciowe ({networkAddresses.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {networkAddresses.map((net, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex justify-between items-center"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">{net.name}</span>
                      <span className="text-base font-black font-mono text-slate-800 dark:text-slate-200">{net.url}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(net.url)}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-brand-500 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Kopiuj
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Localhost Info */}
          <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex justify-between items-center text-sm">
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300 block">Lokalny adres (tylko dla tego komputera):</span>
              <span className="font-mono text-slate-500">{localUrl}</span>
            </div>
            <button
              onClick={() => handleCopy(localUrl)}
              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Kopiuj
            </button>
          </div>

          {/* Instructions Box */}
          <div className="p-6 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-3">
            <h3 className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2 text-base">
              💡 Jak udostępnić aplikację po przeniesieniu na inny komputer?
            </h3>
            <ol className="text-xs text-slate-700 dark:text-slate-300 space-y-2 list-decimal list-inside leading-relaxed font-medium">
              <li>Skopiuj folder z aplikacją na nowy komputer.</li>
              <li>Uruchom aplikację komendą <code className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900 rounded font-mono font-bold text-indigo-800 dark:text-indigo-200">npm run dev</code>.</li>
              <li>System automatycznie wykryje nowy adres IP tego komputera w zakładce <strong>Ustawienia › Dostęp Sieciowy (LAN)</strong>.</li>
              <li>Wystarczy podać wyświetlony tu zielony adres (np. <code className="font-mono font-bold">{primaryUrl || 'http://10.89.79.6:3000'}</code>) innym osobom w tej samej sieci Wi-Fi/LAN!</li>
            </ol>
          </div>

        </div>
      )}
    </div>
  );
}
