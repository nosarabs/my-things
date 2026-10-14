const MAX_SIDE = 1024;
const QUALITY = 0.8;

const toBlob = (canvas: HTMLCanvasElement, type: string) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode image'))), type, QUALITY),
  );

/** Downscales a photo and re-encodes it as WebP (JPEG where WebP encoding isn't supported). */
export async function compressImage(image: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(image);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const webp = await toBlob(canvas, 'image/webp');
  if (webp.type === 'image/webp') return webp;

  // Safari can't encode WebP. JPEG has no transparency, so paint white behind the image first.
  ctx.globalCompositeOperation = 'destination-over';
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return toBlob(canvas, 'image/jpeg');
}

export const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

export function dataUrlToBlob(src: string): Blob {
  const [meta, data] = src.split(',');
  const bytes = Uint8Array.from(atob(data), (char) => char.charCodeAt(0));
  return new Blob([bytes], { type: meta.slice(5).split(';')[0] });
}
