import { PlusIcon } from '@primer/octicons-react';
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  boardRows,
  canPlace,
  collides,
  COLS,
  gridArea,
  moveBy,
  resizeBy,
  sameRect,
} from '../lib/layout';
import type { Cell, Rect, Tile } from '../types';
import styles from './Board.module.css';
import { TileCard } from './TileCard';

type Props = {
  tiles: Tile[];
  focusId: string | null;
  onAdd(cell: Cell): void;
  onUpdate(id: string, rect: Rect): void;
  onRemove(id: string): void;
};

type Point = { clientX: number; clientY: number };

/** Reports how many whole cells the pointer has moved until it is released. */
function trackDrag(
  event: ReactPointerEvent<HTMLElement>,
  cellSize: number,
  onStep: (dx: number, dy: number) => void,
  onEnd: () => void,
) {
  const el = event.currentTarget;
  const { clientX, clientY } = event;
  const move = (e: PointerEvent) =>
    onStep(Math.round((e.clientX - clientX) / cellSize), Math.round((e.clientY - clientY) / cellSize));

  el.setPointerCapture(event.pointerId);
  el.addEventListener('pointermove', move);
  el.addEventListener(
    'lostpointercapture',
    () => {
      el.removeEventListener('pointermove', move);
      onEnd();
    },
    { once: true },
  );
}

export function Board({ tiles, focusId, onAdd, onUpdate, onRemove }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<(Rect & { id: string }) | null>(null);
  const [hover, setHover] = useState<Cell | null>(null);

  useEffect(() => {
    if (focusId) document.getElementById(focusId)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focusId]);

  const cellSize = () => ref.current!.getBoundingClientRect().width / COLS;

  /** The mat cell under the pointer, or null if no tile could be added there. */
  function freeCellAt({ clientX, clientY }: Point): Cell | null {
    const box = ref.current!.getBoundingClientRect();
    const size = box.width / COLS;
    const cell = {
      x: Math.min(COLS - 1, Math.floor((clientX - box.left) / size)),
      y: Math.floor((clientY - box.top) / size),
    };
    return canPlace(cell, tiles) ? cell : null;
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse') return;
    const cell = event.target === event.currentTarget && !draft ? freeCellAt(event) : null;
    if (cell?.x !== hover?.x || cell?.y !== hover?.y) setHover(cell);
  }

  function startGesture(tile: Tile, mode: 'move' | 'resize', event: ReactPointerEvent<HTMLElement>) {
    if (event.button !== 0 || (event.target as Element).closest('button, a')) return;
    event.preventDefault();
    setHover(null);

    const others = tiles.filter((t) => t.id !== tile.id);
    const apply = mode === 'move' ? moveBy : resizeBy;
    let rect: Rect = tile;
    let last = { dx: 0, dy: 0 };
    trackDrag(
      event,
      cellSize(),
      (dx, dy) => {
        // When blocked, keep one axis at its last accepted value so the tile slides along neighbors.
        for (const step of [{ dx, dy }, { dx, dy: last.dy }, { dx: last.dx, dy }]) {
          const next = apply(tile, step.dx, step.dy);
          if (collides(next, others)) continue;
          last = step;
          if (!sameRect(next, rect)) {
            rect = next;
            setDraft({ ...next, id: tile.id });
          }
          return;
        }
      },
      () => {
        setDraft(null);
        if (!sameRect(rect, tile)) onUpdate(tile.id, rect);
      },
    );
  }

  const rows = boardRows(draft ? [...tiles, draft] : tiles);

  return (
    <main className={styles.main}>
      {tiles.length === 0 && <p className={styles.hint}>Tap anywhere on the mat to add a tile.</p>}
      <div
        ref={ref}
        className={styles.board}
        data-dragging={draft ? '' : undefined}
        style={{ '--cols': COLS, gridTemplateRows: `repeat(${rows}, var(--cell))` } as CSSProperties}
        onClick={(event) => {
          const cell = event.target === event.currentTarget && freeCellAt(event);
          if (cell) onAdd(cell);
        }}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHover(null)}
      >
        {hover && (
          <div className={styles.ghost} style={gridArea({ ...hover, w: 1, h: 1 })}>
            <PlusIcon size={16} />
          </div>
        )}
        {tiles.map((tile) => (
          <TileCard
            key={tile.id}
            tile={tile}
            rect={draft?.id === tile.id ? draft : tile}
            active={draft?.id === tile.id}
            onRemove={() => onRemove(tile.id)}
            onMoveStart={(event) => startGesture(tile, 'move', event)}
            onResizeStart={(event) => startGesture(tile, 'resize', event)}
          />
        ))}
      </div>
    </main>
  );
}
