'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { printKaizenAnnex1, printKaizenAnnex2, printKaizenAnnex3 } from '@/utils/kaizenAnnexPrintBuilder';

export default function KaizenRegulaminPage() {
  const router = useRouter();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Header controls (hidden on print) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/kaizen"
            className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-2xl font-bold text-xs transition-colors"
          >
            ← Powrót do Kaizen
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              📜 Regulamin Programu Kaizen
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Oficjalne zasady zgłaszania, oceny i nagradzania w firmie AllSpice
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            🖨️ Drukuj Regulamin i Załączniki
          </button>
        </div>
      </div>

      {/* Style druku: Dedykowana strona dla każdego załącznika (break-before: page) i mieści się na A4 */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .print-annex-page {
            break-before: page !important;
            page-break-before: always !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            min-height: 90vh;
            padding-top: 10mm;
          }
          .print-compact-text {
            font-size: 10.5px !important;
            line-height: 1.35 !important;
          }
        }
      `}</style>

      {/* Official Document Container */}
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-8 sm:p-12 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-8 font-sans print:shadow-none print:border-none print:p-0 print:text-black">
        {/* Title */}
        <div className="text-center space-y-2 border-b pb-6 border-slate-200 dark:border-slate-800">
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-100 print:text-xl">
            Regulamin Programu Kaizen (Ciągłego Doskonalenia)
          </h1>
          <div className="text-sm font-bold text-amber-700 dark:text-amber-400 print:text-xs">
            Firma: AllSpice<br />
            Adres: Dziekanów Nowy 457, 05-092
          </div>
        </div>

        {/* § 1 */}
        <section className="space-y-2">
          <h3 className="text-base font-extrabold text-amber-900 dark:text-amber-300 uppercase tracking-wide border-b pb-1 border-slate-200 dark:border-slate-800">
            § 1. POSTANOWIENIA OGÓLNE
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
            <li>Niniejszy regulamin określa zasady zgłaszania, weryfikacji, wdrażania oraz nagradzania usprawnień w ramach Programu Kaizen (zwanego dalej „Programem”). Niniejszy regulamin obowiązuje wyłącznie w firmie AllSpice, zlokalizowanej pod adresem Dziekanów Nowy 457, 05-092.</li>
            <li>Nadrzędnym celem Programu jest ciągłe doskonalenie wszelkich procesów zachodzących w firmie (w tym m.in. produkcyjnych, technologicznych, finansowych, utrzymania ruchu, IT oraz administracyjnych), eliminacja marnotrawstwa, poprawa bezpieczeństwa pracy (BHP) oraz zwiększenie ogólnej efektywności przedsiębiorstwa.</li>
            <li>Uczestnikami uprawnionymi do zgłaszania wniosków w ramach Programu są wszyscy pracownicy firmy, z wyłączeniem kadry kierowniczej.</li>
          </ol>
        </section>

        {/* § 2 */}
        <section className="space-y-2">
          <h3 className="text-base font-extrabold text-amber-900 dark:text-amber-300 uppercase tracking-wide border-b pb-1 border-slate-200 dark:border-slate-800">
            § 2. PROCEDURA ZGŁASZANIA WNIOSKÓW
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
            <li>Proces zgłaszania pomysłów i usprawnień odbywa się drogą elektroniczną lub w formie papierowej.</li>
            <li>Zgłoszenia elektroniczne dokonywane są w aplikacji <strong>Auditapp</strong> (zwanej dalej „aplikacją audytową”) poprzez wypełnienie dedykowanego formularza.</li>
            <li>Zgłoszenia papierowe dokonywane są na dedykowanych arkuszach zgłoszeniowych, które są dostępne do pobrania na recepcji firmy.</li>
            <li>Niezależnie od wybranej formy zgłoszenia, uczestnik Programu musi w nim jednoznacznie zawrzeć opis obecnego problemu (stanu faktycznego) oraz propozycję jego rozwiązania (usprawnienia).</li>
            <li><strong>✒️ KLAUZULA PODPISU ELEKTRONICZNEGO I ZGŁOSZENIA CYFROWEGO (SYSTEM CYFROWY KAIZEN):</strong> Zgodnie z Regulaminem Programu Kaizen, zidentyfikowany profil pracownika składający wniosek Kaizen elektronicznie w aplikacji Auditapp stanowi prawnie wiążący podpis cyfrowy potwierdzający jego autorstwo, treść oraz zgłoszenie.</li>
          </ol>
        </section>

        {/* § 3 */}
        <section className="space-y-2">
          <h3 className="text-base font-extrabold text-amber-900 dark:text-amber-300 uppercase tracking-wide border-b pb-1 border-slate-200 dark:border-slate-800">
            § 3. OCENA I WERYFIKACJA WNIOSKÓW
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
            <li>Oceny merytorycznej oraz technicznej zgłoszonych wniosków dokonuje powołana Komisja Kaizen.</li>
            <li>Oceny dokonuje zespół powołany przez Zarząd. Zarząd ogłasza imienną listę członków Komisji Kaizen raz w miesiącu poprzez wywieszenie <strong>Załącznika nr 1</strong> do niniejszego regulaminu na firmowej tablicy ogłoszeń.</li>
            <li>Posiedzenia Komisji oraz proces oceny wniosków odbywają się raz w miesiącu.</li>
            <li>Ostateczna decyzja o akceptacji lub odrzuceniu wniosków za dany miesiąc musi zostać podjęta nie później niż do <strong>30. dnia każdego miesiąca</strong>.</li>
            <li>Komisja ocenia wnioski w oparciu o punktowy system oceny, którego szczegółowe zasady i kryteria określa <strong>Załącznik nr 2</strong>.</li>
          </ol>
        </section>

        {/* § 4 */}
        <section className="space-y-2">
          <h3 className="text-base font-extrabold text-amber-900 dark:text-amber-300 uppercase tracking-wide border-b pb-1 border-slate-200 dark:border-slate-800">
            § 4. SYSTEM NAGRADZANIA
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
            <li>Za pomysły zaakceptowane przez Komisję oraz skutecznie wdrożone w firmie przewidziana jest nagroda finansowa.</li>
            <li>Wysokość podstawowej nagrody miesięcznej ustalana jest przez Komisję w oparciu o sumę punktów zdobytą podczas oceny wniosku, zgodnie z przedziałami określonymi w <strong>Załączniku nr 2</strong>.</li>
            <li>Niezależnie od nagród miesięcznych, raz na kwartał przyznawane są Nagrody Specjalne za najwybitniejsze i najbardziej zyskowne dla firmy zgłoszenia, zgodnie z taryfikatorem określonym w <strong>Załączniku nr 2</strong>.</li>
            <li>Wypłacenie przyznanej nagrody finansowej nie następuje automatycznie. Warunkiem wypłaty środków jest wypełnienie i złożenie przez uczestnika formularza stanowiącego <strong>Załącznik nr 3</strong> – „Wniosek o Wypłatę Nagrody Kaizen”.</li>
          </ol>
        </section>

        {/* § 5 */}
        <section className="space-y-2">
          <h3 className="text-base font-extrabold text-amber-900 dark:text-amber-300 uppercase tracking-wide border-b pb-1 border-slate-200 dark:border-slate-800">
            § 5. POSTANOWIENIA KOŃCOWE
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
            <li>Z chwilą przyznania nagrody wszelkie prawa majątkowe do wdrożonych rozwiązań i usprawnień przechodzą na własność firmy AllSpice.</li>
            <li>W sprawach nieuregulowanych niniejszym regulaminem ostateczne decyzje podejmuje Zarząd firmy.</li>
            <li>Regulamin wchodzi w życie z dniem <strong>01.08.2026 r.</strong></li>
          </ol>
        </section>

        {/* Page Break for printing */}
        <div className="pt-8 border-t-2 border-dashed border-slate-300 dark:border-slate-700 print:border-none print-annex-page">
          {/* ZAŁĄCZNIK NR 1 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-amber-900 dark:text-amber-300 uppercase">ZAŁĄCZNIK NR 1</h2>
              <button
                type="button"
                onClick={printKaizenAnnex1}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer print:hidden"
              >
                🖨️ Drukuj Załącznik nr 1
              </button>
            </div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200">Imienna lista członków Komisji Kaizen</h3>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Obowiązuje na miesiąc / rok: ........................................
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Zgodnie z § 3 ust. 2 Regulaminu Programu Kaizen, w skład Komisji oceniającej wnioski wchodzi zespół powołany przez Zarząd firmy AllSpice:
            </p>
            <ol className="list-decimal list-inside space-y-3 text-sm font-mono text-slate-700 dark:text-slate-300">
              <li>1. ................................................................................................</li>
              <li>2. ................................................................................................</li>
              <li>3. ................................................................................................</li>
            </ol>
            <p className="text-xs italic text-slate-500">(Kolejne osoby według decyzji Zarządu)</p>
          </div>
        </div>

        {/* ZAŁĄCZNIK NR 2 */}
        <div className="pt-8 border-t-2 border-dashed border-slate-300 dark:border-slate-700 print:border-none print-annex-page space-y-4 print-compact-text">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-black text-amber-900 dark:text-amber-300 uppercase print:text-base">ZAŁĄCZNIK NR 2</h2>
              <button
                type="button"
                onClick={printKaizenAnnex2}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer print:hidden"
              >
                🖨️ Drukuj Załącznik nr 2
              </button>
            </div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200 print:text-sm">
              System Punktacji Wniosków Kaizen – Karta Oceny i Taryfikator Nagród
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 print:text-[11px]">
              Komisja Kaizen ocenia każdy zgłoszony pomysł w czterech niezależnych kryteriach, przyznając 0, 1, 3 lub 5 punktów w każdej kategorii. Maksymalna możliwa do zdobycia liczba punktów wynosi <strong>20</strong>.
            </p>
          </div>

          {/* I. Kryteria Oceny */}
          <div className="space-y-4">
            <h4 className="text-sm font-extrabold uppercase text-slate-800 dark:text-slate-200">I. Kryteria Oceny</h4>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="font-extrabold text-slate-900 dark:text-slate-100 block">
                  Kryterium 1: Wpływ na Bezpieczeństwo i Jakość (w tym Jakość Żywności)
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                  <li><strong>0 pkt</strong> – Brak wpływu na jakość procesów lub produktu.</li>
                  <li><strong>1 pkt</strong> – Niewielka poprawa estetyki stanowiska pracy (5S), ułatwienie utrzymania porządku w biurze/na hali.</li>
                  <li><strong>3 pkt</strong> – Zauważalne usprawnienie procesów operacyjnych/mycia, zmniejszenie ryzyka pomyłek dokumentacyjnych lub produkcyjnych.</li>
                  <li><strong>5 pkt</strong> – Całkowita eliminacja krytycznego ryzyka (np. likwidacja zagrożenia ciałem obcym w produkcie, krytycznego błędu finansowego/systemowego).</li>
                </ul>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="font-extrabold text-slate-900 dark:text-slate-100 block">
                  Kryterium 2: Wpływ na BHP i Ergonomię
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                  <li><strong>0 pkt</strong> – Brak wpływu na bezpieczeństwo i higienę pracy.</li>
                  <li><strong>1 pkt</strong> – Minimalna poprawa komfortu pracy biurowej lub fizycznej.</li>
                  <li><strong>3 pkt</strong> – Wyraźna poprawa ergonomii (np. wyeliminowanie uciążliwych czynności fizycznych, optymalizacja stanowiska komputerowego).</li>
                  <li><strong>5 pkt</strong> – Eliminacja bezpośredniego zagrożenia wypadkiem przy pracy lub chorobą zawodową.</li>
                </ul>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="font-extrabold text-slate-900 dark:text-slate-100 block">
                  Kryterium 3: Efektywność, Oszczędność i Redukcja Marnotrawstwa (Muda)
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                  <li><strong>0 pkt</strong> – Brak widocznych oszczędności.</li>
                  <li><strong>1 pkt</strong> – Drobne oszczędności materiałowe (np. papier, materiały biurowe), nieznaczne skrócenie czasu operacji.</li>
                  <li><strong>3 pkt</strong> – Skrócenie czasu przezbrojenia maszyny lub operacji systemowej, zmniejszenie ubytków surowca, automatyzacja prostego zadania, rzadsze awarie.</li>
                  <li><strong>5 pkt</strong> – Znacząca redukcja kosztów procesu, duża oszczędność surowca/energii/czasu, zauważalne zwiększenie wydajności linii produkcyjnej lub całego działu.</li>
                </ul>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="font-extrabold text-slate-900 dark:text-slate-100 block">
                  Kryterium 4: Łatwość i Koszt Wdrożenia
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                  <li><strong>0 pkt</strong> – Bardzo drogie wdrożenie, wymagające zewnętrznych firm, zaawansowanego oprogramowania lub inwestycji w nowe maszyny.</li>
                  <li><strong>1 pkt</strong> – Wdrożenie wymaga znacznego czasu, planowania i zakupów (np. przez Dział IT lub Dział Techniczny).</li>
                  <li><strong>3 pkt</strong> – Niskie koszty wdrożenia, prace możliwe do wykonania siłami wewnętrznymi (Utrzymanie Ruchu, lokalny administrator IT).</li>
                  <li><strong>5 pkt</strong> – Bezkosztowe (lub bardzo tanie) wdrożenie "od ręki", możliwe do zrealizowania bezpośrednio przez pracownika i przełożonego.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* II. Taryfikator Podstawowych Nagród Finansowych */}
          <div className="space-y-3 text-xs">
            <h4 className="text-sm font-extrabold uppercase text-slate-800 dark:text-slate-200">
              II. Taryfikator Podstawowych Nagród Finansowych
            </h4>
            <p className="text-slate-600 dark:text-slate-400">
              Punkty ze wszystkich czterech kategorii ulegają sumowaniu, na podstawie którego przydzielana jest nagroda.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 font-bold">
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-red-900 dark:text-red-200">
                0 punktów: Wniosek odrzucony / brak nagrody
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl text-blue-900 dark:text-blue-200">
                1 – 5 punktów: Nagroda IV Stopnia – <strong>10 zł netto</strong>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-amber-900 dark:text-amber-200">
                6 – 10 punktów: Nagroda III Stopnia – <strong>50 zł netto</strong>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-emerald-900 dark:text-emerald-200">
                11 – 15 punktów: Nagroda II Stopnia – <strong>100 zł netto</strong>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 rounded-xl text-purple-900 dark:text-purple-200 sm:col-span-2 md:col-span-1">
                16 – 20 punktów: Nagroda I Stopnia – <strong>150 zł netto</strong>
              </div>
            </div>
          </div>

          {/* III. Taryfikator Nagród Specjalnych */}
          <div className="space-y-3 text-xs">
            <h4 className="text-sm font-extrabold uppercase text-slate-800 dark:text-slate-200">
              III. Taryfikator Nagród Specjalnych (Kwartalnych)
            </h4>
            <p className="text-slate-600 dark:text-slate-400">
              Raz na kwartał Komisja Kaizen dokonuje ponownego przeglądu wszystkich wdrożonych w danym okresie wniosków i przyznaje dodatkowe Nagrody Specjalne za wybitne osiągnięcia:
            </p>
            <div className="grid grid-cols-3 gap-2 font-bold text-center">
              <div className="p-3 bg-amber-500 text-white rounded-xl shadow-xs">
                🥇 1. miejsce: <strong>500 zł netto</strong>
              </div>
              <div className="p-3 bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl">
                🥈 2. miejsce: <strong>400 zł netto</strong>
              </div>
              <div className="p-3 bg-amber-800 text-white rounded-xl">
                🥉 3. miejsce: <strong>300 zł netto</strong>
              </div>
            </div>
          </div>
        </div>

        {/* ZAŁĄCZNIK NR 3 */}
        <div className="pt-8 border-t-2 border-dashed border-slate-300 dark:border-slate-700 print:border-none print-annex-page space-y-4 print-compact-text">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-amber-900 dark:text-amber-300 uppercase">
              ZAŁĄCZNIK NR 3 DO REGULAMINU PROGRAMU KAIZEN
            </h2>
            <button
              type="button"
              onClick={printKaizenAnnex3}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer print:hidden"
            >
              🖨️ Drukuj Czysty Załącznik nr 3
            </button>
          </div>
          <div className="text-center space-y-1">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
              AUDIT-APP | PROGRAM KAIZEN<br />WNIOSEK O WYPŁATĘ NAGRODY / PREMII
            </h3>
          </div>

          <div className="text-xs space-y-1 font-mono text-slate-700 dark:text-slate-300">
            <p><strong>Nr wniosku:</strong> WN/KAIZEN/2026/07/9359</p>
            <p><strong>Data wystawienia:</strong> 23.07.2026</p>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-xs space-y-1">
            <p>👤 <strong>Pracownik Wnioskujący:</strong> ................................................................................................</p>
            <p><strong>Liczba pomysłów Kaizen:</strong> 2 &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Punkty w systemie:</strong> 20 pkt</p>
          </div>

          <table className="w-full text-xs border-collapse border border-slate-900 dark:border-slate-300 my-4">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                <th className="border border-slate-900 dark:border-slate-300 p-2 text-left w-2/5 uppercase font-bold">DANE WNIOSKU</th>
                <th className="border border-slate-900 dark:border-slate-300 p-2 text-left w-3/5 uppercase font-bold">WYPEŁNIONE SZCZEGÓŁY / WPIS RĘCZNY</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-900 dark:border-slate-300 p-2 font-bold">Wnioskodawca (Imię i Nazwisko)</td>
                <td className="border border-slate-900 dark:border-slate-300 p-2 font-mono">........................................................</td>
              </tr>
              <tr>
                <td className="border border-slate-900 dark:border-slate-300 p-2 font-bold">Dział / Obszar Produkcyjny</td>
                <td className="border border-slate-900 dark:border-slate-300 p-2 font-mono">........................................................</td>
              </tr>
              <tr>
                <td className="border border-slate-900 dark:border-slate-300 p-2 font-bold">Rodzaj Wnioskowanej Nagrody</td>
                <td className="border border-slate-900 dark:border-slate-300 p-2 font-mono">........................................................</td>
              </tr>
              <tr>
                <td className="border border-slate-900 dark:border-slate-300 p-2 font-bold h-16">Dodatkowe Uwagi / Uzasadnienie</td>
                <td className="border border-slate-900 dark:border-slate-300 p-2 font-mono">........................................................</td>
              </tr>
            </tbody>
          </table>

          <p className="text-xs text-slate-600 dark:text-slate-400">
            📌 <strong>Oświadczenie Pracownika:</strong> Proszę o weryfikację uzyskanych wyników w programie Kaizen oraz o przekazanie należnej kwoty/premi na podany wyżej rachunek bankowy zgodnie z Regulaminem Programu Kaizen (Załącznik nr 3).
          </p>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-l-4 border-emerald-500 rounded-r-xl text-xs space-y-1 italic text-slate-700 dark:text-slate-300">
            <strong>✒️ KLAUZULA PODPISU ELEKTRONICZNEGO I ZGŁOSZENIA CYFROWEGO (SYSTEM CYFROWY KAIZEN)</strong><br />
            Zgodnie z Regulaminem Programu Kaizen, zidentyfikowany profil pracownika składający ten wniosek Kaizen elektronicznie w aplikacji Auditapp stanowi prawnie wiążący podpis cyfrowy potwierdzający jego autorstwo, treść oraz zgłoszenie.
          </div>

          <div className="flex justify-between pt-8 text-xs text-slate-600 dark:text-slate-400">
            <div className="w-5/12 invisible border-t border-dotted border-slate-900 dark:border-slate-300 text-center pt-1 font-medium">
              Data i Podpis Pracownika (Wnioskodawcy)
            </div>
            <div className="w-5/12 border-t border-dotted border-slate-900 dark:border-slate-300 text-center pt-1 font-medium">
              Zatwierdzenie Działu HR / Dyrekcji
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
