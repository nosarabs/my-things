const MAX_SIDE = 1024;
const QUALITY = 0.8;

/** Downscales a photo and encodes it as a data URL small enough to keep in localStorage. */
export async function compressImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const webp = canvas.toDataURL('image/webp', QUALITY);
  if (webp.startsWith('data:image/webp')) return webp;

  // Safari can't encode WebP. JPEG has no transparency, so paint white behind the image first.
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', QUALITY);
}

/** Browsers refuse to open data: URLs in a new tab, so hand back a temporary blob: URL instead. */
export function toOpenableUrl(src: string): string {
  if (!src.startsWith('data:')) return src;
  const [meta, data] = src.split(',');
  const bytes = Uint8Array.from(atob(data), (char) => char.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: meta.slice(5).split(';')[0] }));
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return url;
}
