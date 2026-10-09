// 3 MiB leaves room below Vercel's 4.5 MB request limit.
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
export function imageMime(name: string): string | null {
  const extension = name.split('.').pop()?.toLowerCase();
  return extension && IMAGE_EXTENSIONS.includes(extension)
    ? `image/${extension === 'jpg' ? 'jpeg' : extension}` : null;
}
