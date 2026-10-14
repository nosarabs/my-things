import { useEffect, useRef, useState } from 'react';
import { newId } from './lib/id';
import { removePhotos, uploadPhotos } from './lib/photos';
import { clearTiles, loadTiles, placeBelow } from './storage';
import { cloudTiles, localStore, type Change, type TileStore } from './stores';
import type { NewTile, Rect, Tile } from './types';

/** Whose tiles to show: a user id, null for this device only, undefined while the session loads. */
export type Owner = string | null | undefined;
export type TilesStatus = 'loading' | 'ready' | 'error';

const KEEP_LOCAL_KEY = 'my-things:keep-local';

/**
 * Moves tiles saved on this device into the signed-in account. Asks first when the account already
 * has tiles and puts them below those. A "no" is remembered for that account on this device.
 */
async function adoptLocalTiles(userId: string, cloud: TileStore) {
  const local = loadTiles();
  if (!local.length || localStorage.getItem(KEEP_LOCAL_KEY) === userId) return;

  const existing = await cloud.load();
  const message = `Add the ${local.length} tiles saved on this device to your account? They'll go below your other tiles.`;
  if (existing.length && !confirm(message)) {
    localStorage.setItem(KEEP_LOCAL_KEY, userId);
    return;
  }
  const moved = placeBelow(await uploadPhotos(local), existing);
  await cloud.save({ next: [...existing, ...moved], upsert: moved });
  clearTiles();
}

// Module-level so it runs once per sign-in, even when StrictMode runs effects twice.
let adoption: { userId: string; done: Promise<void> } | undefined;

function adopt(userId: string, cloud: TileStore) {
  if (adoption?.userId !== userId) {
    const done = adoptLocalTiles(userId, cloud).catch(() => {
      adoption = undefined;
      alert("Couldn't move this device's tiles to your account. They're still saved here; reload to try again.");
    });
    adoption = { userId, done };
  }
  return adoption.done;
}

export function useTiles(owner: Owner) {
  const [state, setState] = useState<{ owner: Owner; tiles: Tile[]; status: TilesStatus }>();
  const latest = useRef<Tile[]>([]);
  const writes = useRef(0);
  const store = owner && cloudTiles ? cloudTiles : localStore;
  const current = state && state.owner === owner ? state : { tiles: [], status: 'loading' as const };

  useEffect(() => {
    if (owner === undefined) return;
    let live = true;

    async function refresh() {
      // A reload mid-write could briefly undo it on screen; the next refresh catches up instead.
      if (writes.current) return;
      try {
        const tiles = await store.load();
        if (!live || writes.current) return;
        latest.current = tiles;
        setState({ owner, tiles, status: 'ready' });
      } catch {
        // Keep showing tiles that already loaded; only a failed first load is an error.
        if (live) setState((s) => (s && s.owner === owner && s.status === 'ready' ? s : { owner, tiles: [], status: 'error' }));
      }
    }

    void (owner ? adopt(owner, store) : Promise.resolve()).then(refresh);
    const onVisible = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      live = false;
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [owner, store]);

  function apply(next: Tile[]) {
    latest.current = next;
    setState({ owner, tiles: next, status: 'ready' });
  }

  async function write(change: Change) {
    writes.current++;
    try {
      await store.save(change);
      return true;
    } catch (error) {
      alert(error instanceof Error ? error.message : "Couldn't save.");
      return false;
    } finally {
      writes.current--;
    }
  }

  const replace = (tile: Tile) => latest.current.map((t) => (t.id === tile.id ? tile : t));

  return {
    tiles: current.tiles,
    status: current.status,

    /** Resolves to the new tile's id, or null if it couldn't be saved. */
    async add(content: NewTile, rect: Rect) {
      const tile: Tile = { ...content, ...rect, id: newId() };
      if (!(await write({ next: [...latest.current, tile], upsert: [tile] }))) {
        removePhotos([tile]);
        return null;
      }
      apply([...latest.current, tile]);
      return tile.id;
    },

    async edit(id: string, content: NewTile) {
      const old = latest.current.find((t) => t.id === id);
      if (!old) return false;
      const tile: Tile = { ...content, id, x: old.x, y: old.y, w: old.w, h: old.h };
      if (!(await write({ next: replace(tile), upsert: [tile] }))) {
        removePhotos([tile], [old]);
        return false;
      }
      apply(replace(tile));
      removePhotos([old], [tile]);
      return true;
    },

    move(id: string, rect: Rect) {
      const old = latest.current.find((t) => t.id === id);
      if (!old) return;
      const tile = { ...old, ...rect };
      apply(replace(tile));
      void write({ next: latest.current, upsert: [tile] }).then((ok) => ok || apply(replace(old)));
    },

    remove(id: string) {
      const tile = latest.current.find((t) => t.id === id);
      if (!tile) return;
      apply(latest.current.filter((t) => t.id !== id));
      void write({ next: latest.current, remove: [tile] }).then((ok) =>
        ok ? removePhotos([tile]) : apply([...latest.current, tile]),
      );
    },

    async replaceAll(imported: Tile[]) {
      const previous = latest.current;
      let next = imported;
      if (owner) {
        try {
          next = await uploadPhotos(imported);
        } catch {
          alert("Couldn't upload the imported photos. Check your connection and try again.");
          return false;
        }
      }
      const kept = new Set(next.map((t) => t.id));
      const removed = previous.filter((t) => !kept.has(t.id));
      if (!(await write({ next, upsert: next, remove: removed }))) {
        removePhotos(next, previous);
        return false;
      }
      apply(next);
      removePhotos(previous, next);
      return true;
    },
  };
}
