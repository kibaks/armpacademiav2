import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { UserProfile } from '../src/types';
import { applyProfileMedia, changedProfileFields, profileWriteData } from '../src/utils/profileMediaSync';
const profile = { id: 'user1', email: 'test@example.com', role: 'independant', name: 'Test', avatarUrl: 'old-avatar', coverUrl: 'old-cover', courseProgress: { c1: 10 }, roleTitle: 'Apprenant', institution: 'Test', level: 'Débutant', completedModulesCount: 0, certificationsCount: 0, offlineDownloads: [] } satisfies UserProfile;

test('a late progress write cannot revert newer photos or protected identity fields', () => {
  const patch = profileWriteData({ ...profile, courseProgress: { c1: 60 } });
  assert.equal(patch.avatarUrl, undefined);
  assert.equal(patch.coverUrl, undefined);
  assert.equal(patch.id, undefined);
  assert.equal(patch.role, undefined);
  assert.deepEqual(patch.courseProgress, { c1: 60 });
  const server = { ...profile, avatarUrl: 'new-avatar', coverUrl: 'new-cover', ...patch };
  assert.equal(server.avatarUrl, 'new-avatar');
  assert.equal(server.coverUrl, 'new-cover');
});
test('saving one photo only patches that photo without overwriting the other image', () => {
  const patch = profileWriteData(profile, changedProfileFields(profile, { ...profile, avatarUrl: 'new-avatar' }));
  assert.deepEqual(patch, { avatarUrl: 'new-avatar' });
  assert.deepEqual(profileWriteData(profile, { coverUrl: 'new-cover', role: 'super_admin', email: 'other@example.com' }), { coverUrl: 'new-cover' });
});
test('remote media updates preserve learning data and support a removed cover', () => {
  const synced = applyProfileMedia(profile, { avatarUrl: 'remote-avatar' });
  assert.equal(synced.avatarUrl, 'remote-avatar');
  assert.equal(synced.coverUrl, undefined);
  assert.deepEqual(synced.courseProgress, profile.courseProgress);
  assert.equal(synced.role, profile.role);
});
