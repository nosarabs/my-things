const YOUTUBE_ID = /^[\w-]{11}$/;
const IMAGE_DATA_URL = /^data:image\/(png|jpeg|webp|gif);base64,[a-z\d+/]+=*$/i;

export const isYouTubeId = (value: string) => YOUTUBE_ID.test(value);

export const isImageDataUrl = (value: string) => IMAGE_DATA_URL.test(value);

export function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

/** Normalizes user input like "example.com" to "https://example.com/". Returns null if invalid. */
export function toHttpUrl(input: string): string | null {
  const value = input.trim();
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return url.hostname.includes('.') || url.hostname === 'localhost' ? url.href : null;
  } catch {
    return null;
  }
}

/** Extracts the video ID from any common YouTube link format, or accepts a bare ID. */
export function parseYouTubeId(input: string): string | null {
  const value = input.trim();
  if (isYouTubeId(value)) return value;

  const href = toHttpUrl(value);
  if (!href) return null;

  const { hostname, pathname, searchParams } = new URL(href);
  const host = hostname.replace(/^(www|m|music)\./, '');
  let id: string | null = null;
  if (host === 'youtu.be') {
    id = pathname.split('/')[1];
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    id = searchParams.get('v') ?? pathname.match(/^\/(?:embed|shorts|live|v)\/([^/]+)/)?.[1] ?? null;
  }
  return id && isYouTubeId(id) ? id : null;
}
