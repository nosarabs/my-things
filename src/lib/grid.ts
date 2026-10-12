import type { Tile } from '../types';

// Divisible by every column count (2, 3, 4), so the last row is always full.
const SLOT_STEP = 12;

/** Number of grid slots to render: always a multiple of 12 with at least one empty slot. */
export function getSlotCount(tiles: Tile[]): number {
  const maxPosition = Math.max(-1, ...tiles.map((t) => t.position));
  return Math.max(SLOT_STEP, Math.ceil((maxPosition + 2) / SLOT_STEP) * SLOT_STEP);
}
