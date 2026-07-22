export interface AuditEmailData {
  id: string;
  title: string;
  auditTypeName?: string;
  createdAt: string | Date;
  areaName?: string;
  machineName?: string;
  customNote?: string;
  observations: {
    id: string;
    description: string;
    aiSuggestion?: string | null;
    severity?: string | null;
    isFixed: boolean;
    assignedToName?: string | null;
    dueDate?: string | Date | null;
    photoUrl?: string | null;
  }[];
}

export function buildAuditReportEmailHtml(data: AuditEmailData): string {
  const dateStr = new Date(data.createdAt).toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const pendingCount = data.observations.filter(
    o => !o.isFixed && !(o.severity || '').toLowerCase().includes('pozytyw') && !(o.severity || '').toLowerCase().includes('dobra praktyka')
  ).length;

  const fixedCount = data.observations.filter(o => o.isFixed).length;

  const positiveCount = data.observations.filter(
    o => (o.severity || '').toLowerCase().includes('pozytyw') || (o.severity || '').toLowerCase().includes('dobra praktyka')
  ).length;

  const obsRowsHtml = data.observations.map((obs, idx) => {
    const sevText = obs.severity || 'Brak wagi';
    const isPositive = sevText.toLowerCase().includes('pozytyw') || sevText.toLowerCase().includes('dobra praktyka');
    const statusLabel = obs.isFixed ? '✅ Wykonane' : (isPositive ? '🟢 Dobra Praktyka' : '🔴 W trakcie / Do naprawy');
    const statusBg = obs.isFixed ? '#d1fae5' : (isPositive ? '#ecfdf5' : '#fee2e2');
    const statusColor = obs.isFixed ? '#065f46' : (isPositive ? '#047857' : '#991b1b');

    const dueStr = obs.dueDate ? new Date(obs.dueDate).toLocaleDateString('pl-PL') : '-';
    const hasPhoto = !!obs.photoUrl;

    return `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px; font-weight: bold; color: #475569; text-align: center;">${idx + 1}</td>
        <td style="padding: 12px; color: #1e293b;">
          <div>${obs.description}</div>
          ${hasPhoto ? `<div style="font-size: 11px; color: #2563eb; margin-top: 4px; font-weight: bold;">📷 Załącznik graficzny #${idx + 1}</div>` : ''}
        </td>
        <td style="padding: 12px; color: #334155; font-size: 12px; font-weight: 600;">${sevText}</td>
        <td style="padding: 12px; color: #475569; font-size: 12px;">${obs.assignedToName || 'Nieprzypisano'}</td>
        <td style="padding: 12px; color: #475569; font-size: 12px; text-align: center;">${dueStr}</td>
        <td style="padding: 12px; text-align: center;">
          <span style="display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; background-color: ${statusBg}; color: ${statusColor};">
            ${statusLabel}
          </span>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="pl">
    <head>
      <meta charset="UTF-8">
      <title>Raport Audytu - AuditApp</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
      <div style="max-width: 720px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 32px; color: #ffffff;">
          <div style="font-size: 12px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; color: #818cf8; margin-bottom: 8px;">
            System Audytów Zakładowych • AuditApp
          </div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">
            ${data.title}
          </h1>
          <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap; font-size: 13px; color: #c7d2fe;">
            ${data.auditTypeName ? `<span style="background: rgba(255,255,255,0.15); padding: 4px 10px; border-radius: 6px; font-weight: 700; color: #ffffff;">🏷️ ${data.auditTypeName}</span>` : ''}
            <span style="background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 6px;">📅 ${dateStr}</span>
            ${data.areaName ? `<span style="background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 6px;">🏭 ${data.areaName}</span>` : ''}
            ${data.machineName ? `<span style="background: rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 6px;">⚙️ ${data.machineName}</span>` : ''}
          </div>
        </div>

        <!-- Custom Auditor Note -->
        ${data.customNote ? `
          <div style="margin: 24px 32px 0 32px; padding: 16px; background-color: #f0f9ff; border-left: 4px solid #0284c7; border-radius: 8px;">
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #0369a1; margin-bottom: 4px;">Wiadomość od Audytora:</div>
            <div style="font-size: 14px; color: #0c4a6e; line-height: 1.5;">${data.customNote}</div>
          </div>
        ` : ''}

        <!-- Summary Statistics -->
        <div style="padding: 24px 32px; display: table; width: 100%; box-sizing: border-box;">
          <div style="display: table-row;">
            <div style="display: table-cell; width: 33%; padding-right: 8px;">
              <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 12px; border-radius: 12px; text-align: center;">
                <div style="font-size: 20px; font-weight: 800; color: #dc2626;">${pendingCount}</div>
                <div style="font-size: 11px; font-weight: 700; color: #991b1b; text-transform: uppercase; margin-top: 2px;">Do naprawy</div>
              </div>
            </div>
            <div style="display: table-cell; width: 33%; padding: 0 4px;">
              <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 12px; border-radius: 12px; text-align: center;">
                <div style="font-size: 20px; font-weight: 800; color: #059669;">${fixedCount}</div>
                <div style="font-size: 11px; font-weight: 700; color: #065f46; text-transform: uppercase; margin-top: 2px;">Wykonane</div>
              </div>
            </div>
            <div style="display: table-cell; width: 33%; padding-left: 8px;">
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 12px; text-align: center;">
                <div style="font-size: 20px; font-weight: 800; color: #16a34a;">${positiveCount}</div>
                <div style="font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase; margin-top: 2px;">Pozytywy</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Observations Table -->
        <div style="padding: 0 32px 32px 32px;">
          <h2 style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0;">
            Lista Spostrzeżeń i Usterki Audytowej (${data.observations.length})
          </h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left;">
            <thead>
              <tr style="background-color: #f1f5f9; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
                <th style="padding: 10px 12px; border-radius: 8px 0 0 8px;">#</th>
                <th style="padding: 10px 12px;">Opis zdarzenia</th>
                <th style="padding: 10px 12px;">Waga</th>
                <th style="padding: 10px 12px;">Przypisany</th>
                <th style="padding: 10px 12px; text-align: center;">Termin</th>
                <th style="padding: 10px 12px; text-align: center; border-radius: 0 8px 8px 0;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${obsRowsHtml}
            </tbody>
          </table>
        </div>

        <!-- Electronic Signature Legal Clause Banner -->
        <div style="margin: 0 32px 24px 32px; padding: 16px; background-color: #0f172a; border-radius: 12px; color: #ffffff;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #fbbf24; letter-spacing: 0.5px; margin-bottom: 6px;">
            ✒️ KLAUZULA PODPISU ELEKTRONICZNEGO I ZAPOZNANIA SIĘ Z DOKUMENTEM
          </div>
          <div style="font-size: 12px; color: #e2e8f0; line-height: 1.5;">
            Zgodnie z procedurami zakładowymi, wszyscy pracownicy posiadają indywidualne konta w systemie <strong>AuditApp</strong>. Otwarcie niniejszego formularza i wgląd w raport przez zidentyfikowanego użytkownika jest prawnie uznawane za złożenie elektronicznego podpisu cyfrowego oraz potwierdzenie zapoznania się z treścią dokumentu.
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b;">
          Wiadomość została wygenerowana automatycznie z systemu <strong>AuditApp</strong>.<br>
          Zaloguj się do aplikacji, aby zobaczyć szczegóły lub zaktualizować status zadania.
        </div>

      </div>
    </body>
    </html>
  `;
}
