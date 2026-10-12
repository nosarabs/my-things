import type { Cell, Rect, Size } from '../types';

export const COLS = 16;
export const MIN_SIZE = 2;
const MIN: Size = { w: MIN_SIZE, h: MIN_SIZE };
const EXTRA_ROWS = 8;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const overlaps = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

export const collides = (rect: Rect, others: Rect[]) => others.some((other) => overlaps(rect, other));

export const sameRect = (a: Rect, b: Rect) => a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;

export const moveBy = (r: Rect, dx: number, dy: number): Rect => ({
  x: clamp(r.x + dx, 0, COLS - r.w),
  y: Math.max(0, r.y + dy),
  w: r.w,
  h: r.h,
});

export const resizeBy = (r: Rect, dw: number, dh: number): Rect => ({
  x: r.x,
  y: r.y,
  w: clamp(r.w + dw, MIN_SIZE, COLS - r.x),
  h: Math.max(MIN_SIZE, r.h + dh),
});

/**
 * Largest free rect, up to `size`, that covers `cell`. It starts at the cell and only shifts
 * left at the right edge. Returns null when not even a minimum-size tile fits.
 */
export function fitRect(cell: Cell, size: Size, others: Rect[]): Rect | null {
  let best: Rect | null = null;
  for (let w = size.w; w >= MIN_SIZE; w--) {
    for (let h = size.h; h >= MIN_SIZE; h--) {
      const rect = { x: Math.min(cell.x, COLS - w), y: cell.y, w, h };
      if ((!best || w * h > best.w * best.h) && !collides(rect, others)) best = rect;
    }
  }
  return best;
}

export const canPlace = (cell: Cell, others: Rect[]) => fitRect(cell, MIN, others) !== null;

/** First free spot for a full-size tile, scanning rows top to bottom. */
export function firstFit(size: Size, others: Rect[]): Rect {
  for (let y = 0; ; y++) {
    for (let x = 0; x + size.w <= COLS; x++) {
      const rect = { x, y, ...size };
      if (!collides(rect, others)) return rect;
    }
  }
}

export const boardRows = (rects: Rect[]) => Math.max(0, ...rects.map((r) => r.y + r.h)) + EXTRA_ROWS;

export const gridArea = ({ x, y, w, h }: Rect) => ({
  gridColumn: `${x + 1} / span ${w}`,
  gridRow: `${y + 1} / span ${h}`,
});
