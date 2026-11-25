/** One completed private blob, scoped to the mounted learner session. */
export function createTutorVideoReplayCache(revoke: (url: string) => void) {
  let entry: {key:string; url:string} | undefined;
  return {
    get: (key:string) => entry?.key === key ? entry.url : undefined,
    owns: (url:string) => entry?.url === url,
    remember(key:string,url:string) {
      if (!url.startsWith('blob:')) return;
      if (entry && entry.url !== url) revoke(entry.url);
      entry={key,url};
    },
    clear() { if(entry)revoke(entry.url); entry=undefined; },
  };
}
