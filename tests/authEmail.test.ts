import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { authEmailConfigured, sendOtpEmail, otpDeliveryFailure } from '../backend/authEmail';

test('mail errors identify the failure without exposing SMTP secrets or recipient data', () => {
  assert.equal(otpDeliveryFailure({ code: 'EAUTH', message: 'secret-password and recipient@example.invalid' }).code, 'MAIL_AUTH_REJECTED');
  assert.equal(otpDeliveryFailure({ code: 'MODULE_NOT_FOUND' }).code, 'MAIL_DEPENDENCY_MISSING');
  assert.equal(otpDeliveryFailure({ code: 'ETIMEDOUT' }).code, 'MAIL_CONNECTION_FAILED');
  assert.ok(!JSON.stringify(otpDeliveryFailure({ code: 'EAUTH', message: 'secret-password' })).includes('secret-password'));
});

test('Gmail OTP uses TLS, configured sender and recipient; rejected deliveries fail closed', async () => {
  const require = createRequire(import.meta.url);
  const mailer = require('nodemailer');
  const originalTransport = mailer.createTransport;
  const originalUser = process.env.GMAIL_SMTP_USER;
  const originalPassword = process.env.GMAIL_APP_PASSWORD;
  let closed = 0;
  let accepted = true;
  process.env.GMAIL_SMTP_USER = 'sender@example.invalid';
  process.env.GMAIL_APP_PASSWORD = 'test only password';
  mailer.createTransport = (options: any) => {
    assert.equal(options.host, 'smtp.gmail.com');
    assert.equal(options.secure, true);
    assert.equal(options.port, 465);
    assert.equal(options.auth.pass, 'testonlypassword');
    return { sendMail: async (message: any) => {
      assert.equal(message.from.address, 'sender@example.invalid');
      assert.equal(message.to, 'recipient@example.invalid');
      assert.ok(message.text.includes('123456'));
      return { accepted: accepted ? [message.to] : [] };
    }, close: () => { closed++; } };
  };
  try {
    assert.equal(authEmailConfigured(), true);
    await sendOtpEmail('recipient@example.invalid', '123456');
    accepted = false;
    await assert.rejects(sendOtpEmail('recipient@example.invalid', '123456'));
    assert.equal(closed, 2);
  } finally {
    mailer.createTransport = originalTransport;
    if (originalUser === undefined) delete process.env.GMAIL_SMTP_USER; else process.env.GMAIL_SMTP_USER = originalUser;
    if (originalPassword === undefined) delete process.env.GMAIL_APP_PASSWORD; else process.env.GMAIL_APP_PASSWORD = originalPassword;
  }
});

test('Resend carries the same branded HTML and plain text without sending real mail', async () => {
  const previous = {user:process.env.GMAIL_SMTP_USER,pass:process.env.GMAIL_APP_PASSWORD,key:process.env.RESEND_API_KEY,fetch:globalThis.fetch};
  delete process.env.GMAIL_SMTP_USER; delete process.env.GMAIL_APP_PASSWORD;
  process.env.RESEND_API_KEY='test-key';
  globalThis.fetch = (async (_url: any, options: any) => {
    const payload=JSON.parse(options.body);
    assert.match(payload.html, /armp-logo.png/);
    assert.match(payload.html, /123456/);
    assert.match(payload.html, /Bonjour Emmanuel,/);
    assert.match(payload.text, /Valable 10 minutes/);
    return new Response('{}',{status:200});
  }) as typeof fetch;
  try { await sendOtpEmail('recipient@example.invalid','123456','Emmanuel'); }
  finally {
    globalThis.fetch=previous.fetch;
    for (const [key,value] of [['GMAIL_SMTP_USER',previous.user],['GMAIL_APP_PASSWORD',previous.pass],['RESEND_API_KEY',previous.key]])
      if(value===undefined) delete process.env[key!]; else process.env[key!]=value;
  }
});
