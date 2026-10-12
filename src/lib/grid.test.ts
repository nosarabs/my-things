import { describe, expect, it } from 'vitest';
import type { Tile } from '../types';
import { getSlotCount } from './grid';

const at = (position: number): Tile => ({ id: String(position), position, type: 'text', text: '' });

describe('getSlotCount', () => {
  it('renders 12 slots for an empty or sparse grid', () => {
    expect(getSlotCount([])).toBe(12);
    expect(getSlotCount([at(0), at(10)])).toBe(12);
  });

  it('adds another 12 once the last slot is taken', () => {
    expect(getSlotCount([at(11)])).toBe(24);
    expect(getSlotCount([at(22)])).toBe(24);
    expect(getSlotCount([at(23)])).toBe(36);
  });
});
