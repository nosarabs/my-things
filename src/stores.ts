import { sameRect } from './lib/layout';
import { supabase } from './lib/supabase';
import { loadTiles, saveTiles, toTiles } from './storage';
import type { Tile } from './types';

/** One edit: the full list after it, plus the tiles it writes and deletes. */
export type Change = { next: Tile[]; upsert?: Tile[]; remove?: Tile[] };

export type TileStore = {
  load(): Promise<Tile[]>;
  /** Rejects with a message that is safe to show to the user. */
  save(change: Change): Promise<void>;
};

export const localStore: TileStore = {
  load: async () => loadTiles(),
  async save({ next }) {
    if (!saveTiles(next)) {
      throw new Error("Couldn't save: your browser's storage is full. Remove some photos and try again.");
    }
  },
};

type Row = Pick<Tile, 'id' | 'type' | 'x' | 'y' | 'w' | 'h'> & { data: Record<string, unknown> };

export const toRow = ({ id, type, x, y, w, h, ...data }: Tile): Row => ({ id, type, x, y, w, h, data });

/** Rows are untrusted until they pass the same validation as imported files. */
export const fromRow = ({ data, ...columns }: Row): unknown => ({ ...data, ...columns });

const SAVE_FAILED = "Couldn't save. Check your connection and try again.";

function cloudStore(client: NonNullable<typeof supabase>): TileStore {
  const table = () => client.from('tiles');

  const store: TileStore = {
    async load() {
      // Newest first, so if two devices put tiles in the same spot, the latest change keeps it.
      const { data, error } = await table()
        .select('id, type, x, y, w, h, data')
        .order('updated_at', { ascending: false });
      if (error) throw new Error("Couldn't load your tiles. Check your connection.");

      const rows: Row[] = data;
      const tiles = toTiles(rows.map(fromRow));
      const moved = tiles.filter((tile) => !sameRect(tile, rows.find((row) => row.id === tile.id)!));
      if (moved.length) store.save({ next: tiles, upsert: moved }).catch(() => {});
      return tiles;
    },
    async save({ upsert = [], remove = [] }) {
      // Write before deleting, so failing part way never loses a tile.
      if (upsert.length && (await table().upsert(upsert.map(toRow))).error) throw new Error(SAVE_FAILED);
      if (remove.length && (await table().delete().in('id', remove.map((t) => t.id))).error) {
        throw new Error(SAVE_FAILED);
      }
    },
  };
  return store;
}

/** Null when Supabase isn't configured. Row-level security scopes every query to the signed-in user. */
export const cloudTiles = supabase && cloudStore(supabase);
