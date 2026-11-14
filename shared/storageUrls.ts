/** Public file references survive storage gateway changes. Private links remain untouched. */
export function stableStorageUrl(value: string): string {
  const match = value.match(/^(?:https?:\/\/[^/]+)?(?:\/files-api)?\/storage\/academia\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.[a-z0-9]{1,8})$/);
  return match ? `/api/storage/public/${match[1]}` : value;
}
export function normalizeStorageUrls<T>(value: T): T {
  if (typeof value === 'string') return stableStorageUrl(value) as T;
  if (Array.isArray(value)) return value.map(normalizeStorageUrls) as T;
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype)
    return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,normalizeStorageUrls(item)])) as T;
  return value;
}
