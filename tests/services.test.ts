import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseServiceAccount } from '../backend/services.js';

const account = { type: 'service_account', project_id: 'gen-lang-client-0775786837', client_email: 'server@example.test', private_key: 'test-only' };
test('service account configuration accepts one JSON object and preserves ADC fallback', () => {
  assert.deepEqual(parseServiceAccount(JSON.stringify(account)), account);
  assert.equal(parseServiceAccount(undefined), null);
});
test('duplicated or malformed service account JSON is rejected without leaking its contents', () => {
  for (const value of [JSON.stringify(account).repeat(3), '{secret-value', JSON.stringify('secret-value')]) {
    assert.throws(() => parseServiceAccount(value), (error: any) => error.code === 'app/invalid-service-account-config' && !error.message.includes('secret-value'));
  }
});
test('service account configuration rejects missing fields and a different Firebase project', () => {
  for (const value of [{}, { ...account, project_id: 'another-project' }, { ...account, private_key: null }]) {
    assert.throws(() => parseServiceAccount(JSON.stringify(value)), { code: 'app/invalid-service-account-config' });
  }
});
