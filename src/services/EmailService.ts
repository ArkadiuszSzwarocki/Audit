import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

export interface EmailAttachment {
  filename: string;
  path?: string;
  content?: Buffer | string;
  cid?: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    }
  }

  async sendMail(options: SendEmailOptions): Promise<{ success: boolean; simulated: boolean; message: string }> {
    const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to;
    const fromAddress = process.env.SMTP_FROM || 'AuditApp <no-reply@auditapp.local>';

    // Jeśli brak zdefiniowanego serwera SMTP w .env, używamy trybu bezpiecznej symulacji (lub e-mail testowy)
    if (!this.transporter) {
      console.log(`\n📧 [EMAIL SIMULATION] -------------------------------------`);
      console.log(`To: ${recipients}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Attachments count: ${options.attachments?.length || 0}`);
      console.log(`----------------------------------------------------------\n`);

      return {
        success: true,
        simulated: true,
        message: `Raport e-mail został wygenerowany pomyślnie dla ${recipients} (Tryb podglądu/demo. Dodaj SMTP_HOST w .env aby wysyłać na prawdziwe skrzynki).`,
      };
    }

    try {
      await this.transporter.sendMail({
        from: fromAddress,
        to: recipients,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments,
      });

      return {
        success: true,
        simulated: false,
        message: `Wysłano wiadomość email pod adres: ${recipients}`,
      };
    } catch (error: any) {
      console.error('Błąd wysyłania e-mail przez SMTP:', error);
      throw new Error(`Nie udało się wysłać wiadomości email: ${error.message}`);
    }
  }
}
