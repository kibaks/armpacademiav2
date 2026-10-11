import assert from 'node:assert/strict';
import { after, mock, test } from 'node:test';
import express from 'express';
import { services } from '../backend/admin';
import { activateCgpmp } from '../backend/cgpmp';
import { errorHandler, safeAsync } from '../backend/http';

const originalKey = process.env.RESEND_API_KEY;
const { auth, db } = services();
const records = new Map<string, any>();
const application = { id: 'request', status: 'En attente de validation ARMP', institution: 'Institution', permanentSecretaryEmail: 'secretary@example.com', permanentSecretaryName: 'Secrétaire', members: [], creationDocument: { fileDataUrl: 'data:application/pdf;base64,JVBERg==' } };
const snapshot = (key: string) => ({ exists: records.has(key), data: () => records.get(key) });
mock.method(db, 'collection', (name: string) => ({ doc: (id: string) => ({ key: `${name}/${id}`, get: async () => snapshot(`${name}/${id}`), set: async (value: any) => { records.set(`${name}/${id}`, value); } }) }));
mock.method(db, 'runTransaction', async (fn: any) => fn({ get: async (ref: any) => snapshot(ref.key), set: (ref: any, value: any) => records.set(ref.key, value) }));
mock.method(auth, 'getUserByEmail', async (email: string) => ({ uid: 'firebase-uid', email, displayName: 'Secrétaire' }));
mock.method(auth, 'generatePasswordResetLink', async () => 'https://firebase.example/reset-private');
let accepted = true;
const dispatches: any[] = [];
const originalFetch = globalThis.fetch;
mock.method(globalThis, 'fetch', async (input: any, init: any) => {
  if (String(input) === 'https://api.resend.com/emails') {
    dispatches.push(JSON.parse(init.body));
    return new Response('{}', { status: accepted ? 200 : 503 });
  }
  return originalFetch(input, init);
});
const app = express();
app.use(express.json(), (req: any, _res, next) => { req.identity = { uid: 'verified-admin' }; next(); });
app.post('/activate', safeAsync(activateCgpmp)); app.use(errorHandler);
const server = app.listen(0, '127.0.0.1');
await new Promise<void>(resolve => server.once('listening', resolve));
after(() => { server.close(); mock.restoreAll(); if (originalKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = originalKey; });
const request = () => fetch(`http://127.0.0.1:${(server.address() as any).port}/activate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId: 'request', members: [{ email: 'forged@example.com' }], validatedBy: 'forged-admin' }) });
test('CGPMP refuses missing email configuration before provisioning', async () => {
  delete process.env.RESEND_API_KEY;
  assert.equal((await request()).status, 503);
  assert.equal(records.size, 0);
});
test('CGPMP rejection cannot become validation; retry sends a stable activation link and skips accepted messages', async () => {
  process.env.RESEND_API_KEY = 'test-only-placeholder';
  records.set('cgpmpAccountRequests/request', application);
  accepted = false;
  assert.equal((await request()).status, 503);
  assert.equal(records.get('cgpmpAccountRequests/request').status, application.status);
  accepted = true;
  const response = await request();
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.request.validatedBy, 'verified-admin');
  assert.equal(data.request.dispatchedEmails[0].uid, 'firebase-uid');
  assert.equal(data.request.dispatchedEmails[0].tempPassword, '');
  assert.ok(!JSON.stringify(data).includes('reset-private'));
  assert.deepEqual(dispatches[0], dispatches[1]);
  assert.deepEqual(dispatches[1].to, ['secretary@example.com']);
  assert.equal((await request()).status, 200);
  assert.equal(dispatches.length, 2);
});
test('CGPMP applications without their document cannot be validated', async () => {
  records.set('cgpmpAccountRequests/request', { ...application, creationDocument: {} });
  assert.equal((await request()).status, 409);
});
