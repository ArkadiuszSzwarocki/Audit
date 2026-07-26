/**
 * Builds an Outlook-compatible HTML EML email for BHP hazard notifications
 */

export interface BhpEmailData {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  reportedBy: string;
  areaName?: string | null;
  machineName?: string | null;
  assignedToName?: string | null;
  dueDate?: string | null;
  photoUrl?: string | null;
}

const CATEGORY_MAP: Record<string, string> = {
  NEAR_MISS: '⚠️ Near Miss',
  UNSAFE_COND: '🛠️ Niebezpieczne Warunki',
  UNSAFE_BEHAVIOR: '🚷 Niebezpieczne Zachowanie',
  FIRE_HAZARD: '🔥 Zagrożenie Pożarowe',
  PPE: '🥽 Brak ŚOI',
};

const SEVERITY_MAP: Record<string, string> = {
  CRITICAL: '🔴 Wysokie Ryzyko',
  MODERATE: '🟡 Średnie Ryzyko',
  LOW: '🟢 Niskie Ryzyko',
};

function buildBhpEmailHtml(data: BhpEmailData, baseUrl: string): string {
  const dateStr = new Date().toLocaleString('pl-PL');
  const catLabel = CATEGORY_MAP[data.category] ?? data.category;
  const sevLabel = SEVERITY_MAP[data.severity] ?? data.severity;

  return `<!DOCTYPE html>
<html lang="pl">
<head><meta charset="UTF-8"/><title>Zgłoszenie BHP</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;">
  <tr><td align="center" style="padding:24px 16px;">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
      <tr>
        <td style="background:#dc2626;padding:24px 28px;">
          <div style="font-size:11px;font-weight:700;color:#fecaca;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">System AuditApp — BHP</div>
          <div style="font-size:20px;font-weight:800;color:#ffffff;">🛡️ Nowe Zgłoszenie Zagrożenia BHP</div>
          <div style="margin-top:6px;font-size:12px;color:#fca5a5;">${dateStr}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            <tr><td>
              <table cellpadding="0" cellspacing="0" style="background:#fef2f2;border:2px solid #fca5a5;border-radius:10px;width:100%;">
                <tr><td style="padding:14px 20px;font-size:16px;font-weight:800;color:#991b1b;">
                  🛡️ ${data.title}
                </td></tr>
              </table>
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            <tr style="background:#f8fafc;">
              <td colspan="2" style="padding:10px 14px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #e2e8f0;">
                Szczegóły Zdarzenia BHP
              </td>
            </tr>
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:10px 14px;font-size:12px;color:#94a3b8;width:140px;">Kategoria</td>
              <td style="padding:10px 14px;font-size:13px;font-weight:700;color:#1e293b;">${catLabel}</td>
            </tr>
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:10px 14px;font-size:12px;color:#94a3b8;">Ryzyko</td>
              <td style="padding:10px 14px;font-size:13px;font-weight:700;color:#dc2626;">${sevLabel}</td>
            </tr>
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:10px 14px;font-size:12px;color:#94a3b8;">Zgłaszający</td>
              <td style="padding:10px 14px;font-size:13px;font-weight:700;color:#1e293b;">${data.reportedBy}</td>
            </tr>
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:10px 14px;font-size:12px;color:#94a3b8;">Opis zagrożenia</td>
              <td style="padding:10px 14px;font-size:13px;font-weight:600;color:#1e293b;">${data.description}</td>
            </tr>
            ${data.assignedToName ? `<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 14px;font-size:12px;color:#94a3b8;">Przypisano do</td><td style="padding:10px 14px;font-size:13px;font-weight:700;color:#1e293b;">${data.assignedToName}</td></tr>` : ''}
            ${data.areaName ? `<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 14px;font-size:12px;color:#94a3b8;">Obszar</td><td style="padding:10px 14px;font-size:13px;font-weight:600;color:#1e293b;">${data.areaName}</td></tr>` : ''}
            ${data.machineName ? `<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 14px;font-size:12px;color:#94a3b8;">Maszyna</td><td style="padding:10px 14px;font-size:13px;font-weight:600;color:#1e293b;">${data.machineName}</td></tr>` : ''}
            ${data.dueDate ? `<tr><td style="padding:10px 14px;font-size:12px;color:#94a3b8;">Termin eliminacji</td><td style="padding:10px 14px;font-size:13px;font-weight:700;color:#d97706;">${new Date(data.dueDate).toLocaleDateString('pl-PL')}</td></tr>` : ''}
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            <tr><td align="center" style="padding:16px;">
              <a href="${baseUrl}/bhp" style="display:inline-block;padding:12px 28px;background:#dc2626;color:#ffffff;font-size:14px;font-weight:700;border-radius:8px;text-decoration:none;">
                Otwórz Zgłoszenia BHP →
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

export function downloadBhpEml(data: BhpEmailData, toEmails: string, baseUrl: string): void {
  const subject = `[BHP] 🛡️ Zgłoszenie: ${data.title}`;
  const html = buildBhpEmailHtml(data, baseUrl);
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

  const safeTitle = (data?.title || 'BHP').replace(/\s+/g, '_').slice(0, 40);
  const blob = new Blob([emlContent], { type: 'message/rfc822' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BHP_${safeTitle}.eml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
