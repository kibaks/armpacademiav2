import type { UserProfile } from '../types';

// Progress saves must never restore images from an older rendered profile.
export function profileWriteData(profile: UserProfile, patch?: Partial<UserProfile>) {
  const { id, email, role, twoFactorEnabled, disabled, ...editable } =
    (patch || profile) as Partial<UserProfile> & { disabled?: boolean };
  if (!patch) {
    delete editable.avatarUrl;
    delete editable.coverUrl;
  }
  return JSON.parse(JSON.stringify(editable)) as Partial<UserProfile>;
}

export function changedProfileFields(before: UserProfile, after: UserProfile): Partial<UserProfile> {
  return Object.fromEntries(Object.entries(after).filter(([key, value]) =>
    JSON.stringify(value) !== JSON.stringify(before[key as keyof UserProfile])
  ));
}

export function applyProfileMedia(profile: UserProfile, media: Partial<UserProfile>): UserProfile {
  return { ...profile, avatarUrl: media.avatarUrl ?? profile.avatarUrl, coverUrl: media.coverUrl };
}
