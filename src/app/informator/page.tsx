'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function InformatorPage() {
  const principles = [
    {
      title: "Zasady 5S",
      color: "from-blue-500 to-cyan-500",
      description: "Narzędzie Lean Management służące do tworzenia i utrzymania dobrze zorganizowanego i bezpiecznego stanowiska pracy.",
      details: [
        { name: "Seiri (Selekcja)", text: "Usuń ze stanowiska wszystko, co jest niepotrzebne." },
        { name: "Seiton (Systematyka)", text: "Każda rzecz ma swoje miejsce, żeby łatwo było ją odłożyć." },
        { name: "Seiso (Sprzątanie)", text: "Utrzymuj stanowisko w czystości, wykrywaj usterki przez sprzątanie." },
        { name: "Seiketsu (Standaryzacja)", text: "Ustal jasne, powtarzalne standardy utrzymania czystości." },
        { name: "Shitsuke (Samodyscyplina)", text: "Przestrzegaj ustalonych standardów jako codzienny nawyk." }
      ]
    },
    {
      title: "GMP (Dobra Praktyka Produkcyjna)",
      color: "from-emerald-500 to-teal-500",
      description: "Standardy zapewniające, że produkty są wytwarzane w sposób jednolity, pod ścisłą kontrolą jakości.",
      details: [
        { name: "Higiena Osobista", text: "Odpowiedni ubiór, czystość i zakaz noszenia biżuterii na hali." },
        { name: "Zapobieganie Skażeniom", text: "Zakaz jedzenia i picia poza wyznaczonymi strefami." },
        { name: "Czystość Maszyn", text: "Regularne mycie i dezynfekcja linii produkcyjnych." },
        { name: "Dokumentacja", text: "Wszystkie procesy muszą być dokładnie rejestrowane." }
      ]
    },
    {
      title: "HACCP (Analiza Zagrożeń i Krytyczne Punkty Kontroli)",
      color: "from-orange-500 to-red-500",
      description: "System zarządzania bezpieczeństwem żywności (lub produktów) skupiający się na prewencji.",
      details: [
        { name: "Analiza zagrożeń", text: "Identyfikacja potencjalnych problemów (biologicznych, chemicznych, fizycznych)." },
        { name: "CCP (Krytyczne Punkty)", text: "Wyzaczenie miejsc, gdzie kontrola jest niezbędna by zapobiec ryzyku (np. temperatura pieczenia, detektor metalu)." },
        { name: "Monitorowanie", text: "Regularne sprawdzanie i zapis parametrów krytycznych." },
        { name: "Działania Korygujące", text: "Co zrobić, gdy proces wykracza poza granice bezpieczeństwa." }
      ]
    },
    {
      title: "Zasady Magazynowania",
      color: "from-purple-500 to-indigo-500",
      description: "Optymalne zarządzanie przepływem surowców i produktów.",
      details: [
        { name: "FIFO (First In, First Out)", text: "Pierwsze Weszło, Pierwsze Wyszło. Zapobiega przestarzeniu się asortymentu." },
        { name: "FEFO (First Expired, First Out)", text: "Pierwsze Traci Ważność, Pierwsze Wyszło. Kluczowe dla branży spożywczej." },
        { name: "Strefowanie", text: "Wyraźny podział na surowce, alergeny, półprodukty i wyroby gotowe." }
      ]
    }
  ];

  const [primaryUrl, setPrimaryUrl] = useState('');

  useEffect(() => {
    fetch('/api/system-info')
      .then(r => r.json())
      .then(data => {
        if (data.primaryUrl) setPrimaryUrl(data.primaryUrl);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600 mb-3">
          Baza Wiedzy i Standardy
        </h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-lg">
          Szybki wgląd do najważniejszych zasad pracy, standardów jakości oraz utrzymania czystości i bezpieczeństwa.
        </p>
      </div>

      {primaryUrl && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌐</span>
            <div>
              <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider block">Adres Sieciowy Dostępny w Wi-Fi / LAN</span>
              <span className="text-lg font-black font-mono">{primaryUrl}</span>
            </div>
          </div>
          <Link
            href="/ustawienia/siec"
            className="px-4 py-2 bg-white text-emerald-800 font-bold rounded-xl text-xs shadow hover:bg-emerald-50 transition-colors shrink-0"
          >
            Szczegóły Dostępu →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {principles.map((principle, idx) => (
          <div key={idx} className="glass-card overflow-hidden group">
            <div className={`h-3 w-full bg-gradient-to-r ${principle.color}`}></div>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                {principle.title}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6 font-medium">
                {principle.description}
              </p>
              
              <div className="space-y-4">
                {principle.details.map((detail, dIdx) => (
                  <div key={dIdx} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="block font-bold text-slate-800 dark:text-slate-200 mb-1">{detail.name}</span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">{detail.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-12 glass-card p-8 bg-brand-50 dark:bg-brand-900/10 border-brand-200 dark:border-brand-800">
        <h3 className="text-xl font-bold text-brand-700 dark:text-brand-400 mb-2">Potrzebujesz więcej informacji?</h3>
        <p className="text-slate-600 dark:text-slate-300 mb-6">Przejdź do pełnej dokumentacji technicznej i zakładowej.</p>
        <Link href="/dokumentacja" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md transition-all font-bold">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
            <path d="M3 8a2 2 0 012-2v10h8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
          </svg>
          Przeglądaj Dokumentację
        </Link>
      </div>
    </div>
  );
}
