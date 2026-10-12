import { describe, expect, it } from 'vitest';
import { parseTiles } from './storage';

describe('parseTiles', () => {
  it('keeps valid tiles', () => {
    const tiles = [
      { id: 'a', position: 0, type: 'text', text: 'hi' },
      { id: 'b', position: 3, type: 'youtube', videoId: 'dQw4w9WgXcQ' },
      { id: 'c', position: 4, type: 'image', src: 'https://example.com/a.png', alt: '' },
      { id: 'd', position: 7, type: 'website', url: 'https://example.com/' },
    ];
    expect(parseTiles(JSON.stringify(tiles))).toEqual(tiles);
  });

  it('drops invalid entries and duplicate positions', () => {
    const json = JSON.stringify([
      { id: 'a', position: 0, type: 'text', text: 'first' },
      { id: 'b', position: 0, type: 'text', text: 'duplicate' },
      { id: 'c', position: 1, type: 'website', url: 'javascript:alert(1)' },
      { id: 'd', position: -1, type: 'text', text: 'negative' },
      { id: 'e', position: 2, type: 'unknown' },
      { id: 'f', position: 3, type: 'toString' },
      null,
    ]);
    expect(parseTiles(json).map((t) => t.id)).toEqual(['a']);
  });

  it('throws when the JSON is not an array', () => {
    expect(() => parseTiles('{}')).toThrow();
    expect(() => parseTiles('not json')).toThrow();
  });
});
