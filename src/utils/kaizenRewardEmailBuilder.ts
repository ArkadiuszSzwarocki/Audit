/**
 * EML Email Builder for Kaizen Reward Payout Requests
 */

export interface KaizenRewardEmailData {
  docNumber?: string;
  userName: string;
  userLogin: string;
  bankAccount: string;
  pointsCount: number;
  kaizensCount: number;
  rewardType: string;
  notes?: string;
  createdAt: string;
}

export function downloadKaizenRewardEml(
  data: KaizenRewardEmailData,
  toEmails: string,
  baseUrl: string
): void {
  const now = new Date();
  const dateStr = new Date(data.createdAt).toLocaleString('pl-PL');
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const docNum = data.docNumber || `WN/KAIZEN/${year}/${month}/${Math.floor(1000 + Math.random() * 9000)}`;

  const subject = `[KAIZEN] 🎁 Wniosek o Wypłatę Nagrody ${docNum} — ${data.userName}`;

  const html = `<!DOCTYPE html>
<html lang="pl">
<head><meta charset="UTF-8"/><title>Wniosek o Wypłatę Nagrody Kaizen</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;">
  <tr><td align="center" style="padding:24px 16px;">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);border:1px solid #e2e8f0;">
      <tr>
        <td style="background:linear-gradient(135deg, #d97706 0%, #b45309 100%);padding:28px;">
          <div style="font-size:11px;font-weight:800;color:#fef3c7;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:4px;">ZAŁĄCZNIK NR 3 DO REGULAMINU PROGRAMU KAIZEN</div>
          <div style="font-size:20px;font-weight:800;color:#ffffff;">🎁 Wniosek o Wypłatę Nagrody / Premii</div>
          <div style="margin-top:6px;font-size:12px;color:#fde68a;"><strong>Nr wniosku:</strong> ${docNum} | Złożono: ${dateStr}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:28px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            <tr><td>
              <table cellpadding="0" cellspacing="0" style="background:#fffbeb;border:2px solid #fcd34d;border-radius:12px;width:100%;">
                <tr><td style="padding:16px 20px;font-size:16px;font-weight:800;color:#78350f;">
                  👤 Wnioskodawca: ${data.userName} (@${data.userLogin})
                </td></tr>
              </table>
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
            <tr style="background:#f8fafc;">
              <td colspan="2" style="padding:12px 16px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #e2e8f0;">
                Szczegóły Wniosku o Wypłatę (Załącznik nr 3)
              </td>
            </tr>
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:12px 16px;font-size:12px;color:#64748b;">Rodzaj Wniosku / Nagrody</td>
              <td style="padding:12px 16px;font-size:13px;font-weight:700;color:#d97706;">${data.rewardType}</td>
            </tr>
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:12px 16px;font-size:12px;color:#64748b;">Liczba punktów w systemie</td>
              <td style="padding:12px 16px;font-size:13px;font-weight:800;color:#1e293b;">⭐ ${data.pointsCount} pkt</td>
            </tr>
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:12px 16px;font-size:12px;color:#64748b;">Zgłoszone pomysły Kaizen</td>
              <td style="padding:12px 16px;font-size:13px;font-weight:700;color:#1e293b;">💡 ${data.kaizensCount} wniosków</td>
            </tr>
            ${data.notes ? `<tr><td style="padding:12px 16px;font-size:12px;color:#64748b;">Uwagi / Uzasadnienie</td><td style="padding:12px 16px;font-size:13px;color:#334155;">${data.notes}</td></tr>` : ''}
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            <tr><td align="center" style="padding:16px;">
              <a href="${baseUrl}/kaizen" style="display:inline-block;padding:12px 28px;background:#d97706;color:#ffffff;font-size:14px;font-weight:700;border-radius:8px;text-decoration:none;">
                Otwórz Rejestr Kaizen →
              </a>
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e2e8f0;">
            <tr><td style="padding-top:14px;font-size:11px;color:#94a3b8;text-align:center;">
              Wniosek (Załącznik nr 3) wygenerowany automatycznie przez <strong>AuditApp — Program Kaizen</strong>
            </td></tr>
          </table>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

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
  a.download = `Wniosek_Wyplata_Kaizen_${docNum.replace(/\//g, '_')}.eml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
