import { collides, COLS, MIN_SIZE } from './lib/layout';
import { isHttpUrl, isYouTubeId } from './lib/url';
import type { Tile, TileType } from './types';

const KEY = 'my-things:v2';
const LEGACY_KEY = 'my-things:v1';

type Fields = Record<string, unknown>;
const str = (value: unknown): value is string => typeof value === 'string';
const int = (value: unknown, min: number): value is number =>
  Number.isInteger(value) && (value as number) >= min;

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
    int(t.x, 0) &&
    int(t.y, 0) &&
    int(t.w, MIN_SIZE) &&
    int(t.h, MIN_SIZE) &&
    t.x + t.w <= COLS &&
    str(t.type) &&
    Object.hasOwn(validators, t.type) &&
    validators[t.type as TileType](t)
  );
}

/** Converts tiles saved by the original fixed-slot grid (4 per row) into 4x4 blocks. */
function upgrade(value: unknown): unknown {
  if (typeof value !== 'object' || value === null || !('position' in value)) return value;
  const { position, ...rest } = value as Fields & { position: number };
  return { ...rest, x: (position % 4) * 4, y: Math.floor(position / 4) * 4, w: 4, h: 4 };
}

/** Parses and validates serialized tiles, dropping invalid entries and overlapping tiles. */
export function parseTiles(json: string): Tile[] {
  const data: unknown = JSON.parse(json);
  if (!Array.isArray(data)) throw new Error('Expected an array of tiles');

  const tiles: Tile[] = [];
  for (const value of data.map(upgrade)) {
    if (isTile(value) && !collides(value, tiles)) tiles.push(value);
  }
  return tiles;
}

export function loadTiles(): Tile[] {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
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
