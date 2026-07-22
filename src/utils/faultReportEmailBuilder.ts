// Builds an Outlook-compatible HTML EML email for new fault report notifications
// Uses table-based layout (Outlook does not support flexbox/grid)

export interface FaultReportEmailData {
  id: string;
  title: string;
  description: string;
  severity: string;
  reportedBy: string;
  dueDate?: Date | string | null;
  areaName?: string | null;
  machineName?: string | null;
  assignedToName?: string | null;
  photoUrl?: string | null;
}

export function buildFaultReportEmailHtml(data: FaultReportEmailData, baseUrl: string): string {
  const sevLabel =
    data.severity === 'CRITICAL' ? '🔴 Krytyczna' :
    data.severity === 'MODERATE' ? '🟡 Umiarkowana' : '🟢 Mało istotna';

  const sevColor =
    data.severity === 'CRITICAL' ? '#dc2626' :
    data.severity === 'MODERATE' ? '#d97706' : '#16a34a';

  const sevBg =
    data.severity === 'CRITICAL' ? '#fef2f2' :
    data.severity === 'MODERATE' ? '#fffbeb' : '#f0fdf4';

  const sevBorder =
    data.severity === 'CRITICAL' ? '#fca5a5' :
    data.severity === 'MODERATE' ? '#fcd34d' : '#86efac';

  const dateStr = new Date().toLocaleString('pl-PL');
  const dueStr = data.dueDate ? new Date(data.dueDate).toLocaleDateString('pl-PL') : 'Nie ustalono';

  return `<!DOCTYPE html>
<html lang="pl">
<head><meta charset="UTF-8"/><title>Nowe Zgłoszenie Usterki</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;">
  <tr><td align="center" style="padding:24px 16px;">

    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

      <!-- HEADER -->
      <tr>
        <td style="background:#991b1b;padding:24px 28px;">
          <div style="font-size:11px;font-weight:700;color:#fca5a5;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">System AuditApp — Powiadomienie</div>
          <div style="font-size:20px;font-weight:800;color:#ffffff;">⚠️ Nowe Zgłoszenie Usterki</div>
          <div style="margin-top:6px;font-size:12px;color:#fecaca;">${dateStr}</div>
        </td>
      </tr>

      <!-- BODY -->
      <tr>
        <td style="padding:24px 28px;">

          <!-- SEVERITY BADGE -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            <tr>
              <td>
                <table cellpadding="0" cellspacing="0" style="background:${sevBg};border:2px solid ${sevBorder};border-radius:10px;">
                  <tr><td style="padding:12px 20px;font-size:16px;font-weight:800;color:${sevColor};">
                    ${sevLabel} &nbsp;&nbsp; ${data.title}
                  </td></tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- DETAILS TABLE -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            <tr style="background:#f8fafc;">
              <td colspan="2" style="padding:10px 14px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #e2e8f0;">
                Szczegóły Zgłoszenia
              </td>
            </tr>
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:10px 14px;font-size:12px;color:#94a3b8;width:140px;">Opis usterki</td>
              <td style="padding:10px 14px;font-size:13px;font-weight:600;color:#1e293b;">${data.description}</td>
            </tr>
            ${data.areaName ? `<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 14px;font-size:12px;color:#94a3b8;">Obszar / Rejon</td><td style="padding:10px 14px;font-size:13px;font-weight:600;color:#1e293b;">${data.areaName}</td></tr>` : ''}
            ${data.machineName ? `<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 14px;font-size:12px;color:#94a3b8;">Maszyna / Linia</td><td style="padding:10px 14px;font-size:13px;font-weight:600;color:#1e293b;">${data.machineName}</td></tr>` : ''}
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:10px 14px;font-size:12px;color:#94a3b8;">Zgłosił(a)</td>
              <td style="padding:10px 14px;font-size:13px;font-weight:600;color:#1e293b;">${data.reportedBy}</td>
            </tr>
            ${data.assignedToName ? `<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 14px;font-size:12px;color:#94a3b8;">Przypisano do</td><td style="padding:10px 14px;font-size:13px;font-weight:700;color:#2563eb;">${data.assignedToName}</td></tr>` : ''}
            <tr>
              <td style="padding:10px 14px;font-size:12px;color:#94a3b8;">Termin naprawy</td>
              <td style="padding:10px 14px;font-size:13px;font-weight:600;color:${data.dueDate ? '#dc2626' : '#94a3b8'};">${dueStr}</td>
            </tr>
          </table>

          ${data.photoUrl ? `
          <!-- PHOTO LINK -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            <tr><td style="padding:12px 16px;background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;font-size:13px;color:#1e40af;">
              📷 <a href="${baseUrl}${data.photoUrl}" style="color:#2563eb;font-weight:700;">Kliknij, aby otworzyć zdjęcie usterki</a>
            </td></tr>
          </table>` : ''}

          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            <tr><td align="center" style="padding:16px;">
              <a href="${baseUrl}/usterki" style="display:inline-block;padding:12px 28px;background:#dc2626;color:#ffffff;font-size:14px;font-weight:700;border-radius:8px;text-decoration:none;">
                Otwórz Zgłoszenie w Systemie →
              </a>
            </td></tr>
          </table>

          <!-- LEGAL SIGNATURE CLAUSE -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;background:#0f172a;border-radius:8px;">
            <tr><td style="padding:14px 18px;font-size:11px;color:#e2e8f0;">
              <div style="font-weight:800;color:#fbbf24;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">✒️ Klauzula Podpisu Elektronicznego</div>
              Otwarcie i wgląd w niniejszy formularz z poziomu zidentyfikowanego indywidualnego konta w systemie AuditApp stanowi prawnie wiążące zapoznanie się z dokumentem i złożenie podpisu cyfrowego.
            </td></tr>
          </table>

          <!-- FOOTER -->
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

export function buildFaultReportEml(data: FaultReportEmailData, toEmails: string, subject: string, baseUrl: string): string {
  const html = buildFaultReportEmailHtml(data, baseUrl);
  const b64Subject = btoa(unescape(encodeURIComponent(subject)));
  return [
    'MIME-Version: 1.0',
    `To: ${toEmails}`,
    `Subject: =?UTF-8?B?${b64Subject}?=`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    btoa(unescape(encodeURIComponent(html))),
  ].join('\r\n');
}

export function downloadFaultReportEml(data: FaultReportEmailData, toEmails: string, baseUrl: string): void {
  const subject = `[Usterka] ${data.severity === 'CRITICAL' ? '🔴 KRYTYCZNA' : '⚠️'} ${data.title}`;
  const eml = buildFaultReportEml(data, toEmails, subject, baseUrl);
  const blob = new Blob([eml], { type: 'message/rfc822' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Usterka_${data.title.replace(/\s+/g, '_').slice(0, 40)}.eml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
