/**
 * Builds an Outlook-compatible HTML EML email for Quality report notifications
 */

export interface QualityEmailData {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  reportedBy: string;
  batchNumber?: string | null;
  quantityAffected?: string | number | null;
  areaName?: string | null;
  machineName?: string | null;
  assignedToName?: string | null;
  photoUrl?: string | null;
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

function buildQualityEmailHtml(data: QualityEmailData, baseUrl: string): string {
  const dateStr = new Date().toLocaleString('pl-PL');
  const catLabel = CATEGORY_MAP[data.category] ?? data.category;
  const sevLabel = SEVERITY_MAP[data.severity] ?? data.severity;

  return `<!DOCTYPE html>
<html lang="pl">
<head><meta charset="UTF-8"/><title>Zgłoszenie Jakościowe</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;">
  <tr><td align="center" style="padding:24px 16px;">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
      <tr>
        <td style="background:#7c3aed;padding:24px 28px;">
          <div style="font-size:11px;font-weight:700;color:#ddd6fe;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">System AuditApp — Jakość</div>
          <div style="font-size:20px;font-weight:800;color:#ffffff;">📦 Nowe Zgłoszenie Jakościowe</div>
          <div style="margin-top:6px;font-size:12px;color:#c4b5fd;">${dateStr}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            <tr><td>
              <table cellpadding="0" cellspacing="0" style="background:#f5f3ff;border:2px solid #a78bfa;border-radius:10px;width:100%;">
                <tr><td style="padding:14px 20px;font-size:16px;font-weight:800;color:#5b21b6;">
                  📦 ${data.title}
                </td></tr>
              </table>
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            <tr style="background:#f8fafc;">
              <td colspan="2" style="padding:10px 14px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #e2e8f0;">
                Szczegóły Niezgodności
              </td>
            </tr>
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:10px 14px;font-size:12px;color:#94a3b8;width:140px;">Kategoria</td>
              <td style="padding:10px 14px;font-size:13px;font-weight:700;color:#1e293b;">${catLabel}</td>
            </tr>
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:10px 14px;font-size:12px;color:#94a3b8;">Istotność</td>
              <td style="padding:10px 14px;font-size:13px;font-weight:700;color:#7c3aed;">${sevLabel}</td>
            </tr>
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:10px 14px;font-size:12px;color:#94a3b8;">Zgłaszający</td>
              <td style="padding:10px 14px;font-size:13px;font-weight:700;color:#1e293b;">${data.reportedBy}</td>
            </tr>
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:10px 14px;font-size:12px;color:#94a3b8;">Opis niezgodności</td>
              <td style="padding:10px 14px;font-size:13px;font-weight:600;color:#1e293b;">${data.description}</td>
            </tr>
            ${data.batchNumber ? `<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 14px;font-size:12px;color:#94a3b8;">Nr Partii</td><td style="padding:10px 14px;font-size:13px;font-weight:700;color:#7c3aed;">${data.batchNumber}</td></tr>` : ''}
            ${data.quantityAffected ? `<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 14px;font-size:12px;color:#94a3b8;">Ilość zakwest.</td><td style="padding:10px 14px;font-size:13px;font-weight:700;color:#1e293b;">${data.quantityAffected}</td></tr>` : ''}
            ${data.assignedToName ? `<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 14px;font-size:12px;color:#94a3b8;">Przypisano do</td><td style="padding:10px 14px;font-size:13px;font-weight:700;color:#1e293b;">${data.assignedToName}</td></tr>` : ''}
            ${data.areaName ? `<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 14px;font-size:12px;color:#94a3b8;">Obszar</td><td style="padding:10px 14px;font-size:13px;font-weight:600;color:#1e293b;">${data.areaName}</td></tr>` : ''}
            ${data.machineName ? `<tr><td style="padding:10px 14px;font-size:12px;color:#94a3b8;">Maszyna</td><td style="padding:10px 14px;font-size:13px;font-weight:600;color:#1e293b;">${data.machineName}</td></tr>` : ''}
          </table>

          ${data.photoUrl ? `
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            <tr><td style="padding:12px 16px;background:#f5f3ff;border:1px solid #a78bfa;border-radius:8px;font-size:13px;color:#5b21b6;">
              📷 <a href="${baseUrl}${data.photoUrl.split(',')[0]}" style="color:#7c3aed;font-weight:700;">Kliknij, aby otworzyć załączone zdjęcie</a>
            </td></tr>
          </table>` : ''}

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            <tr><td align="center" style="padding:16px;">
              <a href="${baseUrl}/jakosc" style="display:inline-block;padding:12px 28px;background:#7c3aed;color:#ffffff;font-size:14px;font-weight:700;border-radius:8px;text-decoration:none;">
                Otwórz Zgłoszenia Jakości →
              </a>
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e2e8f0;">
            <tr><td style="padding-top:14px;font-size:11px;color:#94a3b8;text-align:center;">
              Wiadomość wygenerowana automatycznie przez <strong>AuditApp</strong>
            </td></tr>
          </table>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export function downloadQualityEml(data: QualityEmailData, toEmails: string, baseUrl: string): void {
  const subject = `[Jakość] 📦 Zgłoszenie: ${data.title}`;
  const html = buildQualityEmailHtml(data, baseUrl);
  const b64Subject = btoa(unescape(encodeURIComponent(subject)));
  const emlContent = [
    'MIME-Version: 1.0',
    'X-Unsent: 1',
    `To: ${toEmails}`,
    `Subject: =?UTF-8?B?${b64Subject}?=`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    btoa(unescape(encodeURIComponent(html))),
  ].join('\r\n');

  const safeTitle = (data?.title || 'Jakosc').replace(/\s+/g, '_').slice(0, 40);
  const blob = new Blob([emlContent], { type: 'message/rfc822' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Jakosc_${safeTitle}.eml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
