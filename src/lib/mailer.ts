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
export const sendHelpDeskNotification = async (
  ticketId: string,
  ticketTitle: string,
  type: 'NEW_TICKET' | 'STATUS_CHANGE' | 'ASSIGNMENT',
  recipientEmail: string,
  additionalInfo?: Record<string, any>
): Promise<MailResult> => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  // Generate a secure, time-limited token for this ticket link (valid for 24 hours)
  const token = generateTicketToken(ticketId);
  const ticketUrl = `${baseUrl}/helpdesk/tickets/${ticketId}?token=${token}`;

  let subject = '';
  let htmlContent = '';

  switch (type) {
    case 'NEW_TICKET':
      subject = `🆕 Nowy ticket: ${ticketTitle}`;
      htmlContent = `
        <h2>Nowy ticket w Help Desk</h2>
        <p><strong>Tytuł:</strong> ${ticketTitle}</p>
        <p><strong>Zgłaszający:</strong> ${additionalInfo?.createdBy || 'Nieznany użytkownik'}</p>
        <p><strong>Opis:</strong> ${additionalInfo?.description || 'Brak opisu'}</p>
        <p><a href="${ticketUrl}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Otworz ticket</a></p>
      `;
      break;

    case 'STATUS_CHANGE':
      subject = `🔄 Zmiana statusu: ${ticketTitle}`;
      htmlContent = `
        <h2>Zmiana statusu ticketu</h2>
        <p><strong>Tytuł:</strong> ${ticketTitle}</p>
        <p><strong>Stary status:</strong> ${additionalInfo?.oldStatus || 'Nieznany'}</p>
        <p><strong>Nowy status:</strong> ${additionalInfo?.newStatus || 'Nieznany'}</p>
        <p><a href="${ticketUrl}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Otworz ticket</a></p>
      `;
      break;

    case 'ASSIGNMENT':
      subject = `👤 Przypisanie ticketu: ${ticketTitle}`;
      htmlContent = `
        <h2>Ticket został Ci przypisany</h2>
        <p><strong>Tytuł:</strong> ${ticketTitle}</p>
        <p><strong>Przypisane przez:</strong> ${additionalInfo?.assignedBy || 'Administrator'}</p>
        <p><a href="${ticketUrl}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Otworz ticket</a></p>
      `;
      break;
  }

  const html = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto;">
          ${htmlContent}
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">
            Wysłane: ${new Date().toLocaleString('pl-PL')}<br/>
            System Help Desk
          </p>
        </div>
      </body>
    </html>
  `;

  return sendMail({
    to: recipientEmail,
    subject,
    html
    // Note: Don't set 'from' - sendMail will use process.env.EMAIL_FROM which is the only allowed address
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
  const ticketUrl = `${baseUrl}/helpdesk/tickets/${ticketId}?token=${token}`;

  try {
    // Pobierz wszystkich użytkowników z roli "Zarząd"
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

    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto;">
            <h2 style="color: #d97706;">⚠️ WYMAGANE ZATWIERDZENIE ZAKUPU</h2>
            <p style="background-color: #fef3c7; padding: 12px; border-left: 4px solid #d97706; border-radius: 4px;">
              <strong>Nowy ticket wymaga Twojego zatwierdzenia</strong>
            </p>
            <div style="margin: 20px 0;">
              <p><strong>Tytuł:</strong> ${ticketTitle}</p>
              <p><strong>Typ:</strong> 🛒 Zakupy</p>
              <p><strong>Zgłaszający:</strong> ${createdBy}</p>
              <p><strong>Opis:</strong></p>
              <p style="background-color: #f3f4f6; padding: 12px; border-radius: 4px; border-left: 3px solid #3b82f6;">
                ${description || 'Brak opisu'}
              </p>
            </div>
            <p style="margin: 20px 0;">
              <a href="${ticketUrl}" style="background-color: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Przejdź do ticketu i zatwierdź
              </a>
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
            <p style="font-size: 12px; color: #666;">
              Wysłane: ${new Date().toLocaleString('pl-PL')}<br/>
              System Help Desk
            </p>
          </div>
        </body>
      </html>
    `;

    return sendMail({
      to: emails,
      subject: `⚠️ ZATWIERDZENIE ZAKUPU: ${ticketTitle}`,
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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const token = generateTicketToken(ticketId);
  const ticketUrl = `${baseUrl}/helpdesk/tickets/${ticketId}?token=${token}`;

  try {
    // Pobierz Help Desk user
    const helpDeskUser = await prisma.user.findUnique({
      where: { login: 'helpdesk' },
      select: { email: true }
    });

    if (!helpDeskUser?.email) {
      console.log('Help Desk user not found or no email configured');
      return { success: false, error: 'Help Desk user not found' };
    }

    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">✅ ZAKUP ZATWIERDZONY</h2>
            <p style="background-color: #d1fae5; padding: 12px; border-left: 4px solid #10b981; border-radius: 4px;">
              <strong>Zakup został zatwierdzony przez kierownictwo. Możesz przystąpić do realizacji.</strong>
            </p>
            <div style="margin: 20px 0;">
              <p><strong>Tytuł:</strong> ${ticketTitle}</p>
              <p><strong>Typ:</strong> 🛒 Zakupy</p>
              <p><strong>Zgłaszający:</strong> ${createdBy}</p>
              <p><strong>Zatwierdzono przez:</strong> ${approvedBy}</p>
              <p><strong>Opis:</strong></p>
              <p style="background-color: #f3f4f6; padding: 12px; border-radius: 4px; border-left: 3px solid #3b82f6;">
                ${description || 'Brak opisu'}
              </p>
            </div>
            <p style="margin: 20px 0;">
              <a href="${ticketUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Otwórz ticket i zacznij pracę
              </a>
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
            <p style="font-size: 12px; color: #666;">
              Wysłane: ${new Date().toLocaleString('pl-PL')}<br/>
              System Help Desk
            </p>
          </div>
        </body>
      </html>
    `;

    return sendMail({
      to: helpDeskUser.email,
      subject: `✅ ZAKUP ZATWIERDZONY: ${ticketTitle}`,
      html
    });
  } catch (error) {
    console.error('Error sending approved notification to Help Desk:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
