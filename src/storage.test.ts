import { describe, expect, it } from 'vitest';
import { parseTiles } from './storage';

describe('parseTiles', () => {
  it('keeps valid tiles', () => {
    const tiles = [
      { id: 'a', x: 0, y: 0, w: 4, h: 4, type: 'text', text: 'hi' },
      { id: 'b', x: 4, y: 0, w: 8, h: 5, type: 'youtube', videoId: 'dQw4w9WgXcQ' },
      { id: 'c', x: 12, y: 0, w: 4, h: 4, type: 'image', src: 'https://example.com/a.png', alt: '' },
      { id: 'd', x: 0, y: 6, w: 8, h: 8, type: 'website', url: 'https://example.com/' },
    ];
    expect(parseTiles(JSON.stringify(tiles))).toEqual(tiles);
  });

  it('drops invalid entries and overlapping tiles', () => {
    const json = JSON.stringify([
      { id: 'a', x: 0, y: 0, w: 4, h: 4, type: 'text', text: 'first' },
      { id: 'b', x: 2, y: 2, w: 4, h: 4, type: 'text', text: 'overlaps a' },
      { id: 'c', x: 4, y: 0, w: 4, h: 4, type: 'website', url: 'javascript:alert(1)' },
      { id: 'd', x: -1, y: 0, w: 4, h: 4, type: 'text', text: 'negative' },
      { id: 'e', x: 14, y: 0, w: 4, h: 4, type: 'text', text: 'past the right edge' },
      { id: 'f', x: 8, y: 0, w: 1, h: 4, type: 'text', text: 'too small' },
      { id: 'g', x: 8, y: 8, w: 4, h: 4, type: 'toString' },
      null,
    ]);
    expect(parseTiles(json).map((t) => t.id)).toEqual(['a']);
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
