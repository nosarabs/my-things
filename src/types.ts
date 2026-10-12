import type { Icon } from '@primer/octicons-react';
import type { ReactNode } from 'react';

type Base = { id: string; position: number };

export type Tile =
  | (Base & { type: 'youtube'; videoId: string })
  | (Base & { type: 'text'; text: string })
  | (Base & { type: 'image'; src: string; alt: string })
  | (Base & { type: 'website'; url: string });

export type TileType = Tile['type'];
export type TileOf<K extends TileType> = Extract<Tile, { type: K }>;
export type NewTile<K extends TileType = TileType> = K extends TileType
  ? Omit<TileOf<K>, 'id' | 'position'>
  : never;

export type Field = {
  name: string;
  label: string;
  kind: 'url' | 'text' | 'textarea';
  placeholder?: string;
};

// Method syntax keeps parameters bivariant, so every TileDef<K> is assignable to TileDef<TileType>.
export type TileDef<K extends TileType> = {
  label: string;
  icon: Icon;
  fields: Field[];
  parse(values: Record<string, string>): NewTile<K> | { error: string };
  title(tile: TileOf<K>): string;
  href?(tile: TileOf<K>): string;
  View(props: { tile: TileOf<K> }): ReactNode;
};
