import { describe, expect, it } from 'vitest';
import { boardRows, collides, COLS, firstFit, fitRect, moveBy, resizeBy } from './layout';

const r = (x: number, y: number, w: number, h: number) => ({ x, y, w, h });

describe('collides', () => {
  it('detects overlap but not touching edges', () => {
    expect(collides(r(0, 0, 4, 4), [r(3, 3, 2, 2)])).toBe(true);
    expect(collides(r(0, 0, 4, 4), [r(4, 0, 2, 2), r(0, 4, 2, 2)])).toBe(false);
  });
});

describe('fitRect', () => {
  it('uses the full size when the area is free', () => {
    expect(fitRect({ x: 2, y: 3 }, { w: 6, h: 4 }, [])).toEqual(r(2, 3, 6, 4));
  });

  it('shifts left at the right edge so the tile still covers the cell', () => {
    expect(fitRect({ x: COLS - 1, y: 0 }, { w: 6, h: 4 }, [])).toEqual(r(COLS - 6, 0, 6, 4));
  });

  it('shrinks to fit next to other tiles', () => {
    expect(fitRect({ x: 0, y: 0 }, { w: 6, h: 6 }, [r(3, 0, 4, 4)])).toEqual(r(0, 0, 3, 6));
  });

  it('returns null when not even a minimum tile fits', () => {
    expect(fitRect({ x: 0, y: 0 }, { w: 6, h: 6 }, [r(1, 0, 4, 4)])).toBeNull();
  });
});

describe('firstFit', () => {
  it('finds the first free spot scanning rows', () => {
    expect(firstFit({ w: 4, h: 4 }, [])).toEqual(r(0, 0, 4, 4));
    expect(firstFit({ w: 4, h: 4 }, [r(0, 0, 14, 4)])).toEqual(r(0, 4, 4, 4));
  });
});

describe('moveBy and resizeBy', () => {
  it('keeps tiles inside the mat', () => {
    expect(moveBy(r(2, 2, 4, 4), -10, -10)).toEqual(r(0, 0, 4, 4));
    expect(moveBy(r(2, 2, 4, 4), 100, 3)).toEqual(r(COLS - 4, 5, 4, 4));
  });

  it('enforces the minimum size and the right edge', () => {
    expect(resizeBy(r(10, 0, 4, 4), -10, -10)).toEqual(r(10, 0, 2, 2));
    expect(resizeBy(r(10, 0, 4, 4), 10, 2)).toEqual(r(10, 0, COLS - 10, 6));
  });
});

describe('boardRows', () => {
  it('leaves empty rows below the lowest tile', () => {
    expect(boardRows([])).toBe(8);
    expect(boardRows([r(0, 10, 4, 5)])).toBe(23);
  });
});
