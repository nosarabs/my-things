import { LinkExternalIcon, TrashIcon } from '@primer/octicons-react';
import { tileDefs } from '../tiles/registry';
import type { Tile, TileDef, TileType } from '../types';
import styles from './TileCard.module.css';

type Props = { tile: Tile; onRemove(): void };

export function TileCard({ tile, onRemove }: Props) {
  const def: TileDef<TileType> = tileDefs[tile.type];
  const { icon: Icon, View } = def;
  const title = def.title(tile);
  const href = def.href?.(tile);

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <Icon size={16} className={styles.icon} />
        <h2 className={styles.title} title={title}>
          {title}
        </h2>
        {href && (
          <a
            className={`btn btn-icon ${styles.action}`}
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label="Open in new tab"
          >
            <LinkExternalIcon size={16} />
          </a>
        )}
        <button
          type="button"
          className={`btn btn-icon ${styles.action}`}
          onClick={() => confirm('Delete this tile?') && onRemove()}
          aria-label="Delete tile"
        >
          <TrashIcon size={16} />
        </button>
      </header>
      <div className={styles.body}>
        <View tile={tile} />
      </div>
    </article>
  );
}
