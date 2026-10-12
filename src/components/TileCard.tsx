import { LinkExternalIcon, TrashIcon } from '@primer/octicons-react';
import type { PointerEvent } from 'react';
import { gridArea } from '../lib/layout';
import { tileDefs } from '../tiles/registry';
import type { Rect, Tile, TileDef, TileType } from '../types';
import styles from './TileCard.module.css';

type Props = {
  tile: Tile;
  rect: Rect;
  active: boolean;
  onRemove(): void;
  onMoveStart(event: PointerEvent<HTMLElement>): void;
  onResizeStart(event: PointerEvent<HTMLElement>): void;
};

export function TileCard({ tile, rect, active, onRemove, onMoveStart, onResizeStart }: Props) {
  const def: TileDef<TileType> = tileDefs[tile.type];
  const { icon: Icon, View } = def;
  const title = def.title(tile);
  const href = def.href?.(tile);

  return (
    <article
      id={tile.id}
      className={active ? `${styles.card} ${styles.active}` : styles.card}
      style={gridArea(rect)}
    >
      <header className={styles.header} onPointerDown={onMoveStart}>
        <Icon size={16} className={styles.icon} />
        <h2 className={styles.title} title={title}>
          {title}
        </h2>
        {href && (
          <a
            className={`btn btn-icon ${styles.action} ${styles.link}`}
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
      <div className={styles.resize} onPointerDown={onResizeStart} aria-hidden="true" />
    </article>
  );
}
