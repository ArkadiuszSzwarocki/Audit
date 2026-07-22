'use client';

import { useState, useEffect } from 'react';

interface Observation {
  id: string;
  description: string;
  aiSuggestion?: string | null;
  severity?: string | null;
  isFixed: boolean;
  photoUrl?: string | null;
  fixPhotoUrl?: string | null;
  assignedTo?: { name: string } | null;
  dueDate?: string | Date | null;
}

interface AuditDetails {
  id: string;
  title: string;
  auditType?: { name: string } | null;
  area?: { name: string } | null;
  machine?: { name: string } | null;
  status: string;
  createdAt: string;
  observations?: Observation[];
}

interface SendAuditEmailModalProps {
  isOpen: boolean;
  auditId: string;
  auditTitle: string;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export function SendAuditEmailModal({
  isOpen,
  auditId,
  auditTitle,
  onClose,
  onSuccess,
}: SendAuditEmailModalProps) {
  const [recipientEmails, setRecipientEmails] = useState('');
  const [subject, setSubject] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [usersList, setUsersList] = useState<{ id: string; name: string; login: string }[]>([]);
  const [auditDetails, setAuditDetails] = useState<AuditDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSubject(`[Raport Audytu] ${auditTitle}`);
      setErrorMsg('');
      setRecipientEmails('');
      setCustomNote('');

      fetch('/api/users')
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setUsersList(data); })
        .catch(console.error);

      setLoading(true);
      fetch(`/api/audits/${auditId}`)
        .then((r) => r.json())
        .then((data) => setAuditDetails(data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, auditTitle, auditId]);

  if (!isOpen) return null;

  const handleAddUserEmail = (userLogin: string) => {
    const emailCandidate = userLogin.includes('@')
      ? userLogin
      : `${userLogin.toLowerCase().replace(/\s+/g, '.')}@auditapp.local`;
    const existing = recipientEmails.split(',').map((e) => e.trim()).filter(Boolean);
    if (!existing.includes(emailCandidate)) {
      existing.push(emailCandidate);
      setRecipientEmails(existing.join(', '));
    }
  };

  // Build full HTML body for the EML file
  const buildHtmlBody = (): string => {
    if (!auditDetails) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const obs = auditDetails.observations || [];
    const dateStr = new Date(auditDetails.createdAt).toLocaleString('pl-PL');

    const pendingCount = obs.filter(o => !o.isFixed && !(o.severity || '').toLowerCase().includes('pozytyw')).length;
    const fixedCount = obs.filter(o => o.isFixed).length;
    const positiveCount = obs.filter(o =>
      (o.severity || '').toLowerCase().includes('pozytyw') ||
      (o.severity || '').toLowerCase().includes('dobra praktyka')
    ).length;

    const obsRows = obs.map((o, idx) => {
      const sev = o.severity || 'Brak wagi';
      const isPos = sev.toLowerCase().includes('pozytyw') || sev.toLowerCase().includes('dobra praktyka');
      const statusText = o.isFixed ? '✅ Naprawione' : isPos ? '🟢 Dobra Praktyka' : '🔴 Do Naprawy';
      const rowBg = o.isFixed ? '#f0fdf4' : isPos ? '#f0fdf4' : '#fff7f7';
      const desc = o.description;
      const photoLink = o.photoUrl
        ? `<br/><a href="${baseUrl}${o.photoUrl}" style="color:#2563eb;font-weight:600;font-size:12px;" target="_blank">📷 Otwórz zdjęcie usterki</a>`
        : '';
      const fixPhotoLink = o.fixPhotoUrl
        ? `<br/><a href="${baseUrl}${o.fixPhotoUrl}" style="color:#16a34a;font-weight:600;font-size:12px;" target="_blank">📷 Otwórz zdjęcie naprawy</a>`
        : '';
      const dueStr = o.dueDate ? new Date(o.dueDate).toLocaleDateString('pl-PL') : '—';

      return `
        <tr style="background:${rowBg};border-bottom:1px solid #e2e8f0;">
          <td style="padding:10px 12px;font-weight:700;color:#64748b;text-align:center;width:40px;">${idx + 1}</td>
          <td style="padding:10px 12px;color:#1e293b;font-size:13px;">
            ${desc}
            ${photoLink}${fixPhotoLink}
          </td>
          <td style="padding:10px 12px;font-size:12px;font-weight:600;color:#475569;">${sev}</td>
          <td style="padding:10px 12px;font-size:12px;color:#475569;">${o.assignedTo?.name || '—'}</td>
          <td style="padding:10px 12px;font-size:12px;color:#475569;text-align:center;">${dueStr}</td>
          <td style="padding:10px 12px;font-size:12px;font-weight:700;text-align:center;">${statusText}</td>
        </tr>`;
    }).join('');

    const noteHtml = customNote.trim()
      ? `<div style="margin:20px 0;padding:16px;background:#fafaf9;border-left:4px solid #f59e0b;border-radius:8px;">
           <div style="font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Uwagi Audytora</div>
           <div style="font-size:13px;color:#44403c;">${customNote.trim()}</div>
         </div>`
      : '';

    return `<!DOCTYPE html>
<html lang="pl">
<head><meta charset="UTF-8"/><title>Raport Audytu</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;">
  <tr><td align="center" style="padding:24px 16px;">

    <table width="780" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

      <!-- HEADER -->
      <tr>
        <td style="background:#1e3a5f;padding:28px 32px;">
          <div style="font-size:11px;font-weight:700;color:#93c5fd;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">System AuditApp</div>
          <div style="font-size:22px;font-weight:800;color:#ffffff;margin:0;">${auditDetails.title}</div>
          <div style="margin-top:8px;font-size:13px;color:#bfdbfe;">${auditDetails.auditType?.name || 'Audyt'} &nbsp;|&nbsp; ${dateStr}</div>
        </td>
      </tr>

      <!-- BODY -->
      <tr>
        <td style="padding:28px 32px;">

          <!-- META INFO -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;font-size:13px;">
            ${auditDetails.area ? `<tr><td style="padding:5px 0;color:#94a3b8;width:150px;font-size:12px;">Obszar / Rejon</td><td style="padding:5px 0;font-weight:600;color:#1e293b;">${auditDetails.area.name}</td></tr>` : ''}
            ${auditDetails.machine ? `<tr><td style="padding:5px 0;color:#94a3b8;font-size:12px;">Maszyna / Linia</td><td style="padding:5px 0;font-weight:600;color:#1e293b;">${auditDetails.machine.name}</td></tr>` : ''}
            <tr><td style="padding:5px 0;color:#94a3b8;font-size:12px;">Status</td><td style="padding:5px 0;font-weight:700;color:${auditDetails.status === 'COMPLETED' ? '#059669' : '#d97706'};">${auditDetails.status === 'COMPLETED' ? 'Zakończony' : 'W trakcie'}</td></tr>
          </table>

          <!-- STATS — table layout (Outlook-safe) -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr>
              <td width="25%" style="padding-right:8px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:2px solid #fca5a5;border-radius:10px;">
                  <tr><td align="center" style="padding:16px 8px;">
                    <div style="font-size:32px;font-weight:900;color:#dc2626;line-height:1;">${pendingCount}</div>
                    <div style="font-size:11px;color:#ef4444;font-weight:700;margin-top:4px;text-transform:uppercase;letter-spacing:0.05em;">Do Naprawy</div>
                  </td></tr>
                </table>
              </td>
              <td width="25%" style="padding-right:8px;padding-left:8px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:2px solid #86efac;border-radius:10px;">
                  <tr><td align="center" style="padding:16px 8px;">
                    <div style="font-size:32px;font-weight:900;color:#16a34a;line-height:1;">${fixedCount}</div>
                    <div style="font-size:11px;color:#16a34a;font-weight:700;margin-top:4px;text-transform:uppercase;letter-spacing:0.05em;">Naprawione</div>
                  </td></tr>
                </table>
              </td>
              <td width="25%" style="padding-right:8px;padding-left:8px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:2px solid #93c5fd;border-radius:10px;">
                  <tr><td align="center" style="padding:16px 8px;">
                    <div style="font-size:32px;font-weight:900;color:#2563eb;line-height:1;">${positiveCount}</div>
                    <div style="font-size:11px;color:#2563eb;font-weight:700;margin-top:4px;text-transform:uppercase;letter-spacing:0.05em;">Dobre Praktyki</div>
                  </td></tr>
                </table>
              </td>
              <td width="25%" style="padding-left:8px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;border:2px solid #cbd5e1;border-radius:10px;">
                  <tr><td align="center" style="padding:16px 8px;">
                    <div style="font-size:32px;font-weight:900;color:#475569;line-height:1;">${obs.length}</div>
                    <div style="font-size:11px;color:#64748b;font-weight:700;margin-top:4px;text-transform:uppercase;letter-spacing:0.05em;">Łącznie</div>
                  </td></tr>
                </table>
              </td>
            </tr>
          </table>

          ${noteHtml}

          <!-- OBSERVATIONS TABLE -->
          <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;">Spostrzeżenia i Usterki</div>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;font-size:13px;">
            <tr style="background:#f8fafc;">
              <th style="padding:10px 8px;font-size:11px;color:#64748b;text-align:center;border-bottom:1px solid #e2e8f0;width:32px;">#</th>
              <th style="padding:10px 8px;font-size:11px;color:#64748b;text-align:left;border-bottom:1px solid #e2e8f0;">Opis</th>
              <th style="padding:10px 8px;font-size:11px;color:#64748b;text-align:left;border-bottom:1px solid #e2e8f0;width:110px;">Waga</th>
              <th style="padding:10px 8px;font-size:11px;color:#64748b;text-align:left;border-bottom:1px solid #e2e8f0;width:120px;">Przypisano</th>
              <th style="padding:10px 8px;font-size:11px;color:#64748b;text-align:center;border-bottom:1px solid #e2e8f0;width:80px;">Termin</th>
              <th style="padding:10px 8px;font-size:11px;color:#64748b;text-align:center;border-bottom:1px solid #e2e8f0;width:110px;">Status</th>
            </tr>
            ${obsRows}
          </table>

          <!-- FOOTER -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;border-top:1px solid #e2e8f0;">
            <tr><td align="center" style="padding-top:16px;font-size:11px;color:#94a3b8;">
              Raport wygenerowany przez <strong>AuditApp</strong> &nbsp;|&nbsp;
              <a href="${baseUrl}/audyty/${auditDetails.id}" style="color:#2563eb;">Otwórz audyt w systemie</a>
            </td></tr>
          </table>

        </td>
      </tr>
    </table>

  </td></tr>
</table>
</body>
</html>`;
  };

  // Generate and download EML file — opens directly in Outlook / Thunderbird
  const handleGenerateEml = () => {
    setErrorMsg('');

    if (!recipientEmails.trim()) {
      setErrorMsg('Podaj co najmniej jeden adres e-mail odbiorcy!');
      return;
    }

    const htmlBody = buildHtmlBody();

    // Encode subject as UTF-8 Base64 per RFC 2047
    const b64Subject = btoa(unescape(encodeURIComponent(subject)));

    const emlContent = [
      'MIME-Version: 1.0',
      `To: ${recipientEmails.trim()}`,
      `Subject: =?UTF-8?B?${b64Subject}?=`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      btoa(unescape(encodeURIComponent(htmlBody))),
    ].join('\r\n');

    const blob = new Blob([emlContent], { type: 'message/rfc822' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Raport_Audytu_${auditDetails?.title?.replace(/\s+/g, '_') ?? 'Audit'}.eml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onSuccess('Plik .eml został pobrany. Otwórz go, aby wysłać raport z Outlooka.');
    onClose();
  };

  const photoAttachments = (auditDetails?.observations || []).flatMap((o, idx) => {
    const items: { url: string; label: string }[] = [];
    if (o.photoUrl) items.push({ url: o.photoUrl, label: `Usterka_${idx + 1}_Zdjecie.jpg` });
    if (o.fixPhotoUrl) items.push({ url: o.fixPhotoUrl, label: `Usterka_${idx + 1}_Naprawa.jpg` });
    return items;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-xl w-full p-6 space-y-5 relative max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex justify-between items-start border-b pb-4 border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              📧 Wyślij Raport E-mailem
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Generuje plik <strong>.eml</strong> — otwórz go, aby wysłać z Outlooka z pełnym formatowaniem i klikalnymi linkami.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs font-bold text-red-600 dark:text-red-400">
            ⚠️ {errorMsg}
          </div>
        )}

        <div className="space-y-4">
          {/* Recipient Emails */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Adresy E-mail Odbiorców *
            </label>
            <input
              type="text"
              placeholder="np. jan.kowalski@zaklad.pl, kierownik@zaklad.pl"
              value={recipientEmails}
              onChange={(e) => setRecipientEmails(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500"
            />

            {usersList.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                <span className="text-[11px] font-bold text-slate-400">Szybki wybór:</span>
                {usersList.slice(0, 8).map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleAddUserEmail(u.login)}
                    className="px-2 py-1 rounded-md bg-slate-200 dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-brand-500 hover:text-white transition-all cursor-pointer"
                  >
                    + {u.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Temat Wiadomości *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Custom Note */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Uwagi Audytora (opcjonalnie)
            </label>
            <textarea
              rows={3}
              placeholder="np. Proszę o weryfikację usterek do piątku..."
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* How it works info box */}
          <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-1.5">
            <div className="text-xs font-bold text-indigo-800 dark:text-indigo-300">📋 Jak to działa?</div>
            <ol className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 list-decimal list-inside">
              <li>Kliknij <strong>&quot;Pobierz plik .eml&quot;</strong> — plik zostanie pobrany na Twój komputer.</li>
              <li>Otwórz pobrany plik — Outlook uruchomi się z gotową wiadomością HTML.</li>
              <li>Raport zawiera <strong>klikalne linki do zdjęć</strong>, tabelę usterek i statystyki.</li>
              <li>Dołącz zdjęcia ręcznie (jeśli chcesz) i kliknij Wyślij w Outlooku.</li>
            </ol>
          </div>

          {/* Photo Downloads */}
          {photoAttachments.length > 0 && (
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2">
              <div className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                <span>📎</span>
                <span>Pobierz zdjęcia jako załączniki ({photoAttachments.length})</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-1">
                {photoAttachments.map((att, i) => (
                  <a
                    key={i}
                    href={att.url}
                    download={att.label}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-lg text-[11px] font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-50 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    ⬇ {att.label}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Summary Preview */}
          {loading ? (
            <div className="text-xs text-slate-400 animate-pulse text-center p-4">Ładowanie danych audytu...</div>
          ) : auditDetails?.observations?.length ? (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 font-mono">
              Raport obejmie: <strong>{auditDetails.observations.length} spostrzeżeń</strong>
              {' • '}Do naprawy: <strong>{auditDetails.observations.filter(o => !o.isFixed && !(o.severity || '').toLowerCase().includes('pozytyw')).length}</strong>
              {' • '}Naprawione: <strong>{auditDetails.observations.filter(o => o.isFixed).length}</strong>
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Anuluj
          </button>
          <button
            type="button"
            onClick={handleGenerateEml}
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Pobierz plik .eml
          </button>
        </div>
      </div>
    </div>
  );
}
