import { useEffect, useState } from 'react';
import { loadTiles, saveTiles } from './storage';
import type { NewTile, Tile } from './types';

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
    add: (tile: NewTile, position: number) =>
      setTiles((prev) => [
        ...prev.filter((t) => t.position !== position),
        { ...tile, id: newId(), position },
      ]),
    remove: (id: string) => setTiles((prev) => prev.filter((t) => t.id !== id)),
    replaceAll: setTiles,
  };
}
