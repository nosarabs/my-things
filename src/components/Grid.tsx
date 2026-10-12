import { getSlotCount } from '../lib/grid';
import type { Tile } from '../types';
import { EmptyCell } from './EmptyCell';
import styles from './Grid.module.css';
import { TileCard } from './TileCard';

type Props = {
  tiles: Tile[];
  onAdd(position: number): void;
  onRemove(id: string): void;
};

export function Grid({ tiles, onAdd, onRemove }: Props) {
  const byPosition = new Map(tiles.map((tile) => [tile.position, tile]));

  return (
    <main className={styles.main}>
      {tiles.length === 0 && <p className={styles.hint}>Tap any empty square to add your first tile.</p>}
      <div className={styles.grid}>
        {Array.from({ length: getSlotCount(tiles) }, (_, position) => {
          const tile = byPosition.get(position);
          return tile ? (
            <TileCard key={tile.id} tile={tile} onRemove={() => onRemove(tile.id)} />
          ) : (
            <EmptyCell key={`empty-${position}`} onClick={() => onAdd(position)} />
          );
        })}
      </div>
    </main>
  );
}
