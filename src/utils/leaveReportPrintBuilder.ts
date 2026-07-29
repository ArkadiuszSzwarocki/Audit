export interface LeaveReportPrintData {
  year: number;
  reportType: 'employees' | 'departments' | 'monthly' | 'types';
  employeeData?: Array<{
    id?: string;
    employeeName: string;
    employeeLogin: string;
    departmentName: string;
    totalDays: number;
    usedDays: number;
    availableDays: number;
    utilizationPercent: number;
  }>;
  departmentData?: Array<{
    id?: string;
    departmentName: string;
    totalEmployees: number;
    totalDays: number;
    usedDays: number;
    availableDays: number;
  }>;
  monthlyData?: Array<{
    month: string;
    totalRequests: number;
    totalDays: number;
  }>;
  typesData?: Array<{
    type: string;
    requestsCount: number;
    totalDays: number;
  }>;
}

export function printLeaveReport(data: LeaveReportPrintData): void {
  const now = new Date();
  const dateStr = now.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let reportTitle = 'Raport Wykorzystania Urlopów Pracowników';
  if (data.reportType === 'departments') reportTitle = 'Raport Zbiorczy Urlopów według Działów';
  if (data.reportType === 'monthly') reportTitle = 'Raport Miesięcznego Trendu Urlopowego';
  if (data.reportType === 'types') reportTitle = 'Raport Według Typów Wniosków Urlopowych';

  let tableHtml = '';

  if (data.reportType === 'employees' && data.employeeData) {
    const rows = data.employeeData.map(
      (row, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${row.employeeName}</strong><br><span style="color:#64748b; font-size:11px;">(${row.employeeLogin})</span></td>
        <td>${row.departmentName}</td>
        <td style="text-align:center; font-weight:bold;">${row.totalDays} dn.</td>
        <td style="text-align:center; color:#dc2626; font-weight:bold;">${row.usedDays} dn.</td>
        <td style="text-align:center; color:#16a34a; font-weight:bold;">${row.availableDays} dn.</td>
        <td style="text-align:center; font-weight:bold;">${(row.utilizationPercent || 0).toFixed(1)}%</td>
      </tr>
    `
    ).join('');

    tableHtml = `
      <table>
        <thead>
          <tr>
            <th style="width: 40px;">Lp.</th>
            <th>Pracownik (Login)</th>
            <th>Dział / Departament</th>
            <th style="text-align:center;">Pula (Zaległy + Bieżący)</th>
            <th style="text-align:center;">Wykorzystane</th>
            <th style="text-align:center;">Dostępne</th>
            <th style="text-align:center;">Wykorzystanie</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="7" style="text-align:center;">Brak danych do wyświetlenia</td></tr>'}
        </tbody>
      </table>
    `;
  } else if (data.reportType === 'departments' && data.departmentData) {
    const rows = data.departmentData.map(
      (row, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${row.departmentName}</strong></td>
        <td style="text-align:center; font-weight:bold;">${row.totalEmployees} os.</td>
        <td style="text-align:center; font-weight:bold;">${row.totalDays} dn.</td>
        <td style="text-align:center; color:#dc2626; font-weight:bold;">${row.usedDays} dn.</td>
        <td style="text-align:center; color:#16a34a; font-weight:bold;">${row.availableDays} dn.</td>
      </tr>
    `
    ).join('');

    tableHtml = `
      <table>
        <thead>
          <tr>
            <th style="width: 40px;">Lp.</th>
            <th>Dział / Departament</th>
            <th style="text-align:center;">Pracownicy</th>
            <th style="text-align:center;">Łączna Pula</th>
            <th style="text-align:center;">Użyte Dni</th>
            <th style="text-align:center;">Dostępne Dni</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="6" style="text-align:center;">Brak danych do wyświetlenia</td></tr>'}
        </tbody>
      </table>
    `;
  } else if (data.reportType === 'monthly' && data.monthlyData) {
    const rows = data.monthlyData.map(
      (row, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${row.month}</strong></td>
        <td style="text-align:center; font-weight:bold;">${row.totalRequests}</td>
        <td style="text-align:center; color:#2563eb; font-weight:bold;">${row.totalDays} dn.</td>
      </tr>
    `
    ).join('');

    tableHtml = `
      <table>
        <thead>
          <tr>
            <th style="width: 40px;">Lp.</th>
            <th>Miesiąc</th>
            <th style="text-align:center;">Liczba Wniosków</th>
            <th style="text-align:center;">Suma Dni Urlopu</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="4" style="text-align:center;">Brak danych do wyświetlenia</td></tr>'}
        </tbody>
      </table>
    `;
  } else if (data.reportType === 'types' && data.typesData) {
    const rows = data.typesData.map(
      (row, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${row.type}</strong></td>
        <td style="text-align:center; font-weight:bold;">${row.requestsCount}</td>
        <td style="text-align:center; color:#2563eb; font-weight:bold;">${row.totalDays} dn.</td>
      </tr>
    `
    ).join('');

    tableHtml = `
      <table>
        <thead>
          <tr>
            <th style="width: 40px;">Lp.</th>
            <th>Typ Wniosku Urlopowego</th>
            <th style="text-align:center;">Liczba Wniosków</th>
            <th style="text-align:center;">Łączna Liczba Dni</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="4" style="text-align:center;">Brak danych do wyświetlenia</td></tr>'}
        </tbody>
      </table>
    `;
  }

  const printHtml = `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>${reportTitle} - ${data.year}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #0f172a;
      background: #fff;
      margin: 0;
      padding: 15px;
      font-size: 13px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .brand {
      font-size: 20px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .brand span { color: #2563eb; }
    .doc-info {
      text-align: right;
      font-size: 11px;
      color: #64748b;
    }
    h1 {
      font-size: 18px;
      font-weight: 800;
      margin: 0 0 4px 0;
      color: #0f172a;
    }
    .subtitle {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th {
      background-color: #f1f5f9;
      color: #334155;
      font-weight: 800;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px 12px;
      border-top: 1px solid #cbd5e1;
      border-bottom: 2px solid #94a3b8;
    }
    td {
      padding: 9px 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12px;
    }
    tr:nth-child(even) {
      background-color: #f8fafc;
    }
    .footer {
      margin-top: 30px;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #94a3b8;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div className="header">
    <div className="brand">Audit<span>App</span> • System Urlopowy</div>
    <div className="doc-info">
      <div>Data wygenerowania: <strong>${dateStr}</strong></div>
      <div>Rok rozliczeniowy: <strong>${data.year}</strong></div>
    </div>
  </div>

  <h1>${reportTitle}</h1>
  <div className="subtitle">Oficjalne zestawienie urlopowe dla roku ${data.year} (Zgodne z Kodeksem Pracy)</div>

  ${tableHtml}

  <div className="footer">
    <div>Wygenerowano z systemu AuditApp • Raporty Urlopowe</div>
    <div>Strona 1 z 1</div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
  }
}
