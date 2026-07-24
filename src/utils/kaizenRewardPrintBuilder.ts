import { KaizenRewardEmailData } from './kaizenRewardEmailBuilder';

export function openKaizenRewardPrintWindow(data: Partial<KaizenRewardEmailData>): void {
  const now = new Date();
  const dateStr = data.createdAt 
    ? new Date(data.createdAt).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : now.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const docNumber = data.docNumber || `WN/KAIZEN/${year}/${month}/${Math.floor(1000 + Math.random() * 9000)}`;

  const userNameDisplay = data.userName?.trim() 
    ? `${data.userName} (Login: ${data.userLogin || data.userName})`
    : '';

  const bankAccountDisplay = data.bankAccount?.trim()
    ? data.bankAccount
    : 'P L _ _   _ _ _ _   _ _ _ _   _ _ _ _   _ _ _ _   _ _ _ _   _ _ _ _';

  const rewardTypeDisplay = data.rewardType?.trim() || '';
  const notesDisplay = data.notes?.trim() || '';

  const printHtml = `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>ZAŁĄCZNIK NR 3 - Wniosek o Wypłatę Nagrody Kaizen - ${docNumber}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #000;
      background-color: #fff;
      margin: 0;
      padding: 20px;
    }
    .page {
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
      padding: 20px;
    }
    h2 {
      font-size: 18px;
      margin-top: 10px;
      text-align: center;
      text-transform: uppercase;
    }
    h3 {
      font-size: 15px;
      margin-top: 5px;
      text-align: center;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      margin-bottom: 20px;
    }
    table, th, td {
      border: 1px solid #000;
    }
    th, td {
      padding: 10px;
      text-align: left;
      font-size: 13px;
    }
    .form-field {
      font-family: monospace;
      letter-spacing: 2px;
    }
    .digital-signature {
      background-color: #f9f9f9;
      border-left: 4px solid #4CAF50;
      padding: 12px 15px;
      font-size: 12px;
      margin-top: 15px;
      margin-bottom: 20px;
      font-style: italic;
    }
    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
    }
    .signature-line {
      width: 45%;
      border-top: 1px dotted #000;
      text-align: center;
      padding-top: 5px;
      font-size: 13px;
    }
    @media print {
      body { background: transparent; padding: 0; }
      .page { padding: 0; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="page">
    <h2>ZAŁĄCZNIK NR 3 DO REGULAMINU PROGRAMU KAIZEN</h2>
    <h3>AUDIT-APP | PROGRAM KAIZEN<br>WNIOSEK O WYPŁATĘ NAGRODY / PREMII</h3>

    <p style="font-size: 13px;">
      <strong>Nr wniosku:</strong> ${docNumber}<br>
      <strong>Data wystawienia:</strong> ${dateStr}
    </p>

    <p style="font-size: 13px;">
      👤 <strong>Pracownik Wnioskujący:</strong> ${userNameDisplay || '................................................................................................'}<br>
      <strong>Liczba pomysłów Kaizen:</strong> ${data.kaizensCount ?? '...'} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Punkty w systemie:</strong> ${data.pointsCount ?? '...'} pkt
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
          <td>${userNameDisplay}</td>
        </tr>
        <tr>
          <td><strong>Dział / Obszar Produkcyjny</strong></td>
          <td></td>
        </tr>
        <tr>
          <td><strong>Rodzaj Wnioskowanej Nagrody / Kwota</strong></td>
          <td>${rewardTypeDisplay}</td>
        </tr>
        <tr>
          <td style="height: 50px;"><strong>Dodatkowe Uwagi / Uzasadnienie</strong></td>
          <td>${notesDisplay}</td>
        </tr>
      </tbody>
    </table>

    <p style="font-size: 12px;">
      📌 <strong>Oświadczenie Pracownika:</strong> Proszę o weryfikację uzyskanych wyników w programie Kaizen oraz o przekazanie należnej kwoty/premi na podany wyżej rachunek bankowy zgodnie z Regulaminem Programu Kaizen (Załącznik nr 3).
    </p>

    <div class="digital-signature">
      <strong>✒️ KLAUZULA PODPISU ELEKTRONICZNEGO I ZGŁOSZENIA CYFROWEGO (SYSTEM CYFROWY KAIZEN)</strong><br>
      Zgodnie z Regulaminem Programu Kaizen, zidentyfikowany profil pracownika ${userNameDisplay ? `<strong>${userNameDisplay}</strong>` : 'składający ten wniosek'} elektronicznie w aplikacji Auditapp stanowi prawnie wiążący podpis cyfrowy potwierdzający jego autorstwo, treść oraz zgłoszenie.
    </div>

    <div class="signatures">
      <div class="signature-line" style="${userNameDisplay ? 'visibility: hidden;' : ''}">Data i Podpis Pracownika (Wnioskodawcy)</div>
      <div class="signature-line">Zatwierdzenie Działu HR / Dyrekcji</div>
    </div>
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>`;

  const printWin = window.open('', '_blank');
  if (printWin) {
    printWin.document.write(printHtml);
    printWin.document.close();
  }
}
