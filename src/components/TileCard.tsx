import type { PointerEvent } from 'react';
import { gridArea } from '../lib/layout';
import { tileDefs } from '../tiles/registry';
import type { Rect, Tile, TileDef, TileType } from '../types';
import styles from './TileCard.module.css';

type Point = { x: number; y: number };

type Props = {
  tile: Tile;
  rect: Rect;
  active: boolean;
  lifted: boolean;
  dragging: boolean;
  onPress(event: PointerEvent<HTMLElement>): void;
  onResize(event: PointerEvent<HTMLElement>): void;
  onMenu(at: Point): void;
};

export function TileCard({ tile, rect, active, lifted, dragging, onPress, onResize, onMenu }: Props) {
  const { label, View }: TileDef<TileType> = tileDefs[tile.type];
  const className = [styles.card, lifted && styles.lifted, dragging && styles.dragging]
    .filter(Boolean)
    .join(' ');

  return (
    <article
      id={tile.id}
      className={className}
      style={gridArea(rect)}
      tabIndex={0}
      aria-label={`${label} tile. Press Enter for options.`}
      onPointerDown={onPress}
      onContextMenu={(event) => {
        event.preventDefault();
        // Touch long presses are handled by the press tracker, which also allows dragging.
        if ((event.nativeEvent as globalThis.PointerEvent).pointerType !== 'touch') {
          onMenu({ x: event.clientX, y: event.clientY });
        }
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' || event.target !== event.currentTarget) return;
        const box = event.currentTarget.getBoundingClientRect();
        onMenu({ x: box.left + box.width / 2, y: box.top + box.height / 2 });
      }}
    >
      <View tile={tile} active={active} />
      <div
        className={styles.resize}
        onPointerDown={(event) => {
          event.stopPropagation();
          onResize(event);
        }}
        aria-hidden="true"
      />
    </article>
  );
}
