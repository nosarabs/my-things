import { newId } from './lib/id';
import { bottomRow, collides, COLS, firstFit, MIN_SIZE } from './lib/layout';
import { isHttpUrl, isImageDataUrl, isPhotoPath, isYouTubeId } from './lib/url';
import type { Tile, TileType } from './types';

const KEY = 'my-things:v2';
const LEGACY_KEY = 'my-things:v1';
const ID = /^[\w-]{1,64}$/;

/** Text notes stay well under the cloud database's per-tile size limit. */
export const MAX_TEXT = 4000;

type Fields = Record<string, unknown>;
const str = (value: unknown): value is string => typeof value === 'string';
const int = (value: unknown, min: number): value is number =>
  Number.isInteger(value) && (value as number) >= min;

const validators: Record<TileType, (t: Fields) => boolean> = {
  youtube: (t) => str(t.videoId) && isYouTubeId(t.videoId),
  text: (t) => str(t.text) && t.text.length <= MAX_TEXT,
  image: (t) =>
    str(t.src) && (isPhotoPath(t.src) || isImageDataUrl(t.src) || isHttpUrl(t.src)) && str(t.alt),
  website: (t) => str(t.url) && isHttpUrl(t.url),
};

function isTile(value: unknown): value is Tile {
  if (typeof value !== 'object' || value === null) return false;
  const t = value as Fields;
  return (
    str(t.id) &&
    ID.test(t.id) &&
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

/**
 * Validates tiles, dropping invalid entries and duplicate IDs. Earlier tiles win contested spots;
 * the losers move to the first free spots, after every other tile has kept its place.
 */
export function toTiles(values: unknown[]): Tile[] {
  const placed: Tile[] = [];
  const bumped: Tile[] = [];
  const ids = new Set<string>();
  for (const value of values.map(upgrade)) {
    if (!isTile(value) || ids.has(value.id)) continue;
    ids.add(value.id);
    (collides(value, placed) ? bumped : placed).push(value);
  }
  for (const tile of bumped) placed.push({ ...tile, ...firstFit({ w: tile.w, h: tile.h }, placed) });
  return placed;
}

/** Shifts `tiles` below `existing` so nothing overlaps, giving a new ID to any whose ID is taken. */
export function placeBelow(tiles: Tile[], existing: Tile[]): Tile[] {
  const ids = new Set(existing.map((t) => t.id));
  const offset = bottomRow(existing);
  return tiles.map((t) => ({ ...t, id: ids.has(t.id) ? newId() : t.id, y: t.y + offset }));
}

/** Parses and validates serialized tiles. Throws when the JSON is not an array. */
export function parseTiles(json: string): Tile[] {
  const data: unknown = JSON.parse(json);
  if (!Array.isArray(data)) throw new Error('Expected an array of tiles');
  return toTiles(data);
}

export function loadTiles(): Tile[] {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
    return raw ? parseTiles(raw) : [];
  } catch {
    return [];
  }
}

/** Returns false when storage is full or unavailable. */
export function saveTiles(tiles: Tile[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(tiles));
    return true;
  } catch {
    return false;
  }
}

export function clearTiles() {
  localStorage.removeItem(KEY);
  localStorage.removeItem(LEGACY_KEY);
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
