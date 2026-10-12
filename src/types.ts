import type { Icon } from '@primer/octicons-react';
import type { ReactNode } from 'react';

/** Positions and sizes are measured in grid cells. */
export type Cell = { x: number; y: number };
export type Size = { w: number; h: number };
export type Rect = Cell & Size;

type Base = Rect & { id: string };

export type Tile =
  | (Base & { type: 'youtube'; videoId: string })
  | (Base & { type: 'text'; text: string })
  | (Base & { type: 'image'; src: string; alt: string })
  | (Base & { type: 'website'; url: string });

export type TileType = Tile['type'];
// Mapped lookups rather than conditional types, so TypeScript can measure TileDef's variance.
type TileMap = { [T in Tile as T['type']]: T };
type NewTileMap = { [T in Tile as T['type']]: Omit<T, 'id' | keyof Rect> };
export type TileOf<K extends TileType> = TileMap[K];
export type NewTile<K extends TileType = TileType> = NewTileMap[K];

export type Field = {
  name: string;
  label: string;
  kind: 'url' | 'text' | 'textarea' | 'image';
  placeholder?: string;
};

type ParseResult<K extends TileType> = NewTile<K> | { error: string };

// Method syntax keeps parameters bivariant, so every TileDef<K> is assignable to TileDef<TileType>.
export type TileDef<K extends TileType> = {
  label: string;
  icon: Icon;
  size: Size;
  fields: Field[];
  /** Tapping the tile switches it to live content, like a playing video. */
  interactive?: boolean;
  /** Form values for editing an existing tile, keyed by field name. */
  defaults(tile: TileOf<K>): Record<string, string>;
  parse(form: FormData, current?: TileOf<K>): ParseResult<K> | Promise<ParseResult<K>>;
  href?(tile: TileOf<K>): string;
  View(props: { tile: TileOf<K>; active: boolean }): ReactNode;
};
