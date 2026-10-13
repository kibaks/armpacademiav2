import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { UserProfile } from '../src/types';
import { applyProfileMedia, changedProfileFields, profileWriteData, mediaPatch, rollbackProfileMedia } from '../src/utils/profileMediaSync';
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

test('a failed optimistic photo save restores the previous image without losing new course progress', () => {
  const attempted = mediaPatch({ avatarUrl: 'new-avatar', name: 'New name' });
  assert.deepEqual(attempted, { avatarUrl: 'new-avatar' });
  const current = { ...profile, ...attempted, coverUrl: 'other-cover', courseProgress: { c1: 90 } };
  const restored = rollbackProfileMedia(current, profile, attempted);
  assert.equal(restored.avatarUrl, 'old-avatar');
  assert.equal(restored.coverUrl, 'other-cover');
  assert.deepEqual(restored.courseProgress, { c1: 90 });
  assert.equal(rollbackProfileMedia({ ...current, avatarUrl: 'newer-avatar' }, profile, attempted).avatarUrl, 'newer-avatar');
});

test('a delayed snapshot cannot reset an already confirmed photo', () => {
 const confirmed = { ...profile, avatarUrl: 'saved-avatar', coverUrl: 'saved-cover', mediaRevision: 4 };
 const stale = applyProfileMedia(confirmed, { avatarUrl: 'old-avatar', coverUrl: 'old-cover', mediaRevision: 3 });
 assert.equal(stale, confirmed);
 const latest = applyProfileMedia(confirmed, { avatarUrl: 'new-avatar', coverUrl: 'new-cover', mediaRevision: 5 });
 assert.equal(latest.avatarUrl, 'new-avatar');
 assert.equal(latest.mediaRevision, 5);
});
