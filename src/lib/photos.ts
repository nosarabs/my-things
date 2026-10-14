import { useEffect, useState } from 'react';
import type { Tile } from '../types';
import { blobToDataUrl, compressImage, dataUrlToBlob } from './image';
import { supabase } from './supabase';
import { isImageDataUrl, isPhotoPath } from './url';

const URL_TTL_S = 60 * 60;
const UPLOADABLE = ['image/webp', 'image/jpeg'];

const bucket = () => supabase!.storage.from('photos');
const signedUrls = new Map<string, string>();
const requests = new Map<string, Promise<string>>();

/** Saves a photo to the signed-in user's folder in the photos bucket, or inline when signed out. */
export async function savePhoto(photo: Blob): Promise<string> {
  const session = supabase && (await supabase.auth.getSession()).data.session;
  if (!session) return blobToDataUrl(photo);

  const path = `${session.user.id}/${crypto.randomUUID()}.${photo.type === 'image/jpeg' ? 'jpg' : 'webp'}`;
  const { error } = await bucket().upload(path, photo, { contentType: photo.type });
  if (error) throw error;
  return path;
}

function signedUrl(path: string): Promise<string> {
  let request = requests.get(path);
  if (!request) {
    request = bucket()
      .createSignedUrl(path, URL_TTL_S)
      .then(({ data, error }) => {
        if (error) throw error;
        signedUrls.set(path, data.signedUrl);
        // Forget it a minute before it expires, so the next tile that mounts asks for a fresh one.
        setTimeout(() => {
          signedUrls.delete(path);
          requests.delete(path);
        }, (URL_TTL_S - 60) * 1000);
        return data.signedUrl;
      });
    request.catch(() => requests.delete(path));
    requests.set(path, request);
  }
  return request;
}

/** Something an <img> can show for a photo: undefined while it loads, '' if it can't load. */
export function usePhotoUrl(src: string): string | undefined {
  const [resolved, setResolved] = useState<{ src: string; url: string }>();
  const isPath = isPhotoPath(src);

  useEffect(() => {
    if (!isPath || !supabase || signedUrls.has(src)) return;
    let live = true;
    signedUrl(src).then(
      (url) => live && setResolved({ src, url }),
      () => live && setResolved({ src, url: '' }),
    );
    return () => {
      live = false;
    };
  }, [src, isPath]);

  if (!isPath) return src;
  if (!supabase) return '';
  return signedUrls.get(src) ?? (resolved?.src === src ? resolved.url : undefined);
}

/** A URL that opens in a new tab. Browsers block data: URLs there, so those become blob: URLs. */
export function toOpenableUrl(src: string): string {
  // A photo's tile is on screen whenever its menu is open, so its signed URL is already cached.
  if (isPhotoPath(src)) return signedUrls.get(src) ?? '';
  if (!src.startsWith('data:')) return src;
  const url = URL.createObjectURL(dataUrlToBlob(src));
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return url;
}

const photoPath = (tile: Tile) => (tile.type === 'image' && isPhotoPath(tile.src) ? tile.src : null);

/** Deletes the photo files of `tiles`, except ones `keep` still uses. Best effort. */
export function removePhotos(tiles: Tile[], keep: Tile[] = []) {
  const kept = new Set(keep.map(photoPath));
  const paths = tiles.map(photoPath).filter((path): path is string => !!path && !kept.has(path));
  if (supabase && paths.length) void bucket().remove(paths);
}

const mapPhotos = (tiles: Tile[], matches: (src: string) => boolean, convert: (src: string) => Promise<string>) =>
  Promise.all(
    tiles.map(async (tile): Promise<Tile> =>
      tile.type === 'image' && matches(tile.src) ? { ...tile, src: await convert(tile.src) } : tile,
    ),
  );

/** Inlines photo files as data URLs, so an export works without the account. */
export const embedPhotos = (tiles: Tile[]) =>
  mapPhotos(tiles, isPhotoPath, async (path) => {
    const { data, error } = await bucket().download(path);
    if (error) throw error;
    return blobToDataUrl(data);
  });

/** Moves inline photos into the signed-in user's folder in the photos bucket. */
export const uploadPhotos = (tiles: Tile[]) =>
  mapPhotos(tiles, isImageDataUrl, async (src) => {
    const photo = dataUrlToBlob(src);
    return savePhoto(UPLOADABLE.includes(photo.type) ? photo : await compressImage(photo));
  });
