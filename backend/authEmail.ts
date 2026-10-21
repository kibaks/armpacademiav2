import { createRequire } from 'node:module';

export function authEmailConfigured() {
  return Boolean(process.env.GMAIL_SMTP_USER && process.env.GMAIL_APP_PASSWORD || process.env.RESEND_API_KEY);
}

export async function sendOtpEmail(to: string, code: string) {
  const subject = 'Votre code de vérification ACADEMIA';
  const text = `Votre code : ${code}. Valable 10 minutes. Ne le partagez avec personne. Si vous n’avez pas demandé ce code, ignorez ce message.`;
  const user = process.env.GMAIL_SMTP_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '');
  if (user && pass) {
    const nodemailer = createRequire(import.meta.url)('nodemailer');
    const transport = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user, pass }, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000, logger: false, debug: false });
    try {
      const result = await transport.sendMail({ from: { name: 'ARMP ACADEMIA', address: user }, to, subject, text });
      if (!result.accepted?.length) throw new Error('delivery-failed');
    } finally { transport.close(); }
    return;
  }
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('email-not-configured');
  const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: process.env.AUTH_EMAIL_FROM || 'ARMP RDC Academia <no-reply@armp-rdc.org>', to: [to], subject, text }), signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error('delivery-failed');
}
