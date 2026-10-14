import { describe, expect, it } from 'vitest';
import { toTiles } from './storage';
import { fromRow, toRow } from './stores';
import type { Tile } from './types';

describe('toRow / fromRow', () => {
  const tiles: Tile[] = [
    { id: 'a', x: 0, y: 0, w: 4, h: 4, type: 'text', text: 'hi' },
    { id: 'b', x: 4, y: 0, w: 8, h: 5, type: 'youtube', videoId: 'dQw4w9WgXcQ' },
    { id: 'c', x: 0, y: 5, w: 6, h: 6, type: 'image', src: 'https://example.com/a.png', alt: 'a' },
    { id: 'd', x: 6, y: 5, w: 8, h: 6, type: 'website', url: 'https://example.com/' },
  ];

  it('keeps type-specific fields in data and the rest in columns', () => {
    expect(toRow(tiles[0])).toEqual({ id: 'a', type: 'text', x: 0, y: 0, w: 4, h: 4, data: { text: 'hi' } });
  });

  it('round-trips every tile type', () => {
    expect(toTiles(tiles.map(toRow).map(fromRow))).toEqual(tiles);
  });

  it('lets columns win over look-alike keys in data', () => {
    const row = { ...toRow(tiles[0]), data: { text: 'hi', id: 'spoofed', x: 99 } };
    expect(fromRow(row)).toMatchObject({ id: 'a', x: 0 });
  });
});
