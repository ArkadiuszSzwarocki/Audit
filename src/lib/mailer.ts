import nodemailer from 'nodemailer';
import { generateTicketToken } from './ticket-token';
import { prisma } from '@/config/db';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  secure: Number(process.env.EMAIL_SERVER_PORT) === 465, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

interface MailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

interface MailResult {
  success: boolean;
  error?: string;
  message?: string;
}

export const sendMail = async (options: MailOptions): Promise<MailResult> => {
  console.log('=== sendMail called ===');
  console.log('EMAIL_SERVER_HOST:', process.env.EMAIL_SERVER_HOST);
  console.log('EMAIL_SERVER_PORT:', process.env.EMAIL_SERVER_PORT);
  console.log('EMAIL_SERVER_USER:', process.env.EMAIL_SERVER_USER);
  console.log('Email to:', options.to);
  console.log('Email from:', options.from);
  console.log('Transporter exists:', !!transporter);
  
  if (!process.env.EMAIL_SERVER_HOST) {
    console.log('Email server not configured');
    return { 
      success: false, 
      error: 'Email server not configured' 
    };
  }

  try {
    console.log('Calling transporter.sendMail...');
    const mailOptions = {
      from: options.from || process.env.EMAIL_FROM,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text || options.html?.replace(/<[^>]*>/g, ''),
      html: options.html || options.text,
    };
    
    console.log('Mail options prepared:', { ...mailOptions, text: mailOptions.text?.substring(0, 50) });
    
    const result = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully to:', options.to);
    return { 
      success: true, 
      message: `Email sent successfully to ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Error sending email:', errorMessage);
    console.error('Error stack:', errorStack);
    console.error('Full error object:', error);
    return { 
      success: false, 
      error: `${errorMessage}. Stack: ${errorStack}`
    };
  }
};

/**
 * Sends a Help Desk notification email
 * Note: Always sends from EMAIL_FROM (WP.pl account) - the SMTP server doesn't allow sending from other addresses
 */
/**
 * Sends a Help Desk notification email with rich HTML card form
 */
export const sendHelpDeskNotification = async (
  ticketId: string,
  ticketTitle: string,
  type: 'NEW_TICKET' | 'STATUS_CHANGE' | 'ASSIGNMENT',
  recipientEmail: string | string[],
  additionalInfo?: Record<string, any>
): Promise<MailResult> => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  // Generate a secure, time-limited token for this ticket link (valid for 24 hours)
  const token = generateTicketToken(ticketId);
  const ticketUrl = `${baseUrl}/helpdesk?ticketId=${ticketId}&token=${token}`;

  let subject = '';
  let html = '';

  const createdAtFormatted = new Date().toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  if (type === 'NEW_TICKET') {
    const isPurchase = additionalInfo?.type === 'PURCHASE';
    const requiresApproval = isPurchase;
    const initialStatus = requiresApproval ? 'PENDING_APPROVAL' : 'OPEN';

    const displayType = isPurchase ? '🛒 Zapotrzebowanie / Zakupy' : '🛠️ Problem techniczny';
    const displayPriorityMap: Record<string, string> = {
      LOW: 'Niski',
      MEDIUM: 'Średni',
      HIGH: 'Wysoki',
      CRITICAL: '🚨 Krytyczny'
    };
    const displayPriority = displayPriorityMap[additionalInfo?.priority || 'MEDIUM'] || 'Średni';
    const createdBy = additionalInfo?.createdBy || 'Nieznany użytkownik';
    const description = additionalInfo?.description || 'Brak opisu';

    const statusBadgeMap: Record<string, string> = {
      OPEN: '<span style="background-color: #dbeafe; color: #1e40af; padding: 4px 10px; border-radius: 9999px; font-weight: 600; font-size: 12px; display: inline-block;">Otwarte</span>',
      PENDING_APPROVAL: '<span style="background-color: #f3e8ff; color: #6b21a8; padding: 4px 10px; border-radius: 9999px; font-weight: 600; font-size: 12px; display: inline-block;">Oczekuje na zatwierdzenie</span>',
    };
    const statusBadge = statusBadgeMap[initialStatus] || initialStatus;

    subject = requiresApproval
      ? `⚠️ [WYMAGA ZATWIERDZENIA ZARZĄDU] Nowe zgłoszenie #${ticketId.slice(0, 8)}: ${ticketTitle}`
      : `🆕 [BEZPOŚREDNIA REALIZACJA] Nowe zgłoszenie #${ticketId.slice(0, 8)}: ${ticketTitle}`;

    html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px;">
          <div style="max-width: 680px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
            
            <!-- Nagłówek -->
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 24px 32px; color: #ffffff;">
              <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #93c5fd; margin-bottom: 6px;">
                System Help Desk &bull; Nowe Zgłoszenie
              </div>
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; line-height: 1.3;">
                🆕 Nowy Ticket #${ticketId.slice(0, 8)}
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 14px; color: #dbeafe;">
                ${ticketTitle}
              </p>
            </div>

            <div style="padding: 28px 32px;">

              <!-- WYRAŹNA INFORMACJA CZY DO ZATWIERDZENIA CZY NIE -->
              ${requiresApproval ? `
              <div style="background-color: #fef3c7; border: 1px solid #fde68a; border-left: 5px solid #d97706; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
                <div style="font-size: 15px; font-weight: 800; color: #92400e; margin-bottom: 4px;">
                  ⚠️ WYMAGA ZATWIERDZENIA ZARZĄDU
                </div>
                <p style="margin: 0; font-size: 13.5px; color: #78350f; line-height: 1.5;">
                  Ten ticket dotyczy zakupu / zapotrzebowania. Przed skierowaniem do zespołu Help Desk i realizacją wymagana jest weryfikacja i akceptacja przez Zarząd.
                </p>
              </div>` : `
              <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-left: 5px solid #10b981; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
                <div style="font-size: 15px; font-weight: 800; color: #065f46; margin-bottom: 4px;">
                  ✅ NIE WYMAGA ZATWIERDZENIA ZARZĄDU
                </div>
                <p style="margin: 0; font-size: 13.5px; color: #047857; line-height: 1.5;">
                  Zgłoszenie nie wymaga akceptacji kierownictwa. Zostało skierowane bezpośrednio do zespołu Help Desk IT w celu natychmiastowej realizacji.
                </p>
              </div>`}

              <!-- Formularz HTML z pełnymi danymi ticketu -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
                <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 14px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">
                  📋 Formularz Zgłoszenia
                </h3>
                
                <table style="width: 100%; border-collapse: collapse; font-size: 13.5px; color: #334155;">
                  <tr>
                    <td style="padding: 6px 0; width: 40%; font-weight: 600; color: #64748b;">Tytuł zgłoszenia:</td>
                    <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${ticketTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Typ zgłoszenia:</td>
                    <td style="padding: 6px 0;">${displayType}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Wymaga zatwierdzenia:</td>
                    <td style="padding: 6px 0;">${requiresApproval ? '<span style="color: #d97706; font-weight: 700;">TAK (Zarząd)</span>' : '<span style="color: #10b981; font-weight: 700;">NIE (Bezpośrednia realizacja)</span>'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Status początkowy:</td>
                    <td style="padding: 6px 0;">${statusBadge}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Priorytet:</td>
                    <td style="padding: 6px 0; font-weight: 600;">${displayPriority}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Zgłaszający:</td>
                    <td style="padding: 6px 0;">${createdBy}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Data zgłoszenia:</td>
                    <td style="padding: 6px 0;">${createdAtFormatted}</td>
                  </tr>
                </table>

                <div style="margin-top: 14px; pt: 10px; border-top: 1px dashed #cbd5e1;">
                  <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">
                    Opis zgłoszonego problemu / zapotrzebowania:
                  </div>
                  <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; font-size: 13px; color: #334155; white-space: pre-wrap; word-break: break-word;">${description}</div>
                </div>
              </div>

              <!-- Przycisk przejścia do ticketu -->
              <div style="text-align: center; margin: 28px 0 16px 0;">
                <a href="${ticketUrl}" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; padding: 13px 26px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14.5px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.25);">
                  Otwórz ticket w systemie Help Desk &rarr;
                </a>
              </div>

            </div>

            <!-- Stopka -->
            <div style="background-color: #f1f5f9; padding: 16px 32px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b;">
              Wiadomość wygenerowana automatycznie przez System Help Desk &bull; ${new Date().toLocaleString('pl-PL')}
            </div>
          </div>
        </body>
      </html>
    `;
  } else if (type === 'STATUS_CHANGE') {
    subject = `🔄 Zmiana statusu zgłoszenia #${ticketId.slice(0, 8)}: ${ticketTitle}`;
    html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px;">
          <div style="max-width: 680px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 24px 32px; color: #ffffff;">
              <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #93c5fd; margin-bottom: 6px;">System Help Desk</div>
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff;">🔄 Zmiana Statusu Zgłoszenia</h1>
              <p style="margin: 6px 0 0 0; font-size: 14px; color: #dbeafe;">${ticketTitle}</p>
            </div>
            <div style="padding: 28px 32px;">
              <p><strong>Stary status:</strong> ${additionalInfo?.oldStatus || 'Nieznany'}</p>
              <p><strong>Nowy status:</strong> ${additionalInfo?.newStatus || 'Nieznany'}</p>
              <div style="text-align: center; margin: 28px 0 16px 0;">
                <a href="${ticketUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block;">
                  Otwórz zgłoszenie &rarr;
                </a>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  } else {
    subject = `👤 Przypisanie zgłoszenia #${ticketId.slice(0, 8)}: ${ticketTitle}`;
    html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px;">
          <div style="max-width: 680px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
            <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 24px 32px; color: #ffffff;">
              <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #93c5fd; margin-bottom: 6px;">System Help Desk</div>
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff;">👤 Przypisanie Zgłoszenia</h1>
              <p style="margin: 6px 0 0 0; font-size: 14px; color: #dbeafe;">${ticketTitle}</p>
            </div>
            <div style="padding: 28px 32px;">
              <p><strong>Przypisano do:</strong> ${additionalInfo?.assignedTo || 'Nieznany'}</p>
              <p><strong>Przypisane przez:</strong> ${additionalInfo?.assignedBy || 'Administrator'}</p>
              <div style="text-align: center; margin: 28px 0 16px 0;">
                <a href="${ticketUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block;">
                  Otwórz zgłoszenie &rarr;
                </a>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  return sendMail({
    to: recipientEmail,
    subject,
    html
  });
};

/**
 * Sends approval request to Management (Zarząd) for PURCHASE type tickets
 */
export const sendApprovalRequestToManagement = async (
  ticketId: string,
  ticketTitle: string,
  description: string,
  createdBy: string,
  additionalInfo?: Record<string, any>
): Promise<MailResult> => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const token = generateTicketToken(ticketId);
  const ticketUrl = `${baseUrl}/helpdesk?ticketId=${ticketId}&token=${token}`;

  try {
    const managementRole = await prisma.role.findUnique({
      where: { name: 'Zarząd' },
      include: { users: { select: { id: true, email: true, name: true } } }
    });

    if (!managementRole || !managementRole.users.length) {
      console.log('No management users found');
      return { success: false, error: 'No management users found' };
    }

    const emails = managementRole.users
      .filter(user => user.email)
      .map(user => user.email) as string[];

    if (!emails.length) {
      return { success: false, error: 'No management email addresses found' };
    }

    const createdAtFormatted = new Date().toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const displayPriorityMap: Record<string, string> = {
      LOW: 'Niski',
      MEDIUM: 'Średni',
      HIGH: 'Wysoki',
      CRITICAL: '🚨 Krytyczny'
    };
    const displayPriority = displayPriorityMap[additionalInfo?.priority || 'MEDIUM'] || 'Średni';

    const html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px;">
          <div style="max-width: 680px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
            
            <div style="background: linear-gradient(135deg, #92400e 0%, #d97706 100%); padding: 24px 32px; color: #ffffff;">
              <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #fef3c7; margin-bottom: 6px;">
                Weryfikacja Wniosku Zakupowego &bull; Zarząd
              </div>
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff;">
                ⚠️ Wniosek Zakupowy #${ticketId.slice(0, 8)}
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 14px; color: #fef3c7;">
                ${ticketTitle}
              </p>
            </div>

            <div style="padding: 28px 32px;">

              <!-- WYRAŹNA INFORMACJA DLA ZARZĄDU -->
              <div style="background-color: #fef3c7; border: 1px solid #fde68a; border-left: 5px solid #d97706; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
                <div style="font-size: 15px; font-weight: 800; color: #92400e; margin-bottom: 4px;">
                  ⚠️ WYMAGANE ZATWIERDZENIE ZARZĄDU
                </div>
                <p style="margin: 0; font-size: 13.5px; color: #78350f; line-height: 1.5;">
                  Użytkownik zgłosił wniosek o zakup/zapotrzebowanie. Zgłoszenie wymaga Twojego przejrzenia i zatwierdzenia przed przekazaniem do realizacji przez Help Desk.
                </p>
              </div>

              <!-- Formularz HTML zgłoszenia -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
                <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 14px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">
                  📋 Formularz Zapotrzebowania
                </h3>
                
                <table style="width: 100%; border-collapse: collapse; font-size: 13.5px; color: #334155;">
                  <tr>
                    <td style="padding: 6px 0; width: 40%; font-weight: 600; color: #64748b;">Tytuł wniosku:</td>
                    <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${ticketTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Typ:</td>
                    <td style="padding: 6px 0;">🛒 Zapotrzebowanie / Zakupy</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Wymaga decyzji:</td>
                    <td style="padding: 6px 0; font-weight: 700; color: #d97706;">TAK &bull; Oczekuje na Zarząd</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Priorytet:</td>
                    <td style="padding: 6px 0; font-weight: 600;">${displayPriority}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Wnioskodawca:</td>
                    <td style="padding: 6px 0;">${createdBy}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Data wniosku:</td>
                    <td style="padding: 6px 0;">${createdAtFormatted}</td>
                  </tr>
                </table>

                <div style="margin-top: 14px; pt: 10px; border-top: 1px dashed #cbd5e1;">
                  <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">
                    Uzasadnienie / Opis zapotrzebowania:
                  </div>
                  <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; font-size: 13px; color: #334155; white-space: pre-wrap; word-break: break-word;">${description || 'Brak opisu'}</div>
                </div>
              </div>

              <!-- Przycisk zatwierdzenia -->
              <div style="text-align: center; margin: 28px 0 16px 0;">
                <a href="${ticketUrl}" style="background: linear-gradient(135deg, #d97706 0%, #b45309 100%); color: #ffffff; padding: 13px 26px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14.5px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(217, 119, 6, 0.25);">
                  Przejdź do zgłoszenia i zdecyduj &rarr;
                </a>
              </div>

            </div>

            <!-- Stopka -->
            <div style="background-color: #f1f5f9; padding: 16px 32px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b;">
              Wiadomość wygenerowana automatycznie dla Zarządu &bull; ${new Date().toLocaleString('pl-PL')}
            </div>
          </div>
        </body>
      </html>
    `;

    return sendMail({
      to: emails,
      subject: `⚠️ WYMAGA ZATWIERDZENIA ZARZĄDU: ${ticketTitle}`,
      html
    });
  } catch (error) {
    console.error('Error sending approval request to management:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Sends a rich HTML notification email to applicant and/or Help Desk when Management approves or rejects a ticket.
 */
export const sendManagementDecisionNotification = async (params: {
  recipientEmail: string | string[];
  ticketId: string;
  ticketTitle: string;
  description: string;
  createdBy: string;
  approvedBy: string;
  approved: boolean;
  managerComment?: string | null;
}): Promise<MailResult> => {
  const { recipientEmail, ticketId, ticketTitle, description, createdBy, approvedBy, approved, managerComment } = params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const token = generateTicketToken(ticketId);
  const ticketUrl = `${baseUrl}/helpdesk?ticketId=${ticketId}&token=${token}`;

  const headerBg = approved
    ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
    : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)';
  const bannerBg = approved ? '#ecfdf5' : '#fef2f2';
  const bannerBorder = approved ? '#059669' : '#dc2626';
  const bannerTextColor = approved ? '#065f46' : '#991b1b';
  const btnBg = approved
    ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
    : 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)';

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px;">
        <div style="max-width: 680px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
          
          <!-- Nagłówek -->
          <div style="background: ${headerBg}; padding: 24px 32px; color: #ffffff;">
            <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #ffffff; opacity: 0.9; margin-bottom: 6px;">
              SYSTEM HELPDESK &bull; DECYZJA ZARZĄDU
            </div>
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
              ${approved ? '✅ Wniosek Zakupowy Zatwierdzony' : '❌ Wniosek Zakupowy Odrzucony'}
            </h1>
            <p style="margin: 6px 0 0 0; font-size: 14.5px; color: #ffffff; opacity: 0.95;">
              Zgłoszenie #${ticketId.slice(0, 8)} &bull; ${ticketTitle}
            </p>
          </div>

          <!-- Baner Decyzji -->
          <div style="background-color: ${bannerBg}; border-bottom: 2px solid ${bannerBorder}; padding: 14px 32px;">
            <div style="display: inline-block; font-size: 13.5px; font-weight: 800; color: ${bannerTextColor}; text-transform: uppercase; letter-spacing: 0.3px;">
              ${approved ? '✅ WNIOSEK ZAKUPOWY ZATWIERDZONY PRZEZ ZARZĄD' : '❌ WNIOSEK ZAKUPOWY ODRZUCONY PRZEZ ZARZĄD'}
            </div>
            <div style="font-size: 12.5px; color: ${bannerTextColor}; margin-top: 2px;">
              ${approved 
                ? 'Decyzja została zapamiętana. Zespół Help Desk może przystąpić do realizacji zamówienia.' 
                : 'Decyzja Zarządu jest odmowna. Dalsze prace nad wnioskiem zostały wstrzymane.'}
            </div>
          </div>

          <!-- Treść / Formularz -->
          <div style="padding: 28px 32px;">
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; color: #64748b; width: 140px;">Numer zgłoszenia:</td>
                  <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">#${ticketId.slice(0, 8)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Tytuł zgłoszenia:</td>
                  <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${ticketTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Typ zgłoszenia:</td>
                  <td style="padding: 6px 0; font-weight: 700; color: #2563eb;">🛒 Zapotrzebowanie / Zakup</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Zgłaszający:</td>
                  <td style="padding: 6px 0; font-weight: 600; color: #334155;">${createdBy}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Decyzja Zarządu:</td>
                  <td style="padding: 6px 0; font-weight: 700; color: ${bannerTextColor};">
                    ${approved ? '✅ Zaakceptowano (Zatwierdzono)' : '❌ Odrzucono'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: 600; color: #64748b;">Osoba decydująca:</td>
                  <td style="padding: 6px 0; font-weight: 700; color: #0f172a;">${approvedBy}</td>
                </tr>
              </table>

              ${managerComment ? `
                <div style="margin-top: 14px; padding-top: 10px; border-top: 1px dashed #cbd5e1;">
                  <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">
                    💬 Komentarz / Uzasadnienie Zarządu:
                  </div>
                  <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; font-size: 13px; color: #1e293b; font-weight: 600; white-space: pre-wrap;">
                    ${managerComment}
                  </div>
                </div>
              ` : ''}

              <div style="margin-top: 14px; padding-top: 10px; border-top: 1px dashed #cbd5e1;">
                <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">
                  Opis zapotrzebowania:
                </div>
                <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; font-size: 13px; color: #334155; white-space: pre-wrap;">
                  ${description || 'Brak opisu'}
                </div>
              </div>
            </div>

            <!-- Przycisk przejścia -->
            <div style="text-align: center; margin: 28px 0 16px 0;">
              <a href="${ticketUrl}" style="background: ${btnBg}; color: #ffffff; padding: 13px 26px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14.5px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.15);">
                Otwórz zgłoszenie w systemie Help Desk &rarr;
              </a>
            </div>

          </div>

          <!-- Stopka -->
          <div style="background-color: #f1f5f9; padding: 16px 32px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b;">
            Wiadomość wygenerowana automatycznie przez System Help Desk &bull; ${new Date().toLocaleString('pl-PL')}
          </div>
        </div>
      </body>
    </html>
  `;

  return sendMail({
    to: recipientEmail,
    subject: `${approved ? '✅ ZAKUP ZATWIERDZONY' : '❌ WNIOSEK ODRZUCONY'}: ${ticketTitle}`,
    html,
  });
};

/**
 * Sends notification to Help Desk when ticket is approved by management
 */
export const sendApprovedNotificationToHelpDesk = async (
  ticketId: string,
  ticketTitle: string,
  description: string,
  createdBy: string,
  approvedBy: string,
  additionalInfo?: Record<string, any>
): Promise<MailResult> => {
  try {
    const helpDeskUser = await prisma.user.findUnique({
      where: { login: 'helpdesk' },
      select: { email: true }
    });

    if (!helpDeskUser?.email) {
      console.log('Help Desk user not found or no email configured');
      return { success: false, error: 'Help Desk user not found' };
    }

    return sendManagementDecisionNotification({
      recipientEmail: helpDeskUser.email,
      ticketId,
      ticketTitle,
      description,
      createdBy,
      approvedBy,
      approved: true,
      managerComment: additionalInfo?.managerComment,
    });
  } catch (error) {
    console.error('Error sending approved notification to Help Desk:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Sends a notification email when a new chat message is added to a ticket
 */
/**
 * Sends a notification email when a new chat message is added to a ticket.
 * Includes full ticket details, status metadata, and complete conversation history.
 */
export const sendChatMessageNotification = async (
  ticketId: string,
  ticketTitle: string,
  messageSenderName: string,
  messageText: string,
  ticket: {
    type: string;
    status: string;
    isApprovedByManager: boolean | null;
    createdBy?: { id: string; email: string | null; name: string } | null;
    createdById?: string;
  },
  senderId?: string
): Promise<MailResult> => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const token = generateTicketToken(ticketId);
  const ticketUrl = `${baseUrl}/helpdesk?ticketId=${ticketId}&token=${token}`;

  // Pobierz pełne dane zgłoszenia z bazy danych wraz z autorami i historią rozmów
  const fullTicket = await prisma.helpDeskTicket.findUnique({
    where: { id: ticketId },
    include: {
      createdBy: { select: { id: true, name: true, login: true, email: true } },
      assignedTo: { select: { id: true, name: true, login: true, email: true } },
      assignedBy: { select: { id: true, name: true, login: true } },
      approvedBy: { select: { id: true, name: true, login: true } },
      history: {
        include: {
          user: { select: { id: true, name: true, login: true, email: true } }
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  const recipientEmails: string[] = [];

  const creatorEmail = fullTicket?.createdBy?.email || ticket.createdBy?.email;
  const creatorId = fullTicket?.createdBy?.id || ticket.createdBy?.id || ticket.createdById;
  const assignedToEmail = fullTicket?.assignedTo?.email;
  const assignedToId = fullTicket?.assignedTo?.id;

  const currentType = fullTicket?.type || ticket.type;
  const currentStatus = fullTicket?.status || ticket.status;
  const isApproved = fullTicket?.isApprovedByManager ?? ticket.isApprovedByManager;

  // 1. Jeżeli zgłoszenie zakupu oczekuje na akceptację Zarządu
  const isPendingManagementApproval = currentType === 'PURCHASE' && currentStatus === 'PENDING_APPROVAL' && isApproved !== true;

  if (isPendingManagementApproval) {
    const managementRole = await prisma.role.findUnique({
      where: { name: 'Zarząd' },
      include: { users: { select: { id: true, email: true, name: true } } }
    });

    if (managementRole?.users) {
      managementRole.users.forEach(u => {
        if (u.email && u.id !== senderId && !recipientEmails.includes(u.email)) {
          recipientEmails.push(u.email);
        }
      });
    }
  }

  // 2. Powiadom założyciela zgłoszenia (jeśli nie jest nadawcą)
  if (creatorEmail && creatorId !== senderId && !recipientEmails.includes(creatorEmail)) {
    recipientEmails.push(creatorEmail);
  }

  // 3. Powiadom osobę przypisaną do realizowania (jeśli nie jest nadawcą)
  if (assignedToEmail && assignedToId !== senderId && !recipientEmails.includes(assignedToEmail)) {
    recipientEmails.push(assignedToEmail);
  }

  // 4. Powiadom główne konto Help Desk (login: 'helpdesk')
  const helpDeskUser = await prisma.user.findUnique({
    where: { login: 'helpdesk' },
    select: { id: true, email: true }
  });
  if (helpDeskUser?.email && helpDeskUser.id !== senderId && !recipientEmails.includes(helpDeskUser.email)) {
    recipientEmails.push(helpDeskUser.email);
  }

  if (recipientEmails.length === 0) {
    console.log('Brak odbiorców wiadomości e-mail dla powiadomienia czatu');
    return { success: true, message: 'No recipients to notify' };
  }

  // Sformatuj właściwości zgłoszenia
  const displayTitle = fullTicket?.title || ticketTitle;
  const displayType = currentType === 'PURCHASE' ? '🛒 Zakupy' : '🛠️ Problem techniczny';
  const displayPriorityMap: Record<string, string> = {
    LOW: 'Niski',
    MEDIUM: 'Średni',
    HIGH: 'Wysoki',
    CRITICAL: '🚨 Krytyczny'
  };
  const displayPriority = displayPriorityMap[fullTicket?.priority || 'MEDIUM'] || fullTicket?.priority || 'Średni';

  const statusBadgeMap: Record<string, string> = {
    OPEN: '<span style="background-color: #dbeafe; color: #1e40af; padding: 4px 10px; border-radius: 9999px; font-weight: 600; font-size: 12px; display: inline-block;">Otwarte</span>',
    IN_PROGRESS: '<span style="background-color: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 9999px; font-weight: 600; font-size: 12px; display: inline-block;">W trakcie realizacji</span>',
    PENDING_APPROVAL: '<span style="background-color: #f3e8ff; color: #6b21a8; padding: 4px 10px; border-radius: 9999px; font-weight: 600; font-size: 12px; display: inline-block;">Oczekuje na zatwierdzenie</span>',
    APPROVED: '<span style="background-color: #d1fae5; color: #065f46; padding: 4px 10px; border-radius: 9999px; font-weight: 600; font-size: 12px; display: inline-block;">Zatwierdzone</span>',
    REJECTED: '<span style="background-color: #ffe4e6; color: #9f1239; padding: 4px 10px; border-radius: 9999px; font-weight: 600; font-size: 12px; display: inline-block;">Odrzucone</span>',
    CLOSED: '<span style="background-color: #f1f5f9; color: #475569; padding: 4px 10px; border-radius: 9999px; font-weight: 600; font-size: 12px; display: inline-block;">Zamknięte</span>',
  };
  const statusBadge = statusBadgeMap[currentStatus] || currentStatus;

  const creatorName = fullTicket?.createdBy?.name || fullTicket?.createdBy?.login || 'Nieznany';
  const createdAtFormatted = fullTicket?.createdAt
    ? new Date(fullTicket.createdAt).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '-';
  const assignedToName = fullTicket?.assignedTo?.name || fullTicket?.assignedTo?.login || 'Brak przypisania';
  const approvedByName = fullTicket?.approvedBy?.name || fullTicket?.approvedBy?.login || null;
  const dueDateFormatted = fullTicket?.estimatedDueDate
    ? new Date(fullTicket.estimatedDueDate).toLocaleDateString('pl-PL')
    : 'Nie określono';

  // Przygotuj listę wiadomości czatu
  const chatMessages = (fullTicket?.history || []).filter(h => h.field === 'message');

  // Upewnij się, że najnowsza treść wiadomości znajduje się w zestawieniu
  const hasLatest = chatMessages.some(
    m => m.newValue === messageText && (m.user?.name === messageSenderName || !messageSenderName)
  );

  if (!hasLatest && messageText) {
    chatMessages.push({
      id: 'latest-temp',
      ticketId,
      changedBy: senderId || '',
      field: 'message',
      oldValue: null,
      newValue: messageText,
      createdAt: new Date(),
      user: {
        id: senderId || '',
        name: messageSenderName || 'Użytkownik',
        login: messageSenderName || 'Użytkownik',
        email: null
      }
    } as any);
  }

  // Generuj HTML dla całej historii rozmowy
  const conversationHistoryHtml = chatMessages.length > 0 ? chatMessages.map((msg, index) => {
    const isLatest = index === chatMessages.length - 1;
    const sender = msg.user?.name || msg.user?.login || 'Użytkownik';
    const dateStr = new Date(msg.createdAt).toLocaleString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    if (isLatest) {
      return `
        <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; border-radius: 8px; padding: 14px 16px; margin-bottom: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 13px;">
            <div style="font-weight: 700; color: #1e40af; font-size: 14px;">
              👤 ${sender} <span style="background-color: #2563eb; color: #ffffff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; margin-left: 6px; text-transform: uppercase;">NOWA WIADOMOŚĆ</span>
            </div>
            <div style="color: #3b82f6; font-size: 12px; font-weight: 500;">
              ⏱️ ${dateStr}
            </div>
          </div>
          <div style="color: #1e293b; font-size: 14px; line-height: 1.5; white-space: pre-wrap; word-break: break-word;">${msg.newValue || ''}</div>
        </div>
      `;
    } else {
      return `
        <div style="background-color: #f8fafc; border-left: 3px solid #cbd5e1; border-radius: 6px; padding: 12px 14px; margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 12.5px;">
            <div style="font-weight: 600; color: #475569;">
              👤 ${sender}
            </div>
            <div style="color: #94a3b8; font-size: 11.5px;">
              ${dateStr}
            </div>
          </div>
          <div style="color: #334155; font-size: 13.5px; line-height: 1.5; white-space: pre-wrap; word-break: break-word;">${msg.newValue || ''}</div>
        </div>
      `;
    }
  }).join('') : `
    <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; border-radius: 8px; padding: 14px 16px; margin-bottom: 14px;">
      <div style="font-weight: 700; color: #1e40af; font-size: 14px; margin-bottom: 6px;">
        👤 ${messageSenderName} <span style="background-color: #2563eb; color: #ffffff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; margin-left: 6px; text-transform: uppercase;">NOWA WIADOMOŚĆ</span>
      </div>
      <div style="color: #1e293b; font-size: 14px; line-height: 1.5; white-space: pre-wrap;">${messageText}</div>
    </div>
  `;

  const subject = `💬 Nowa wiadomość w zgłoszeniu #${ticketId.slice(0, 8)}: ${displayTitle}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px;">
        <div style="max-width: 680px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
          
          <!-- Nagłówek e-mail -->
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 24px 32px; color: #ffffff;">
            <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #93c5fd; margin-bottom: 6px;">
              System Help Desk &bull; Powiadomienie o dyskusji
            </div>
            <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; line-height: 1.3;">
              💬 Nowa wiadomość w zgłoszeniu #${ticketId.slice(0, 8)}
            </h1>
            <p style="margin: 6px 0 0 0; font-size: 14px; color: #dbeafe;">
              ${displayTitle}
            </p>
          </div>

          <div style="padding: 28px 32px;">
            
            <!-- Blok informacji o zgłoszeniu -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px 20px; margin-bottom: 24px;">
              <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 14px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px;">
                📋 Pełne Informacje o Zgłoszeniu
              </h3>
              
              <table style="width: 100%; border-collapse: collapse; font-size: 13.5px; color: #334155;">
                <tr>
                  <td style="padding: 5px 0; width: 38%; font-weight: 600; color: #64748b;">Tytuł zgłoszenia:</td>
                  <td style="padding: 5px 0; font-weight: 700; color: #0f172a;">${displayTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-weight: 600; color: #64748b;">Typ zgłoszenia:</td>
                  <td style="padding: 5px 0;">${displayType}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-weight: 600; color: #64748b;">Status:</td>
                  <td style="padding: 5px 0;">${statusBadge}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-weight: 600; color: #64748b;">Priorytet:</td>
                  <td style="padding: 5px 0; font-weight: 600;">${displayPriority}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-weight: 600; color: #64748b;">Zgłaszający:</td>
                  <td style="padding: 5px 0;">${creatorName}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-weight: 600; color: #64748b;">Data zgłoszenia:</td>
                  <td style="padding: 5px 0;">${createdAtFormatted}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-weight: 600; color: #64748b;">Przypisano do:</td>
                  <td style="padding: 5px 0;">${assignedToName}</td>
                </tr>
                ${approvedByName ? `
                <tr>
                  <td style="padding: 5px 0; font-weight: 600; color: #64748b;">Zatwierdził:</td>
                  <td style="padding: 5px 0;">${approvedByName}</td>
                </tr>` : ''}
                <tr>
                  <td style="padding: 5px 0; font-weight: 600; color: #64748b;">Szacowany termin:</td>
                  <td style="padding: 5px 0;">${dueDateFormatted}</td>
                </tr>
              </table>

              ${fullTicket?.description ? `
              <div style="margin-top: 14px; pt: 10px; border-top: 1px dashed #cbd5e1;">
                <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">
                  Pierwotny opis zgłoszenia:
                </div>
                <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 12px; font-size: 13px; color: #334155; white-space: pre-wrap; word-break: break-word;">${fullTicket.description}</div>
              </div>` : ''}
            </div>

            <!-- Cała historia rozmowy -->
            <div style="margin-bottom: 24px;">
              <h3 style="margin-top: 0; margin-bottom: 14px; font-size: 15px; font-weight: 700; color: #1e293b;">
                💬 Historia Rozmowy (${chatMessages.length})
              </h3>

              ${conversationHistoryHtml}
            </div>

            <!-- Przycisk przejścia do ticketu -->
            <div style="text-align: center; margin: 28px 0 16px 0;">
              <a href="${ticketUrl}" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; padding: 13px 26px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14.5px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.25);">
                Otwórz zgłoszenie w systemie &rarr;
              </a>
            </div>

          </div>

          <!-- Stopka -->
          <div style="background-color: #f1f5f9; padding: 16px 32px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b;">
            Wiadomość wygenerowana automatycznie przez System Help Desk &bull; ${new Date().toLocaleString('pl-PL')}
          </div>
        </div>
      </body>
    </html>
  `;

  return sendMail({
    to: recipientEmails,
    subject,
    html
  });
};
