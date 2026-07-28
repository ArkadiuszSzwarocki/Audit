import { sendMail } from '@/lib/mailer';
import { prisma } from '@/config/db';

interface LeaveNotificationData {
  employeeName: string;
  employeeEmail: string;
  managerName: string;
  managerEmail: string;
  departmentName: string;
  startDate: string;
  endDate: string;
  leaveType: string;
  workDays: number;
  reason?: string;
  rejectionReason?: string;
}

/**
 * Serwis do wysyłania powiadomień email dotyczących wniosków urlopowych
 */
export class LeaveNotificationService {
  /**
   * Wysyła powiadomienie do kierownika o nowym wniosku urlopowym
   */
  static async notifyManagerNewLeaveRequest(data: LeaveNotificationData) {
    const subject = `📋 Nowy wniosek urlopowy od ${data.employeeName}`;

    const text = `
Nowy wniosek urlopowy czeka na Twoją akceptację:

Pracownik: ${data.employeeName}
Departament: ${data.departmentName}
Typ urlopu: ${data.leaveType}
Okres: ${data.startDate} - ${data.endDate}
Liczba dni roboczych: ${data.workDays}
Powód: ${data.reason || 'Brak'}

Zaloguj się do systemu AuditApp aby zatwierdzić lub odrzucić wniosek:
https://audit.qasp.pl/urlopy/approvals
    `;

    const html = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #2c3e50; margin-top: 0;">📋 Nowy wniosek urlopowy</h2>
          <p>Nowy wniosek urlopowy czeka na Twoją akceptację:</p>
        </div>

        <div style="background-color: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p><strong>Pracownik:</strong> ${data.employeeName}</p>
          <p><strong>Departament:</strong> ${data.departmentName}</p>
          <p><strong>Typ urlopu:</strong> ${data.leaveType}</p>
          <p><strong>Okres:</strong> ${data.startDate} - ${data.endDate}</p>
          <p><strong>Liczba dni roboczych:</strong> ${data.workDays}</p>
          <p><strong>Powód:</strong> ${data.reason || '<em>Brak</em>'}</p>
        </div>

        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p><strong>⚡ Akcja wymagana:</strong> Zaloguj się do systemu AuditApp aby zatwierdzić lub odrzucić wniosek</p>
          <a href="https://audit.qasp.pl/urlopy/approvals" style="background-color: #2196f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Przejdź do aprobaty wniosków →
          </a>
        </div>

        <div style="font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 15px;">
          <p>To jest automatyczne powiadomienie z systemu AuditApp. Prosimy nie odpowiadaj na ten email.</p>
        </div>
      </div>
    `;

    try {
      await sendMail({
        to: data.managerEmail,
        subject,
        text,
        html,
      });
    } catch (error) {
      console.error('Error sending leave request notification to manager:', error);
    }
  }

  /**
   * Wysyła powiadomienie do pracownika że jego wniosek został zatwierdzony
   */
  static async notifyEmployeeLeaveApproved(data: LeaveNotificationData) {
    const subject = `✅ Twój wniosek urlopowy został zatwierdzony`;

    const text = `
Twój wniosek urlopowy został zatwierdzony!

Pracownik: ${data.employeeName}
Typ urlopu: ${data.leaveType}
Okres: ${data.startDate} - ${data.endDate}
Liczba dni roboczych: ${data.workDays}

Dni robocze zostały policzone w Twojej puli urlopowej.
Zaloguj się do systemu AuditApp aby zobaczyć szczegóły:
https://audit.qasp.pl/urlopy

Pozdrawiamy,
System AuditApp
    `;

    const html = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #4caf50;">
          <h2 style="color: #2e7d32; margin-top: 0;">✅ Twój wniosek urlopowy został zatwierdzony!</h2>
        </div>

        <div style="background-color: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p><strong>Typ urlopu:</strong> ${data.leaveType}</p>
          <p><strong>Okres:</strong> ${data.startDate} - ${data.endDate}</p>
          <p><strong>Liczba dni roboczych:</strong> ${data.workDays}</p>
        </div>

        <div style="background-color: #f1f8e9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p>✨ Dni robocze zostały policzone w Twojej puli urlopowej.</p>
        </div>

        <div style="background-color: #f0f7ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p><strong>Chcesz zobaczyć szczegóły?</strong></p>
          <a href="https://audit.qasp.pl/urlopy" style="background-color: #2196f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Przejdź do kalendarza urlopów →
          </a>
        </div>

        <div style="font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 15px;">
          <p>To jest automatyczne powiadomienie z systemu AuditApp. Prosimy nie odpowiadaj na ten email.</p>
        </div>
      </div>
    `;

    try {
      await sendMail({
        to: data.employeeEmail,
        subject,
        text,
        html,
      });
    } catch (error) {
      console.error('Error sending leave approval notification to employee:', error);
    }
  }

  /**
   * Wysyła powiadomienie do pracownika że jego wniosek został odrzucony
   */
  static async notifyEmployeeLeaveRejected(data: LeaveNotificationData) {
    const subject = `❌ Twój wniosek urlopowy został odrzucony`;

    const text = `
Niestety, Twój wniosek urlopowy został odrzucony.

Pracownik: ${data.employeeName}
Typ urlopu: ${data.leaveType}
Okres: ${data.startDate} - ${data.endDate}

Powód odrzucenia: ${data.rejectionReason || 'Brak podanego powodu'}

Skontaktuj się z Twoim kierownikiem aby uzyskać więcej informacji.

Pozdrawiamy,
System AuditApp
    `;

    const html = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <div style="background-color: #ffebee; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f44336;">
          <h2 style="color: #c62828; margin-top: 0;">❌ Twój wniosek urlopowy został odrzucony</h2>
        </div>

        <div style="background-color: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p><strong>Typ urlopu:</strong> ${data.leaveType}</p>
          <p><strong>Okres:</strong> ${data.startDate} - ${data.endDate}</p>
        </div>

        <div style="background-color: #fff3e0; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ff9800;">
          <p><strong>Powód odrzucenia:</strong></p>
          <p style="font-style: italic; color: #555;">
            ${data.rejectionReason || '<em>Brak podanego powodu</em>'}
          </p>
        </div>

        <div style="background-color: #f0f7ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p>💬 Skontaktuj się z Twoim kierownikiem aby uzyskać więcej informacji i omówić alternatywne terminy.</p>
        </div>

        <div style="font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 15px;">
          <p>To jest automatyczne powiadomienie z systemu AuditApp. Prosimy nie odpowiadaj na ten email.</p>
        </div>
      </div>
    `;

    try {
      await sendMail({
        to: data.employeeEmail,
        subject,
        text,
        html,
      });
    } catch (error) {
      console.error('Error sending leave rejection notification to employee:', error);
    }
  }

  /**
   * Wysyła powiadomienie do kierownika o nowym wniosku przekazanym do niego z wyższego poziomu
   */
  static async notifyNextApproverLeaveRequest(data: LeaveNotificationData & { approvalLevel: number }) {
    const subject = `📋 Wniosek urlopowy czeka na aprobatę - Poziom ${data.approvalLevel}`;

    const text = `
Wniosek urlopowy czeka na Twoją akceptację (poziom ${data.approvalLevel} hierarchii):

Pracownik: ${data.employeeName}
Departament: ${data.departmentName}
Typ urlopu: ${data.leaveType}
Okres: ${data.startDate} - ${data.endDate}
Liczba dni roboczych: ${data.workDays}

Zaloguj się do systemu AuditApp aby zatwierdzić lub odrzucić wniosek:
https://audit.qasp.pl/urlopy/approvals
    `;

    const html = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #2c3e50; margin-top: 0;">📋 Wniosek urlopowy czeka na aprobatę</h2>
          <p style="background-color: #fff3cd; padding: 10px; border-radius: 4px; color: #856404;">
            <strong>Poziom aprobaty: ${data.approvalLevel}</strong>
          </p>
        </div>

        <div style="background-color: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p><strong>Pracownik:</strong> ${data.employeeName}</p>
          <p><strong>Departament:</strong> ${data.departmentName}</p>
          <p><strong>Typ urlopu:</strong> ${data.leaveType}</p>
          <p><strong>Okres:</strong> ${data.startDate} - ${data.endDate}</p>
          <p><strong>Liczba dni roboczych:</strong> ${data.workDays}</p>
        </div>

        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p><strong>⚡ Akcja wymagana:</strong> Zaloguj się do systemu AuditApp aby zatwierdzić lub odrzucić wniosek</p>
          <a href="https://audit.qasp.pl/urlopy/approvals" style="background-color: #2196f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Przejdź do aprobaty wniosków →
          </a>
        </div>

        <div style="font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 15px;">
          <p>To jest automatyczne powiadomienie z systemu AuditApp. Prosimy nie odpowiadaj na ten email.</p>
        </div>
      </div>
    `;

    try {
      await sendMail({
        to: data.managerEmail,
        subject,
        text,
        html,
      });
    } catch (error) {
      console.error('Error sending next approver notification:', error);
    }
  }
}
