import { test } from 'node:test';
import assert from 'node:assert/strict';
import { friendlyAuthError } from '../shared/authErrors';

test('recognizes Firebase codes on plain objects and legacy messages', () => {
  const expected = friendlyAuthError({ code: 'auth/operation-not-allowed' });
  assert.match(expected, /email et mot de passe/);
  assert.equal(friendlyAuthError(new Error('Firebase: Error (auth/operation-not-allowed).')), expected);
  assert.equal(friendlyAuthError('Firebase: Error (auth/operation-not-allowed).'), expected);
  assert.match(friendlyAuthError({ code: 'auth/operation-not-allowed' }, 'google'), /activer Google/);
  assert.match(friendlyAuthError({ code: 'auth/operation-not-allowed' }, 'mfa'), /TOTP/);
});

test('gives actionable network, popup, account and MFA errors', () => {
  for (const code of ['network-request-failed', 'popup-blocked', 'unauthorized-domain', 'too-many-requests', 'email-already-in-use', 'requires-recent-login', 'invalid-verification-code', 'invalid-multi-factor-session']) {
    const message = friendlyAuthError({ code: `auth/${code}` });
    assert.doesNotMatch(message, /auth\/|Firebase:|n’a pas pu aboutir/);
  }
  assert.equal(friendlyAuthError({ code: 'auth/user-not-found' }), friendlyAuthError({ code: 'auth/invalid-credential' }));
});

test('preserves known workflow guidance without exposing unexpected SDK payloads', () => {
  assert.equal(friendlyAuthError(new Error('Votre mot de passe actuel est requis.')), 'Votre mot de passe actuel est requis.');
  assert.equal(friendlyAuthError(new Error('CGPMP_PENDING_ARMP:Demande en attente.')), 'Demande en attente.');
  for (const error of [null, undefined, {}, new Error('secret credential payload'), { code: 'auth/future-error', message: 'secret credential payload' }]) {
    assert.doesNotMatch(friendlyAuthError(error), /secret|credential|future-error/);
  }
});
