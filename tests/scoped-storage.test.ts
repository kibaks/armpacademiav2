import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createScopedStorage } from '../shared/scopedStorage';
test('profiles, conversations and progress cannot cross accounts and legacy caches are not read', () => {
  const values = new Map<string, string>([['armp_session_profile', 'legacy-private-profile']]);
  const raw: Storage = { get length() { return values.size; }, key: index => [...values.keys()][index] || null, getItem: key => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value); }, removeItem: key => { values.delete(key); }, clear: () => values.clear() };
  let uid: string | undefined = 'first';
  const scoped = createScopedStorage(raw, () => uid);
  assert.equal(scoped.getItem('armp_session_profile'), null);
  assert.equal(raw.getItem('armp_session_profile'), null);
  scoped.setItem('armp_session_profile', 'first-profile');
  uid = 'second';
  assert.equal(scoped.getItem('armp_session_profile'), null);
  scoped.setItem('armp_session_profile', 'second-profile');
  scoped.clearAccount('first');
  assert.equal(scoped.getItem('armp_session_profile'), 'second-profile');
  uid = undefined;
  assert.equal(scoped.getItem('armp_session_profile'), null);
});
