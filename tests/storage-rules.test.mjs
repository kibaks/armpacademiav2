import { readFile } from 'node:fs/promises';
import { after, test } from 'node:test';
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing';
import { ref, uploadBytes, getBytes } from 'firebase/storage';
const env = await initializeTestEnvironment({ projectId: 'demo-armp-security', storage: { host: '127.0.0.1', port: 9199, rules: await readFile(new URL('../storage.rules', import.meta.url), 'utf8') } });
after(() => env.cleanup());
test('direct bucket reads and writes are denied even for owners and administrators', async () => {
  await env.withSecurityRulesDisabled(async context => uploadBytes(ref(context.storage(), 'academia/owner/private-document'), new Uint8Array([1, 2, 3])));
  for (const context of [env.unauthenticatedContext(), env.authenticatedContext('owner'), env.authenticatedContext('admin', { role: 'super_admin' })]) {
    const object = ref(context.storage(), 'academia/owner/private-document');
    await assertFails(uploadBytes(object, new Uint8Array([1, 2, 3])));
    await assertFails(getBytes(object));
  }
});
