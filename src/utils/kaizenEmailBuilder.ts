// Builds an Outlook-compatible HTML EML email for new Kaizen notifications
// Uses table-based layout (Outlook does not support flexbox/grid)

export interface KaizenEmailData {
  id: string;
  title: string;
  description: string;
  benefits?: string | null;
  submittedBy: string;
  areaName?: string | null;
  machineName?: string | null;
  photoUrl?: string | null;
}

export function buildKaizenEmailHtml(data: KaizenEmailData, baseUrl: string): string {
  const dateStr = new Date().toLocaleString('pl-PL');

  return `<!DOCTYPE html>
<html lang="pl">
<head><meta charset="UTF-8"/><title>Nowy Pomysł Kaizen</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;">
  <tr><td align="center" style="padding:24px 16px;">

    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

      <!-- HEADER -->
      <tr>
        <td style="background:#d97706;padding:24px 28px;">
          <div style="font-size:11px;font-weight:700;color:#fef3c7;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">System AuditApp — Kaizen</div>
          <div style="font-size:20px;font-weight:800;color:#ffffff;">💡 Nowy Pomysł Udoskonalenia (Kaizen)</div>
          <div style="margin-top:6px;font-size:12px;color:#fde68a;">${dateStr}</div>
        </td>
      </tr>

      <!-- BODY -->
      <tr>
        <td style="padding:24px 28px;">

          <!-- TITLE BOX -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            <tr>
              <td>
                <table cellpadding="0" cellspacing="0" style="background:#fffbeb;border:2px solid #fcd34d;border-radius:10px;width:100%;">
                  <tr><td style="padding:14px 20px;font-size:16px;font-weight:800;color:#92400e;">
                    💡 ${data.title}
                  </td></tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- DETAILS TABLE -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            <tr style="background:#f8fafc;">
              <td colspan="2" style="padding:10px 14px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #e2e8f0;">
                Szczegóły Pomysłu Kaizen
              </td>
            </tr>
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:10px 14px;font-size:12px;color:#94a3b8;width:140px;">Pomysłodawca</td>
              <td style="padding:10px 14px;font-size:13px;font-weight:700;color:#1e293b;">${data.submittedBy}</td>
            </tr>
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:10px 14px;font-size:12px;color:#94a3b8;">Opis i rozwiązanie</td>
              <td style="padding:10px 14px;font-size:13px;font-weight:600;color:#1e293b;">${data.description}</td>
            </tr>
            ${data.benefits ? `<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 14px;font-size:12px;color:#94a3b8;">Oczekiwane korzyści</td><td style="padding:10px 14px;font-size:13px;font-weight:700;color:#059669;">${data.benefits}</td></tr>` : ''}
            ${data.areaName ? `<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 14px;font-size:12px;color:#94a3b8;">Obszar / Rejon</td><td style="padding:10px 14px;font-size:13px;font-weight:600;color:#1e293b;">${data.areaName}</td></tr>` : ''}
            ${data.machineName ? `<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 14px;font-size:12px;color:#94a3b8;">Maszyna / Linia</td><td style="padding:10px 14px;font-size:13px;font-weight:600;color:#1e293b;">${data.machineName}</td></tr>` : ''}
          </table>

          ${data.photoUrl ? `
          <!-- PHOTO LINK -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            <tr><td style="padding:12px 16px;background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;font-size:13px;color:#1e40af;">
              📷 <a href="${baseUrl}${data.photoUrl}" style="color:#2563eb;font-weight:700;">Kliknij, aby otworzyć załączone zdjęcie</a>
            </td></tr>
          </table>` : ''}

          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            <tr><td align="center" style="padding:16px;">
              <a href="${baseUrl}/kaizen" style="display:inline-block;padding:12px 28px;background:#d97706;color:#ffffff;font-size:14px;font-weight:700;border-radius:8px;text-decoration:none;">
                Otwórz Listę Kaizen w Systemie →
              </a>
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

export function downloadKaizenEml(data: KaizenEmailData, toEmails: string, baseUrl: string): void {
  const subject = `[Kaizen] 💡 Nowy pomysł: ${data.title}`;
  const html = buildKaizenEmailHtml(data, baseUrl);
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

  const blob = new Blob([emlContent], { type: 'message/rfc822' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Kaizen_${data.title.replace(/\s+/g, '_').slice(0, 40)}.eml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
