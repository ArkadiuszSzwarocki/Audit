/**
 * Email builder dla powiadomienia o zakończeniu audytu
 */

export interface AuditCompletionEmailData {
  id: string;
  title: string;
  areaName: string;
  auditTypeName: string;
  percentage: number;
  completedAt: string;
}

export function buildAuditCompletionEmailHtml(data: AuditCompletionEmailData): string {
  const bgColor = data.percentage >= 80 ? '#10b981' : data.percentage >= 60 ? '#f59e0b' : '#ef4444';
  const statusText = data.percentage >= 80 ? '✅ ZDANY' : data.percentage >= 60 ? '⚠️ WARUNKOWY' : '❌ NIEZDANY';

  return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background-color: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
    .content { padding: 30px; }
    .status-box { background-color: ${bgColor}; color: white; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px; }
    .status-box .percentage { font-size: 48px; font-weight: 900; margin: 10px 0; }
    .status-box .label { font-size: 14px; font-weight: 600; opacity: 0.9; }
    .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
    .info-row .label { color: #6b7280; font-weight: 600; }
    .info-row .value { color: #1f2937; font-weight: 500; }
    .info-row:last-child { border-bottom: none; }
    .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb; }
    a { color: #667eea; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <!-- HEADER -->
    <div class="header">
      <h1>📊 Audyt Zakończony</h1>
    </div>

    <!-- CONTENT -->
    <div class="content">
      <!-- STATUS BOX -->
      <div class="status-box">
        <div class="label">WYNIK AUDYTU</div>
        <div class="percentage">${data.percentage}%</div>
        <div class="label">${statusText}</div>
      </div>

      <!-- DETAILS -->
      <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
        <div class="info-row">
          <span class="label">📋 Audyt:</span>
          <span class="value">${data.title}</span>
        </div>
        <div class="info-row">
          <span class="label">🏭 Hala:</span>
          <span class="value">${data.areaName}</span>
        </div>
        <div class="info-row">
          <span class="label">📌 Typ:</span>
          <span class="value">${data.auditTypeName}</span>
        </div>
        <div class="info-row">
          <span class="label">⏰ Zakończono:</span>
          <span class="value">${data.completedAt}</span>
        </div>
      </div>

      <p style="color: #6b7280; line-height: 1.6; margin-top: 16px;">
        ${data.percentage >= 80 
          ? '✅ Audyt został pomyślnie zakończony z pozytywnym wynikiem. Gratulacje zespołowi!'
          : data.percentage >= 60
          ? '⚠️ Audyt wymagał pewnych popraw. Prosimy o niezwłoczne podjęcie działań naprawczych.'
          : '❌ Audyt wykazał znaczące niezgodności. Wymagane jest natychmiastowe podjęcie działań naprawczych.'}
      </p>
    </div>

    <!-- FOOTER -->
    <div class="footer">
      Raport wygenerowany przez <strong>AuditApp</strong>
      <br>
      <a href="http://localhost:3000/audyty/${data.id}">Otwórz szczegóły audytu w systemie</a>
    </div>
  </div>
</body>
</html>`;
}
