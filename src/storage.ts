import { isHttpUrl, isYouTubeId } from './lib/url';
import type { Tile, TileType } from './types';

const KEY = 'my-things:v1';

type Fields = Record<string, unknown>;
const str = (value: unknown): value is string => typeof value === 'string';

const validators: Record<TileType, (t: Fields) => boolean> = {
  youtube: (t) => str(t.videoId) && isYouTubeId(t.videoId),
  text: (t) => str(t.text),
  image: (t) => str(t.src) && isHttpUrl(t.src) && str(t.alt),
  website: (t) => str(t.url) && isHttpUrl(t.url),
};

function isTile(value: unknown): value is Tile {
  if (typeof value !== 'object' || value === null) return false;
  const t = value as Fields;
  return (
    str(t.id) &&
    Number.isInteger(t.position) &&
    (t.position as number) >= 0 &&
    str(t.type) &&
    Object.hasOwn(validators, t.type) &&
    validators[t.type as TileType](t)
  );
}

/** Parses and validates serialized tiles, dropping invalid entries and duplicate positions. */
export function parseTiles(json: string): Tile[] {
  const data: unknown = JSON.parse(json);
  if (!Array.isArray(data)) throw new Error('Expected an array of tiles');

  const taken = new Set<number>();
  return data.filter(isTile).filter((tile) => {
    if (taken.has(tile.position)) return false;
    taken.add(tile.position);
    return true;
  });
}

export function loadTiles(): Tile[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? parseTiles(raw) : [];
  } catch {
    return [];
  }
}

export function saveTiles(tiles: Tile[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(tiles));
  } catch (error) {
    console.error('Could not save tiles', error);
  }
}

export function exportTiles(tiles: Tile[]) {
  const blob = new Blob([JSON.stringify(tiles, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'), { href: url, download: 'tiles.json' }).click();
  setTimeout(() => URL.revokeObjectURL(url));
}

export async function importTiles(file: File): Promise<Tile[]> {
  return parseTiles(await file.text());
}
