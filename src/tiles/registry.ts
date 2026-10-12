import type { TileDef, TileType } from '../types';
import { image } from './image';
import { text } from './text';
import { website } from './website';
import { youtube } from './youtube';

export const tileDefs: { [K in TileType]: TileDef<K> } = { youtube, text, image, website };

export const tileTypes = Object.keys(tileDefs) as TileType[];
