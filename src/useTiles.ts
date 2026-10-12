import { useRef, useState } from 'react';
import { loadTiles, saveTiles } from './storage';
import type { NewTile, Rect, Tile } from './types';

// crypto.randomUUID only exists in secure contexts, so it is missing when testing over a LAN IP.
const newId = () =>
  window.isSecureContext
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export function useTiles() {
  const [tiles, setTiles] = useState<Tile[]>(loadTiles);
  const latest = useRef(tiles);

  /** Saves before updating state, so a full storage quota never leaves unsaved tiles on screen. */
  function commit(next: Tile[]) {
    if (!saveTiles(next)) {
      alert("Couldn't save: your browser's storage is full. Remove some photos and try again.");
      return false;
    }
    latest.current = next;
    setTiles(next);
    return true;
  }

  return {
    tiles,
    add(content: NewTile, rect: Rect) {
      const id = newId();
      return commit([...latest.current, { ...content, ...rect, id }]) ? id : null;
    },
    move: (id: string, rect: Rect) =>
      commit(latest.current.map((t) => (t.id === id ? { ...t, ...rect } : t))),
    edit: (id: string, content: NewTile) =>
      commit(latest.current.map((t) => (t.id === id ? { ...content, id, x: t.x, y: t.y, w: t.w, h: t.h } : t))),
    remove: (id: string) => commit(latest.current.filter((t) => t.id !== id)),
    replaceAll: commit,
  };
}
