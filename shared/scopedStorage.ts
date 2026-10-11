export function createScopedStorage(storage: Storage, currentUid: () => string | undefined) {
  // Remove the old unscoped profiles, conversations and plaintext credential caches.
  for (const key of Array.from({ length: storage.length }, (_, index) => storage.key(index))) {
    if (key && /^(armp_|academia_)/.test(key) && !/theme|appearance/.test(key)) storage.removeItem(key);
  }
  const keyFor = (key: string) => /theme|appearance/.test(key) ? key : `armp:account:${currentUid() || 'guest'}:${key}`;
  return {
    getItem: (key: string) => storage.getItem(keyFor(key)),
    setItem: (key: string, value: string) => { storage.setItem(keyFor(key), value); },
    removeItem: (key: string) => storage.removeItem(keyFor(key)),
    clearAccount: (uid: string) => {
      const prefix = `armp:account:${uid}:`;
      for (const key of Array.from({ length: storage.length }, (_, index) => storage.key(index))) if (key?.startsWith(prefix)) storage.removeItem(key);
    },
  };
}
