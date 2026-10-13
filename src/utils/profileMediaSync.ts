import type { UserProfile } from '../types';

// Progress saves must never restore images from an older rendered profile.
export function profileWriteData(profile: UserProfile, patch?: Partial<UserProfile>) {
  const { id, email, role, twoFactorEnabled, disabled, ...editable } =
    (patch || profile) as Partial<UserProfile> & { disabled?: boolean };
  if (!patch) {
    delete editable.avatarUrl;
    delete editable.coverUrl;
  }
  delete editable.mediaRevision;
  return JSON.parse(JSON.stringify(editable)) as Partial<UserProfile>;
}

export function changedProfileFields(before: UserProfile, after: UserProfile): Partial<UserProfile> {
  return Object.fromEntries(Object.entries(after).filter(([key, value]) =>
    JSON.stringify(value) !== JSON.stringify(before[key as keyof UserProfile])
  ));
}

export function applyProfileMedia(profile: UserProfile, media: Partial<UserProfile>): UserProfile {
  if ((media.mediaRevision || 0) < (profile.mediaRevision || 0)) return profile;
  return { ...profile, avatarUrl: media.avatarUrl ?? profile.avatarUrl, coverUrl: media.coverUrl, mediaRevision: media.mediaRevision ?? profile.mediaRevision };
}

export function mediaPatch(patch: Partial<UserProfile>): Partial<UserProfile> {
  return Object.fromEntries(Object.entries(patch).filter(([key]) => key === 'avatarUrl' || key === 'coverUrl'));
}

// Roll back only the failed image, preserving work done while the request was pending.
export function rollbackProfileMedia(current: UserProfile, before: UserProfile, attempted: Partial<UserProfile>): UserProfile {
  const rollback = Object.fromEntries(Object.entries(mediaPatch(attempted)).filter(([key, value]) =>
    current[key as keyof UserProfile] === value
  ).map(([key]) => [key, before[key as keyof UserProfile]]));
  return { ...current, ...rollback };
}
