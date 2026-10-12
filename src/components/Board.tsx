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
import { blockTouchScroll, trackDrag, trackPress } from '../lib/press';
import { tileDefs } from '../tiles/registry';
import type { Cell, Rect, Tile } from '../types';
import styles from './Board.module.css';
import { TileCard } from './TileCard';
import { TileMenu } from './TileMenu';

type Props = {
  tiles: Tile[];
  focusId: string | null;
  onAdd(cell: Cell): void;
  onMove(id: string, rect: Rect): void;
  onEdit(tile: Tile): void;
  onRemove(id: string): void;
};

type Point = { clientX: number; clientY: number };

export function Board({ tiles, focusId, onAdd, onMove, onEdit, onRemove }: Props) {
  const boardRef = useRef<HTMLDivElement>(null);
  const swallowClick = useRef(false);
  const [draft, setDraft] = useState<(Rect & { id: string }) | null>(null);
  const [hover, setHover] = useState<Cell | null>(null);
  const [liftedId, setLiftedId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ tile: Tile; x: number; y: number } | null>(null);

  useEffect(blockTouchScroll, []);

  useEffect(() => {
    if (focusId) document.getElementById(focusId)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focusId]);

  const cellSize = () => boardRef.current!.getBoundingClientRect().width / COLS;

  /** The board cell under a point, clamped so taps on the decorative edges still count. */
  function cellAt({ clientX, clientY }: Point): Cell {
    const box = boardRef.current!.getBoundingClientRect();
    const size = box.width / COLS;
    return {
      x: Math.min(COLS - 1, Math.max(0, Math.floor((clientX - box.left) / size))),
      y: Math.max(0, Math.floor((clientY - box.top) / size)),
    };
  }

  const isMat = ({ target, currentTarget }: { target: EventTarget; currentTarget: EventTarget }) =>
    target === currentTarget || target === boardRef.current;

  /** Applies whole-cell drag steps to a tile and saves the result on drop. */
  function dragTile(tile: Tile, apply: (rect: Rect, dx: number, dy: number) => Rect) {
    const others = tiles.filter((t) => t.id !== tile.id);
    const size = cellSize();
    let rect: Rect = tile;
    let last = { dx: 0, dy: 0 };

    return {
      step(px: number, py: number) {
        const dx = Math.round(px / size);
        const dy = Math.round(py / size);
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
      drop() {
        setDraft(null);
        if (!sameRect(rect, tile)) onMove(tile.id, rect);
      },
    };
  }

  function pressTile(tile: Tile, event: ReactPointerEvent<HTMLElement>) {
    if (event.button !== 0) return;
    // Stops native image dragging and text selection; touch scrolling is unaffected.
    if (event.pointerType === 'mouse') event.preventDefault();
    setHover(null);
    const drag = dragTile(tile, moveBy);

    trackPress(event.currentTarget, event.nativeEvent, {
      onTap: () => tileDefs[tile.type].interactive && setActiveId(tile.id),
      onHold: () => {
        setLiftedId(tile.id);
        navigator.vibrate?.(10);
      },
      onMenu: (at) => setMenu({ tile, ...at }),
      onDrag: drag.step,
      onDrop: drag.drop,
      onEnd: () => setLiftedId(null),
    });
  }

  function resizeTile(tile: Tile, event: ReactPointerEvent<HTMLElement>) {
    if (event.button !== 0) return;
    event.preventDefault();
    const drag = dragTile(tile, resizeBy);
    trackDrag(event.currentTarget, event.nativeEvent, drag.step, drag.drop);
  }

  const rows = boardRows(draft ? [...tiles, draft] : tiles);

  return (
    <>
      <main
        className={styles.main}
        style={{ '--cols': COLS } as CSSProperties}
        onPointerDownCapture={(event) => {
          swallowClick.current = false;
          // A playing video stops when you tap anywhere else, without that tap doing anything more.
          if (activeId && (event.target as Element).closest('article')?.id !== activeId) {
            setActiveId(null);
            swallowClick.current = true;
          }
        }}
        onClick={(event) => {
          if (swallowClick.current || !isMat(event)) return;
          const cell = cellAt(event);
          if (canPlace(cell, tiles)) onAdd(cell);
        }}
        onPointerMove={(event) => {
          if (event.pointerType !== 'mouse') return;
          const cell = isMat(event) && !draft ? cellAt(event) : null;
          const next = cell && canPlace(cell, tiles) ? cell : null;
          if (next?.x !== hover?.x || next?.y !== hover?.y) setHover(next);
        }}
        onPointerLeave={() => setHover(null)}
      >
        <div ref={boardRef} className={styles.board} style={{ gridTemplateRows: `repeat(${rows}, var(--cell))` }}>
          {tiles.length === 0 && <p className={styles.hint}>Tap anywhere on the mat to add a tile.</p>}
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
              active={activeId === tile.id}
              lifted={liftedId === tile.id}
              dragging={draft?.id === tile.id}
              onPress={(event) => pressTile(tile, event)}
              onResize={(event) => resizeTile(tile, event)}
              onMenu={(at) => setMenu({ tile, ...at })}
            />
          ))}
        </div>
      </main>
      {menu && (
        <TileMenu
          tile={menu.tile}
          anchor={menu}
          onEdit={() => {
            setMenu(null);
            onEdit(menu.tile);
          }}
          onRemove={() => {
            setMenu(null);
            onRemove(menu.tile.id);
          }}
          onClose={() => setMenu(null)}
        />
      )}
    </>
  );
}
