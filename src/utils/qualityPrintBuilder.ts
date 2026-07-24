/**
 * Generates a printable HTML document for a Quality report
 * and opens the browser print dialog.
 */

export interface QualityPrintData {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  reportedBy: string;
  batchNumber?: string | null;
  quantityAffected?: string | number | null;
  assignedToName?: string | null;
  dueDate?: string | null;
  areaName?: string | null;
  machineName?: string | null;
  actionTaken?: string | null;
  fixedBy?: string | null;
  fixedAt?: string | null;
  photoUrl?: string | null;
  createdAt: string;
}

const CATEGORY_MAP: Record<string, string> = {
  PRODUCT_DEFECT: '📦 Wada Produktu',
  RAW_MATERIAL: '🧪 Niezgodność Surowca',
  PROCESS_DEVIATION: '⚙️ Odchylenie Procesowe',
  PACKAGING: '🏷️ Wada Opakowania',
  CUSTOMER_COMPLAINT: '🗣️ Reklamacja Klienta',
};

const SEVERITY_MAP: Record<string, string> = {
  CRITICAL: '🔴 Krytyczna (Blokada Wysyłki)',
  MODERATE: '🟡 Średnia Niezgodność',
  MINOR: '🟢 Drobne Odchylenie',
};

const STATUS_MAP: Record<string, string> = {
  OPEN: '🔓 Zgłoszona',
  IN_PROGRESS: '⚙️ W trakcie CAPA',
  RESOLVED: '✅ Skorygowana',
  CLOSED: '🔒 Zamknięta',
};

export function printQualityReport(data: QualityPrintData, baseUrl: string = typeof window !== 'undefined' ? window.location.origin : ''): void {
  const dateStr = new Date(data.createdAt).toLocaleString('pl-PL');
  const catLabel = CATEGORY_MAP[data.category] ?? data.category;
  const sevLabel = SEVERITY_MAP[data.severity] ?? data.severity;
  const statusLabel = STATUS_MAP[data.status] ?? data.status;

  const photos = data.photoUrl
    ? data.photoUrl.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const photosHtml = photos.length > 0
    ? `<div style="margin-top:16px;">
        <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Załączone Zdjęcia (${photos.length})</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          ${photos.map((url, i) => `<img src="${baseUrl}${url}" alt="Zdjęcie ${i + 1}" style="width:180px;height:180px;object-fit:cover;border-radius:8px;border:1px solid #e2e8f0;" />`).join('')}
        </div>
      </div>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8"/>
  <title>Zgłoszenie Jakościowe — ${data.title}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; color: #1e293b; padding: 32px; }
    .card { max-width: 700px; margin: 0 auto; background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .header { background: #7c3aed; padding: 24px 28px; color: #fff; }
    .header .app-label { font-size: 10px; font-weight: 700; color: #ddd6fe; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 4px; }
    .header h1 { font-size: 20px; font-weight: 800; margin-bottom: 4px; }
    .header .date { font-size: 12px; color: #c4b5fd; }
    .body { padding: 24px 28px; }
    .status-pill { display: inline-block; padding: 4px 12px; font-size: 11px; font-weight: 800; border-radius: 8px; border: 1px solid #ddd6fe; background: #f5f3ff; color: #6d28d9; margin-bottom: 16px; margin-right: 8px; }
    .section { margin-bottom: 16px; padding: 14px 18px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; }
    .section-label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
    .section-text { font-size: 13px; line-height: 1.6; color: #334155; white-space: pre-wrap; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
    .grid-item { padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; }
    .grid-item .label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
    .grid-item .value { font-size: 13px; font-weight: 700; color: #1e293b; }
    .action { background: #ecfdf5; border-color: #a7f3d0; }
    .action .section-label { color: #059669; }
    .footer { padding: 14px 28px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 10px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="app-label">System AuditApp — Raport Niezgodności Jakościowej</div>
      <h1>📦 ${data.title}</h1>
      <div class="date">Zgłoszono: ${dateStr}</div>
    </div>
    <div class="body">
      <div>
        <span class="status-pill">${catLabel}</span>
        <span class="status-pill">${sevLabel}</span>
        <span class="status-pill">${statusLabel}</span>
      </div>

      <div class="section">
        <div class="section-label">Opis Niezgodności / Wady</div>
        <div class="section-text">${data.description}</div>
      </div>

      <div class="grid">
        <div class="grid-item">
          <div class="label">Zgłaszający</div>
          <div class="value">👤 ${data.reportedBy}</div>
        </div>
        ${data.assignedToName ? `<div class="grid-item"><div class="label">Technolog / Odpowiedzialny</div><div class="value">🔬 ${data.assignedToName}</div></div>` : ''}
        ${data.batchNumber ? `<div class="grid-item"><div class="label">Nr Partii</div><div class="value">🏷️ ${data.batchNumber}</div></div>` : ''}
        ${data.quantityAffected ? `<div class="grid-item"><div class="label">Ilość Zakwestionowana</div><div class="value">⚖️ ${data.quantityAffected}</div></div>` : ''}
        ${data.areaName ? `<div class="grid-item"><div class="label">Obszar / Rejon</div><div class="value">📍 ${data.areaName}</div></div>` : ''}
        ${data.machineName ? `<div class="grid-item"><div class="label">Maszyna / Stanowisko</div><div class="value">⚙️ ${data.machineName}</div></div>` : ''}
        ${data.dueDate ? `<div class="grid-item"><div class="label">Termin Akcji CAPA</div><div class="value">📅 ${new Date(data.dueDate).toLocaleDateString('pl-PL')}</div></div>` : ''}
      </div>

      ${data.actionTaken ? `
      <div class="section action">
        <div class="section-label">✅ Podjęte Działania Korygujące CAPA</div>
        <div class="section-text">${data.actionTaken}</div>
        ${data.fixedBy ? `<div style="font-size:11px;font-weight:700;color:#047857;margin-top:6px;">Rozliczył: ${data.fixedBy} (${data.fixedAt ? new Date(data.fixedAt).toLocaleString('pl-PL') : ''})</div>` : ''}
      </div>` : ''}

      ${photosHtml}
    </div>
    <div class="footer">
      Wydrukowano z systemu AuditApp · ${new Date().toLocaleString('pl-PL')}
    </div>
  </div>
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
