import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { authEmailConfigured, sendOtpEmail } from '../backend/authEmail';

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
