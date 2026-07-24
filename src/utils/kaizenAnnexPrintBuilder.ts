/**
  Helpers to print individual Kaizen Annexes (Załącznik nr 1, Załącznik nr 2, Załącznik nr 3)
 */

export function printKaizenAnnex1(): void {
  const printHtml = `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>ZAŁĄCZNIK NR 1 - Lista Członków Komisji Kaizen - AllSpice</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.5;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 10px;
    }
    .page {
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
      padding: 10px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    h2 { font-size: 18px; text-transform: uppercase; text-align: center; margin-bottom: 5px; }
    h3 { font-size: 15px; text-align: center; margin-top: 5px; margin-bottom: 20px; }
    ol { padding-left: 20px; font-family: monospace; font-size: 13px; }
    li { margin-bottom: 12px; }
    @media print { body { padding: 0; } .page { padding: 0; max-width: 100%; } }
  </style>
</head>
<body>
  <div class="page">
    <h2>ZAŁĄCZNIK NR 1 DO REGULAMINU PROGRAMU KAIZEN</h2>
    <h3>Imienna lista członków Komisji Kaizen</h3>
    
    <p style="font-size: 13px;"><strong>Firma:</strong> AllSpice (Dziekanów Nowy 457, 05-092)</p>
    <p style="font-size: 13px;"><strong>Obowiązuje na miesiąc / rok:</strong> ........................................</p>
    
    <p style="font-size: 13px; margin-top: 15px;">
      Zgodnie z § 3 ust. 2 Regulaminu Programu Kaizen, w skład Komisji oceniającej wnioski wchodzi zespół powołany przez Zarząd firmy AllSpice:
    </p>

    <ol>
      <li>1. ................................................................................................</li>
      <li>2. ................................................................................................</li>
      <li>3. ................................................................................................</li>
      <li>4. ................................................................................................</li>
      <li>5. ................................................................................................</li>
    </ol>

    <p style="font-size: 11px; font-style: italic; margin-top: 20px;">(Kolejne osoby według decyzji Zarządu firmy AllSpice)</p>

    <div style="margin-top: 60px; display: flex; justify-content: flex-end;">
      <div style="border-top: 1px dotted #000; width: 250px; text-align: center; font-size: 12px; padding-top: 5px;">
        Podpis i Pieczęć Zarządu AllSpice
      </div>
    </div>
  </div>
  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`;

  const printWin = window.open('', '_blank');
  if (printWin) {
    printWin.document.write(printHtml);
    printWin.document.close();
  }
}

export function printKaizenAnnex2(): void {
  const printHtml = `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>ZAŁĄCZNIK NR 2 - System Punktacji i Taryfikator Nagród - AllSpice</title>
  <style>
    @page { size: A4 portrait; margin: 8mm 10mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.35;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 0;
    }
    .page {
      max-width: 100%;
      margin: 0 auto;
      background: #fff;
      padding: 5px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    h2 { font-size: 16px; text-transform: uppercase; text-align: center; margin-bottom: 2px; }
    h3 { font-size: 13px; text-align: center; margin-top: 2px; margin-bottom: 10px; }
    h4 { font-size: 12px; margin-top: 8px; margin-bottom: 4px; border-bottom: 1px solid #000; padding-bottom: 2px; text-transform: uppercase; font-weight: bold; }
    ul { padding-left: 18px; margin-top: 3px; margin-bottom: 4px; font-size: 10.5px; }
    li { margin-bottom: 2px; }
    .box { border: 1px solid #000; padding: 5px 8px; margin-bottom: 5px; font-size: 11px; }
    @media print { body { padding: 0; } .page { padding: 0; max-width: 100%; } }
  </style>
</head>
<body>
  <div class="page">
    <h2>ZAŁĄCZNIK NR 2 DO REGULAMINU PROGRAMU KAIZEN</h2>
    <h3>System Punktacji Wniosków Kaizen – Karta Oceny i Taryfikator Nagród</h3>
    <p style="font-size: 11px; margin-bottom: 4px;">Firma: <strong>AllSpice</strong> (Dziekanów Nowy 457, 05-092)</p>
    <p style="font-size: 11px; margin-bottom: 8px;">Komisja Kaizen ocenia każdy zgłoszony pomysł w czterech niezależnych kryteriach, przyznając 0, 1, 3 lub 5 punktów w każdej kategorii. Maksymalna możliwa do zdobycia liczba punktów wynosi <strong>20</strong>.</p>

    <h4>I. Kryteria Oceny</h4>
    
    <div class="box">
      <strong>Kryterium 1: Wpływ na Bezpieczeństwo i Jakość (w tym Jakość Żywności)</strong>
      <ul>
        <li><strong>0 pkt</strong> – Brak wpływu na jakość procesów lub produktu.</li>
        <li><strong>1 pkt</strong> – Niewielka poprawa estetyki stanowiska pracy (5S), ułatwienie utrzymania porządku w biurze/na hali.</li>
        <li><strong>3 pkt</strong> – Zauważalne usprawnienie procesów operacyjnych/mycia, zmniejszenie ryzyka pomyłek dokumentacyjnych lub produkcyjnych.</li>
        <li><strong>5 pkt</strong> – Całkowita eliminacja krytycznego ryzyka (np. likwidacja zagrożenia ciałem obcym w produkcie, krytycznego błędu finansowego/systemowego).</li>
      </ul>
    </div>

    <div class="box">
      <strong>Kryterium 2: Wpływ na BHP i Ergonomię</strong>
      <ul>
        <li><strong>0 pkt</strong> – Brak wpływu na bezpieczeństwo i higienę pracy.</li>
        <li><strong>1 pkt</strong> – Minimalna poprawa komfortu pracy biurowej lub fizycznej.</li>
        <li><strong>3 pkt</strong> – Wyraźna poprawa ergonomii (np. wyeliminowanie uciążliwych czynności fizycznych, optymalizacja stanowiska komputerowego).</li>
        <li><strong>5 pkt</strong> – Eliminacja bezpośredniego zagrożenia wypadkiem przy pracy lub chorobą zawodową.</li>
      </ul>
    </div>

    <div class="box">
      <strong>Kryterium 3: Efektywność, Oszczędność i Redukcja Marnotrawstwa (Muda)</strong>
      <ul>
        <li><strong>0 pkt</strong> – Brak widocznych oszczędności.</li>
        <li><strong>1 pkt</strong> – Drobne oszczędności materiałowe (np. papier, materiały biurowe), nieznaczne skrócenie czasu operacji.</li>
        <li><strong>3 pkt</strong> – Skrócenie czasu przezbrojenia maszyny lub operacji systemowej, zmniejszenie ubytków surowca, automatyzacja prostego zadania, rzadsze awarie.</li>
        <li><strong>5 pkt</strong> – Znacząca redukcja kosztów procesu, duża oszczędność surowca/energii/czasu, zauważalne zwiększenie wydajności linii produkcyjnej lub całego działu.</li>
      </ul>
    </div>

    <div class="box">
      <strong>Kryterium 4: Łatwość i Koszt Wdrożenia</strong>
      <ul>
        <li><strong>0 pkt</strong> – Bardzo drogie wdrożenie, wymagające zewnętrznych firm, zaawansowanego oprogramowania lub inwestycji w nowe maszyny.</li>
        <li><strong>1 pkt</strong> – Wdrożenie wymaga znacznego czasu, planowania i zakupów (np. przez Dział IT lub Dział Techniczny).</li>
        <li><strong>3 pkt</strong> – Niskie koszty wdrożenia, prace możliwe do wykonania siłami wewnętrznymi (Utrzymanie Ruchu, lokalny administrator IT).</li>
        <li><strong>5 pkt</strong> – Bezkosztowe (lub bardzo tanie) wdrożenie "od ręki", możliwe do zrealizowania bezpośrednio przez pracownika i przełożonego.</li>
      </ul>
    </div>

    <h4>II. Taryfikator Podstawowych Nagród Finansowych</h4>
    <ul style="font-size: 11px;">
      <li><strong>0 punktów:</strong> Wniosek odrzucony lub wymagający poprawy (Brak nagrody finansowej).</li>
      <li><strong>1 – 5 punktów:</strong> Nagroda IV Stopnia – <strong>10 zł netto</strong></li>
      <li><strong>6 – 10 punktów:</strong> Nagroda III Stopnia – <strong>50 zł netto</strong></li>
      <li><strong>11 – 15 punktów:</strong> Nagroda II Stopnia – <strong>100 zł netto</strong></li>
      <li><strong>16 – 20 punktów:</strong> Nagroda I Stopnia – <strong>150 zł netto</strong></li>
    </ul>

    <h4>III. Taryfikator Nagród Specjalnych (Kwartalnych)</h4>
    <ul style="font-size: 11px;">
      <li><strong>1. miejsce:</strong> <strong>500 zł netto</strong> &nbsp;|&nbsp; <strong>2. miejsce:</strong> <strong>400 zł netto</strong> &nbsp;|&nbsp; <strong>3. miejsce:</strong> <strong>300 zł netto</strong></li>
    </ul>
  </div>
  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`;

  const printWin = window.open('', '_blank');
  if (printWin) {
    printWin.document.write(printHtml);
    printWin.document.close();
  }
}

export function printKaizenAnnex3(): void {
  const printHtml = `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>ZAŁĄCZNIK NR 3 - Wniosek o Wypłatę Nagrody Kaizen - AllSpice</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 20px;
    }
    .page {
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
      padding: 20px;
    }
    h2 { font-size: 18px; text-transform: uppercase; text-align: center; margin-bottom: 5px; }
    h3 { font-size: 15px; text-align: center; margin-top: 5px; margin-bottom: 25px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px; }
    table, th, td { border: 1px solid #000; }
    th, td { padding: 10px; text-align: left; font-size: 13px; }
    .form-field { font-family: monospace; letter-spacing: 2px; }
    .digital-signature {
      background-color: #f9f9f9;
      border-left: 4px solid #4CAF50;
      padding: 15px;
      font-size: 13px;
      margin-top: 20px;
      margin-bottom: 30px;
      font-style: italic;
    }
    .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
    .signature-line { width: 45%; border-top: 1px dotted #000; text-align: center; padding-top: 5px; font-size: 13px; }
    @media print { body { padding: 0; } .page { padding: 0; max-width: 100%; } }
  </style>
</head>
<body>
  <div class="page">
    <h2>ZAŁĄCZNIK NR 3 DO REGULAMINU PROGRAMU KAIZEN</h2>
    <h3>AUDIT-APP | PROGRAM KAIZEN<br>WNIOSEK O WYPŁATĘ NAGRODY / PREMII</h3>

    <p style="font-size: 13px;">
      <strong>Nr wniosku:</strong> WN/KAIZEN/2026/07/9359<br>
      <strong>Data wystawienia:</strong> ${new Date().toLocaleDateString('pl-PL')}
    </p>

    <p style="font-size: 13px;">
      👤 <strong>Pracownik Wnioskujący:</strong> ................................................................................................<br>
      <strong>Liczba pomysłów Kaizen:</strong> ....... &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Punkty w systemie:</strong> ....... pkt
    </p>

    <table>
      <thead>
        <tr>
          <th style="width: 40%; background-color: #eee;">DANE WNIOSKU</th>
          <th style="width: 60%; background-color: #eee;">WYPEŁNIONE SZCZEGÓŁY / WPIS RĘCZNY</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Wnioskodawca (Imię i Nazwisko)</strong></td>
          <td></td>
        </tr>
        <tr>
          <td><strong>Dział / Obszar Produkcyjny</strong></td>
          <td></td>
        </tr>
        <tr>
          <td><strong>Rodzaj Wnioskowanej Nagrody</strong></td>
          <td></td>
        </tr>
        <tr>
          <td style="height: 60px;"><strong>Dodatkowe Uwagi / Uzasadnienie</strong></td>
          <td></td>
        </tr>
      </tbody>
    </table>

    <p style="font-size: 12px;">
      📌 <strong>Oświadczenie Pracownika:</strong> Proszę o weryfikację uzyskanych wyników w programie Kaizen oraz o przekazanie należnej kwoty/premi na podany wyżej rachunek bankowy zgodnie z Regulaminem Programu Kaizen (Załącznik nr 3).
    </p>

    <div class="digital-signature">
      <strong>✒️ KLAUZULA PODPISU ELEKTRONICZNEGO I ZGŁOSZENIA CYFROWEGO (SYSTEM CYFROWY KAIZEN)</strong><br>
      Zgodnie z Regulaminem Programu Kaizen, zidentyfikowany profil pracownika składający ten wniosek Kaizen elektronicznie w aplikacji Auditapp stanowi prawnie wiążący podpis cyfrowy potwierdzający jego autorstwo, treść oraz zgłoszenie.
    </div>

    <div class="signatures">
      <div class="signature-line" style="visibility: hidden;">Data i Podpis Pracownika (Wnioskodawcy)</div>
      <div class="signature-line">Zatwierdzenie Działu HR / Dyrekcji</div>
    </div>
  </div>
  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`;

  const printWin = window.open('', '_blank');
  if (printWin) {
    printWin.document.write(printHtml);
    printWin.document.close();
  }
}
