export interface EmailMessage { subject: string; text: string; html: string }
const APP_URL = 'https://armpacademiav2.vercel.app';
const escape = (value: string) => value.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!));
interface EmailContent {
  subject: string; preheader: string; label: string; title: string; name?: string;
  paragraphs: string[]; code?: string; action?: { label: string; url: string }; notice: string;
}
/** Table layout and inline styles keep transactional emails usable in mail clients. */
export function brandedEmail(content: EmailContent): EmailMessage {
  const greeting = content.name?.trim() ? `Bonjour ${content.name.trim()},` : 'Bonjour,';
  let actionUrl: string | undefined;
  if (content.action) {
    const url = new URL(content.action.url);
    if (url.protocol !== 'https:') throw new Error('HTTPS email action required');
    actionUrl = url.href;
  }
  const text = ['ARMP ACADEMIA', content.title, greeting, ...content.paragraphs,
    ...(content.code ? [`Votre code : ${content.code}`, 'Valable 10 minutes • Utilisable une seule fois'] : []),
    ...(content.action ? [`${content.action.label} : ${actionUrl}`] : []), content.notice,
    'Autorité de régulation des marchés publics • République démocratique du Congo', APP_URL].join('\n\n');
  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><title>${escape(content.subject)}</title></head>
<body style="margin:0;padding:0;background-color:#eef2f7;color:#243449;font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escape(content.preheader)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#eef2f7;"><tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border:1px solid #dce4ef;border-radius:16px;overflow:hidden;">
<tr><td style="height:6px;background-color:#d4a32c;font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td align="center" style="padding:28px 24px 22px;background-color:#ffffff;"><a href="${APP_URL}" style="text-decoration:none;"><img src="${APP_URL}/armp-logo.png" width="240" alt="ARMP — Autorité de régulation des marchés publics" style="display:block;width:240px;max-width:100%;height:auto;border:0;"></a></td></tr>
<tr><td style="padding:26px 30px;background-color:#102f57;color:#ffffff;"><p style="margin:0 0 10px;font-size:11px;font-weight:bold;letter-spacing:3px;color:#f2ce73;">ACADEMIA &nbsp; / &nbsp; ${escape(content.label)}</p><h1 style="margin:0;font-size:28px;line-height:1.25;font-weight:700;color:#ffffff;">${escape(content.title)}</h1></td></tr>
<tr><td style="padding:30px;"><p style="margin:0 0 18px;font-size:17px;line-height:1.6;font-weight:bold;">${escape(greeting)}</p>
${content.paragraphs.map(p=>`<p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#46566c;">${escape(p)}</p>`).join('')}
${content.code ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px 8px;background-color:#f0f5fc;border:1px solid #d7e3f4;border-radius:12px;"><p style="margin:0 0 12px;font-size:11px;letter-spacing:2px;color:#526783;font-weight:bold;">VOTRE CODE DE VÉRIFICATION</p><p style="margin:0;font-family:Consolas,monospace;font-size:38px;font-weight:bold;letter-spacing:8px;color:#153f75;">${escape(content.code)}</p><p style="margin:14px 0 0;font-size:12px;line-height:1.5;color:#526783;">Valable <strong>10 minutes</strong> · Utilisable une seule fois</p></td></tr></table>` : ''}
${content.action ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:10px 0 24px;"><tr><td bgcolor="#1954a3" style="border-radius:8px;text-align:center;"><a href="${escape(actionUrl!)}" style="display:inline-block;padding:16px 24px;border:1px solid #1954a3;border-radius:8px;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;">${escape(content.action.label)}</a></td></tr></table><p style="margin:0 0 24px;font-size:12px;line-height:1.6;color:#64748b;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br><a href="${escape(actionUrl!)}" style="color:#1954a3;word-break:break-all;">${escape(actionUrl!)}</a></p>` : ''}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;"><tr><td style="border-left:3px solid #d4a32c;padding:14px 16px;background-color:#fff9eb;font-size:13px;line-height:1.7;color:#66552e;">${escape(content.notice)}</td></tr></table>
<p style="margin:26px 0 0;font-size:14px;line-height:1.7;color:#46566c;">À bientôt,<br><strong style="color:#102f57;">L’équipe ARMP ACADEMIA</strong></p></td></tr>
<tr><td align="center" style="padding:22px 24px;background-color:#f7f9fc;border-top:1px solid #e5ebf3;"><p style="margin:0 0 8px;font-size:12px;font-weight:bold;color:#153f75;">APPRENDRE · PROGRESSER · EXCELLER</p><p style="margin:0;font-size:11px;line-height:1.7;color:#748195;">Autorité de régulation des marchés publics<br>République démocratique du Congo<br><a href="${APP_URL}" style="color:#1954a3;text-decoration:underline;">Accéder à ACADEMIA</a></p></td></tr>
</table><p style="margin:18px 0 0;font-size:11px;color:#7c899b;">Message automatique relatif à votre compte ACADEMIA.</p>
</td></tr></table></body></html>`;
  return {subject:content.subject,text,html};
}
export function otpEmail(code: string, name?: string) {
  if (!/^\d{6}$/.test(code)) throw new Error('Six-digit OTP required');
  return brandedEmail({subject:'Votre code de vérification ACADEMIA',preheader:'Votre code de sécurité est valable 10 minutes.',label:'SÉCURITÉ DU COMPTE',title:'Confirmez votre identité',name,
    paragraphs:['Pour poursuivre votre demande sur ACADEMIA, saisissez le code ci-dessous dans l’application.'],code,
    notice:'Ne partagez jamais ce code. Notre équipe ne vous le demandera pas par téléphone ou par e-mail. Si vous n’avez pas demandé ce code, ignorez ce message.'});
}
export function passwordEmail(link: string, name?: string, activation = false) {
  return brandedEmail({subject:activation?'Activation de votre compte ACADEMIA':'Définissez votre mot de passe ACADEMIA',
    preheader:activation?'Votre compte est prêt. Définissez votre mot de passe pour commencer.':'Un lien personnel pour définir votre mot de passe.',label:activation?'BIENVENUE':'ACCÈS À VOTRE COMPTE',title:activation?'Bienvenue sur ACADEMIA':'Votre accès, en toute sécurité',name,
    paragraphs:[activation?'Votre compte ACADEMIA a été créé. Vous pouvez désormais préparer votre accès à la plateforme de formation de l’ARMP.':'Nous avons reçu une demande pour définir le mot de passe de votre compte ACADEMIA.','Utilisez ce lien personnel, valable 30 minutes et utilisable une seule fois, pour choisir votre mot de passe.'],
    action:{label:activation?'Activer mon compte':'Définir mon mot de passe',url:link},notice:'Ce lien est personnel : ne le transmettez à personne. Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.'});
}
