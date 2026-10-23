import { createRequire } from 'node:module';

export function authEmailConfigured() {
  return Boolean(process.env.GMAIL_SMTP_USER && process.env.GMAIL_APP_PASSWORD || process.env.RESEND_API_KEY);
}

export function otpDeliveryFailure(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (code === 'EAUTH') return { code: 'MAIL_AUTH_REJECTED', error: 'Le service de messagerie refuse la connexion. L’administrateur doit vérifier le mot de passe d’application Gmail.' };
  if (code === 'MODULE_NOT_FOUND' || code === 'ERR_MODULE_NOT_FOUND') return { code: 'MAIL_DEPENDENCY_MISSING', error: 'Le service d’envoi est indisponible sur ce déploiement. Contactez l’administrateur.' };
  if (['ETIMEDOUT', 'ECONNECTION', 'ECONNREFUSED', 'ESOCKET', 'EDNS'].includes(code || '')) return { code: 'MAIL_CONNECTION_FAILED', error: 'Le serveur de messagerie est injoignable. Réessayez dans une minute.' };
  return { code: 'MAIL_DELIVERY_FAILED', error: 'Le code n’a pas pu être envoyé. Réessayez dans une minute.' };
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
