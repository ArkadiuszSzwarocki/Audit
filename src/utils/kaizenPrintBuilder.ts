/**
 * Generates a printable HTML document for a Kaizen report
 * and opens the browser print dialog.
 */

export interface KaizenPrintData {
  id: string;
  title: string;
  description: string;
  benefits?: string | null;
  submittedBy: string;
  status: string;
  pointsAwarded?: number | null;
  committeeNote?: string | null;
  areaName?: string | null;
  machineName?: string | null;
  photoUrl?: string | null;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: '💡 Oczekujący',
  APPROVED: '✅ Zatwierdzony',
  REJECTED: '❌ Odrzucony',
};

export function printKaizenReport(data: KaizenPrintData, baseUrl: string): void {
  const dateStr = new Date(data.createdAt).toLocaleString('pl-PL');
  const statusLabel = STATUS_LABELS[data.status] ?? data.status;

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
  <title>Kaizen — ${data.title}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; color: #1e293b; padding: 32px; }
    .card { max-width: 700px; margin: 0 auto; background: #fff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .header { background: #d97706; padding: 24px 28px; color: #fff; }
    .header .app-label { font-size: 10px; font-weight: 700; color: #fef3c7; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 4px; }
    .header h1 { font-size: 20px; font-weight: 800; margin-bottom: 4px; }
    .header .date { font-size: 12px; color: #fde68a; }
    .body { padding: 24px 28px; }
    .status-pill { display: inline-block; padding: 4px 12px; font-size: 11px; font-weight: 800; border-radius: 8px; border: 1px solid #fcd34d; background: #fffbeb; color: #92400e; margin-bottom: 16px; }
    .section { margin-bottom: 16px; padding: 14px 18px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; }
    .section-label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
    .section-text { font-size: 13px; line-height: 1.6; color: #334155; white-space: pre-wrap; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
    .grid-item { padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; }
    .grid-item .label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px; }
    .grid-item .value { font-size: 13px; font-weight: 700; color: #1e293b; }
    .benefits { background: #fffbeb; border-color: #fcd34d; }
    .benefits .section-label { color: #d97706; }
    .committee { background: #eef2ff; border-color: #a5b4fc; }
    .committee .section-label { color: #4338ca; }
    .footer { padding: 14px 28px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 10px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="app-label">System AuditApp — Raport Kaizen</div>
      <h1>💡 ${data.title}</h1>
      <div class="date">Zgłoszono: ${dateStr}</div>
    </div>
    <div class="body">
      <div class="status-pill">${statusLabel}</div>

      <div class="section">
        <div class="section-label">Opis Udoskonalenia</div>
        <div class="section-text">${data.description}</div>
      </div>

      ${data.benefits ? `
      <div class="section benefits">
        <div class="section-label">🚀 Oczekiwane Korzyści</div>
        <div class="section-text">${data.benefits}</div>
      </div>` : ''}

      <div class="grid">
        <div class="grid-item">
          <div class="label">Pomysłodawca</div>
          <div class="value">👤 ${data.submittedBy}</div>
        </div>
        <div class="grid-item">
          <div class="label">Przyznane Punkty</div>
          <div class="value">⭐ ${data.pointsAwarded ?? 0} pkt</div>
        </div>
        ${data.areaName ? `<div class="grid-item"><div class="label">Obszar / Rejon</div><div class="value">📍 ${data.areaName}</div></div>` : ''}
        ${data.machineName ? `<div class="grid-item"><div class="label">Maszyna / Linia</div><div class="value">⚙️ ${data.machineName}</div></div>` : ''}
      </div>

      ${data.committeeNote ? `
      <div class="section committee">
        <div class="section-label">📝 Decyzja Komisji Kaizen</div>
        <div class="section-text">"${data.committeeNote}"</div>
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
