import { describe, expect, it } from 'vitest';
import { isHttpUrl, parseYouTubeId, toHttpUrl } from './url';

describe('parseYouTubeId', () => {
  const id = 'dQw4w9WgXcQ';

  it.each([
    id,
    `https://www.youtube.com/watch?v=${id}`,
    `https://m.youtube.com/watch?v=${id}&t=42s`,
    `youtube.com/watch?v=${id}`,
    `https://youtu.be/${id}?si=abc`,
    `https://www.youtube.com/shorts/${id}`,
    `https://www.youtube.com/embed/${id}`,
    `https://www.youtube-nocookie.com/embed/${id}`,
    `https://www.youtube.com/live/${id}`,
    `  ${id}  `,
  ])('extracts the ID from %s', (input) => {
    expect(parseYouTubeId(input)).toBe(id);
  });

  it.each(['', 'not a video', 'https://vimeo.com/123456', 'https://youtube.com/watch?v=short'])(
    'rejects %j',
    (input) => {
      expect(parseYouTubeId(input)).toBeNull();
    },
  );
});

describe('toHttpUrl', () => {
  it('adds https:// when the scheme is missing', () => {
    expect(toHttpUrl('example.com')).toBe('https://example.com/');
  });

  it('keeps http and https URLs', () => {
    expect(toHttpUrl('http://example.com/a?b=1')).toBe('http://example.com/a?b=1');
    expect(toHttpUrl(' https://github.com ')).toBe('https://github.com/');
  });

  it.each(['', 'hello', 'javascript:alert(1)', 'data:text/html,hi', 'ftp://example.com'])(
    'rejects %j',
    (input) => {
      expect(toHttpUrl(input)).toBeNull();
    },
  );
});

describe('isHttpUrl', () => {
  it('only accepts http and https', () => {
    expect(isHttpUrl('https://example.com')).toBe(true);
    expect(isHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isHttpUrl('example.com')).toBe(false);
  });
});
