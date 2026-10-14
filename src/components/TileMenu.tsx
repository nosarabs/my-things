import { LinkExternalIcon, PencilIcon, TrashIcon } from '@primer/octicons-react';
import { tileDefs } from '../tiles/registry';
import type { Tile, TileDef, TileType } from '../types';
import { Modal } from './Modal';
import styles from './Menu.module.css';

type Props = {
  tile: Tile;
  anchor: { x: number; y: number };
  onEdit(): void;
  onRemove(): void;
  onClose(): void;
};

export function TileMenu({ tile, anchor, onEdit, onRemove, onClose }: Props) {
  const { label, icon: Icon, href }: TileDef<TileType> = tileDefs[tile.type];

  return (
    <Modal labelledBy="tile-menu-title" anchor={anchor} onClose={onClose}>
      <h2 id="tile-menu-title" className={styles.title}>
        <Icon size={16} />
        {label}
      </h2>
      <div className={styles.list}>
        <button type="button" className={styles.item} onClick={onEdit}>
          <PencilIcon size={16} />
          Edit
        </button>
        {href && (
          <button
            type="button"
            className={styles.item}
            onClick={() => {
              window.open(href(tile), '_blank', 'noopener');
              onClose();
            }}
          >
            <LinkExternalIcon size={16} />
            Open in new tab
          </button>
        )}
        <button
          type="button"
          className={`${styles.item} ${styles.danger}`}
          onClick={() => confirm('Delete this tile?') && onRemove()}
        >
          <TrashIcon size={16} />
          Delete
        </button>
      </div>
    </Modal>
  );
}
