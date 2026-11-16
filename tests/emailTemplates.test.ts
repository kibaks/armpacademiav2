import test from 'node:test';
import assert from 'node:assert/strict';
import { otpEmail, passwordEmail, initiationExpiredEmail } from '../backend/emailTemplates';
test('OTP is accessible as text and HTML, with escaped personalization and no secret in preheader',()=>{
 const message=otpEmail('123456','<img onerror="alert(1)">');
 assert.match(message.html,/&lt;img onerror=&quot;alert\(1\)&quot;&gt;/);
 assert.ok(!message.html.includes('<img onerror='));
 assert.match(message.text,/123456/);
 assert.match(message.html,/lang="fr"/);
 assert.match(message.html,/alt="ARMP/);
 assert.ok(!message.html.split('<div style="display:none;')[1].split('</div>')[0].includes('123456'));
 assert.throws(()=>otpEmail('123'));
});
test('password and activation templates preserve personal links and distinct actions',()=>{
 const link='https://armpacademiav2.vercel.app/reset-password?token=example&mode=reset';
 const reset=passwordEmail(link,'Emmanuel'); const activation=passwordEmail(link,'Emmanuel',true);
 assert.match(reset.html,/Définir mon mot de passe/);
 assert.match(activation.html,/Activer mon compte/);
 assert.match(activation.html,/Bonjour Emmanuel,/);
 assert.match(reset.html,/token=example&amp;mode=reset/);
 assert.ok(reset.text.includes(link));
 assert.match(reset.text,/30 minutes/);
 assert.throws(()=>passwordEmail('javascript:alert(1)'));
});

test('expiry email explains secure renewal and preserves progression', () => {
 const message = initiationExpiredEmail('<Learner>');
 assert.match(message.html, /&lt;Learner&gt;/);
 assert.match(message.text, /reactivate=1/);
 assert.match(message.text, /cinq nouveaux jours/);
 assert.match(message.text, /progression sont conservés/);
});
