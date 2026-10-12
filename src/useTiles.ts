import { useEffect, useState } from 'react';
import { loadTiles, saveTiles } from './storage';
import type { NewTile, Rect, Tile } from './types';

// crypto.randomUUID only exists in secure contexts, so it is missing when testing over a LAN IP.
const newId = () =>
  window.isSecureContext
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export function useTiles() {
  const [tiles, setTiles] = useState<Tile[]>(loadTiles);

  useEffect(() => saveTiles(tiles), [tiles]);

  return {
    tiles,
    add(content: NewTile, rect: Rect) {
      const id = newId();
      setTiles((prev) => [...prev, { ...content, ...rect, id }]);
      return id;
    },
    update: (id: string, rect: Rect) =>
      setTiles((prev) => prev.map((t) => (t.id === id ? { ...t, ...rect } : t))),
    remove: (id: string) => setTiles((prev) => prev.filter((t) => t.id !== id)),
    replaceAll: setTiles,
  };
}
