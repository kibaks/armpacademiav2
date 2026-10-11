export function createSessionRevision(currentUid: () => string | null) {
  let revision = 0;
  return {
    begin(uid: string | null) {
      const captured = ++revision;
      return () => captured === revision && uid === currentUid();
    },
    invalidate() { revision++; },
  };
}
