import { describe, expect, it } from 'vitest';
import { MAX_TEXT, parseTiles, placeBelow } from './storage';
import type { Tile } from './types';

const PHOTO = '0b6f4c2e-9d1a-4f3b-8c5e-7a2d1e0f9b8c/9f1c2d3e-4b5a-6c7d-8e9f-0a1b2c3d4e5f.webp';

describe('parseTiles', () => {
  it('keeps valid tiles', () => {
    const tiles = [
      { id: 'a', x: 0, y: 0, w: 4, h: 4, type: 'text', text: 'hi' },
      { id: 'b', x: 4, y: 0, w: 8, h: 5, type: 'youtube', videoId: 'dQw4w9WgXcQ' },
      { id: 'c', x: 12, y: 0, w: 4, h: 4, type: 'image', src: 'https://example.com/a.png', alt: '' },
      { id: 'd', x: 0, y: 6, w: 8, h: 8, type: 'website', url: 'https://example.com/' },
      { id: 'e', x: 8, y: 6, w: 6, h: 6, type: 'image', src: 'data:image/webp;base64,UklGRg==', alt: 'cat' },
      { id: 'f', x: 0, y: 14, w: 6, h: 6, type: 'image', src: PHOTO, alt: '' },
    ];
    expect(parseTiles(JSON.stringify(tiles))).toEqual(tiles);
  });

  it('drops invalid entries', () => {
    const json = JSON.stringify([
      { id: 'a', x: 0, y: 0, w: 4, h: 4, type: 'text', text: 'first' },
      { id: 'a', x: 4, y: 4, w: 4, h: 4, type: 'text', text: 'duplicate id' },
      { id: 'b c', x: 8, y: 4, w: 4, h: 4, type: 'text', text: 'bad id' },
      { id: 'b', x: 0, y: 12, w: 4, h: 4, type: 'text', text: 'x'.repeat(MAX_TEXT + 1) },
      { id: 'c', x: 4, y: 0, w: 4, h: 4, type: 'website', url: 'javascript:alert(1)' },
      { id: 'd', x: -1, y: 0, w: 4, h: 4, type: 'text', text: 'negative' },
      { id: 'e', x: 14, y: 0, w: 4, h: 4, type: 'text', text: 'past the right edge' },
      { id: 'f', x: 8, y: 0, w: 1, h: 4, type: 'text', text: 'too small' },
      { id: 'g', x: 8, y: 8, w: 4, h: 4, type: 'toString' },
      { id: 'h', x: 0, y: 8, w: 4, h: 4, type: 'image', src: 'data:image/svg+xml;base64,PHN2Zz4=', alt: '' },
      null,
    ]);
    expect(parseTiles(json).map((t) => t.id)).toEqual(['a']);
  });

  it('moves a tile that overlaps an earlier one to the first free spot', () => {
    const json = JSON.stringify([
      { id: 'a', x: 0, y: 0, w: 4, h: 4, type: 'text', text: 'first' },
      { id: 'b', x: 2, y: 2, w: 4, h: 4, type: 'text', text: 'overlaps a' },
    ]);
    expect(parseTiles(json)[1]).toEqual({ id: 'b', x: 4, y: 0, w: 4, h: 4, type: 'text', text: 'overlaps a' });
  });

  it("never moves a tile that doesn't overlap, even when a moved tile would fit in its spot", () => {
    const json = JSON.stringify([
      { id: 'newer', x: 0, y: 8, w: 4, h: 4, type: 'text', text: 'keeps its spot' },
      { id: 'older', x: 2, y: 9, w: 4, h: 4, type: 'text', text: 'loses the spot' },
      { id: 'other', x: 0, y: 0, w: 4, h: 4, type: 'text', text: 'unrelated' },
    ]);
    const byId = Object.fromEntries(parseTiles(json).map((t) => [t.id, { x: t.x, y: t.y }]));
    expect(byId).toEqual({ newer: { x: 0, y: 8 }, other: { x: 0, y: 0 }, older: { x: 4, y: 0 } });
  });

  it('upgrades tiles saved by the old slot grid', () => {
    const json = JSON.stringify([
      { id: 'a', position: 0, type: 'text', text: 'first' },
      { id: 'b', position: 5, type: 'text', text: 'second row' },
    ]);
    expect(parseTiles(json)).toEqual([
      { id: 'a', x: 0, y: 0, w: 4, h: 4, type: 'text', text: 'first' },
      { id: 'b', x: 4, y: 4, w: 4, h: 4, type: 'text', text: 'second row' },
    ]);
  });

  it('throws when the JSON is not an array', () => {
    expect(() => parseTiles('{}')).toThrow();
    expect(() => parseTiles('not json')).toThrow();
  });
});

describe('placeBelow', () => {
  const existing: Tile[] = [
    { id: 'a', x: 0, y: 0, w: 4, h: 4, type: 'text', text: 'account' },
    { id: 'b', x: 4, y: 2, w: 6, h: 5, type: 'text', text: 'account' },
  ];

  it('shifts tiles below the existing ones, keeping their layout', () => {
    const local: Tile[] = [
      { id: 'c', x: 0, y: 0, w: 4, h: 4, type: 'text', text: 'device' },
      { id: 'd', x: 6, y: 3, w: 4, h: 4, type: 'text', text: 'device' },
    ];
    expect(placeBelow(local, existing).map(({ id, x, y }) => ({ id, x, y }))).toEqual([
      { id: 'c', x: 0, y: 7 },
      { id: 'd', x: 6, y: 10 },
    ]);
  });

  it('renames tiles whose id is already taken', () => {
    const [moved] = placeBelow([{ id: 'a', x: 0, y: 0, w: 4, h: 4, type: 'text', text: 'device' }], existing);
    expect(moved.id).not.toBe('a');
    expect(moved).toMatchObject({ x: 0, y: 7, text: 'device' });
  });

  it('leaves tiles in place when the account is empty', () => {
    const local: Tile[] = [{ id: 'c', x: 2, y: 3, w: 4, h: 4, type: 'text', text: 'device' }];
    expect(placeBelow(local, [])).toEqual(local);
  });
});
