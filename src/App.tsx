import { useState } from 'react';
import { Board } from './components/Board';
import { Header } from './components/Header';
import { TileDialog } from './components/TileDialog';
import { firstFit, fitRect } from './lib/layout';
import { tileDefs } from './tiles/registry';
import type { Cell, NewTile, Tile } from './types';
import { useSession } from './useSession';
import { useTiles, type TilesStatus } from './useTiles';

type DialogState = { cell?: Cell; tile?: Tile };

const HINTS: Record<TilesStatus, string> = {
  loading: 'Loading your tiles…',
  error: "Couldn't load your tiles. Check your connection and reload.",
  ready: 'Tap anywhere on the mat to add a tile.',
};

export default function App() {
  const user = useSession();
  const { tiles, status, add, move, edit, remove, replaceAll } = useTiles(user === undefined ? undefined : (user?.id ?? null));
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const ready = status === 'ready';

  async function handleSubmit(content: NewTile) {
    if (dialog?.tile) {
      if (await edit(dialog.tile.id, content)) setDialog(null);
      return;
    }
    const { size } = tileDefs[content.type];
    const rect = (dialog?.cell && fitRect(dialog.cell, size, tiles)) || firstFit(size, tiles);
    const id = await add(content, rect);
    if (id) {
      setFocusId(id);
      setDialog(null);
    }
  }

  return (
    <>
      <Header tiles={tiles} user={user} ready={ready} onNew={() => setDialog({})} onImport={replaceAll} />
      <Board
        tiles={tiles}
        focusId={focusId}
        hint={tiles.length ? undefined : HINTS[status]}
        onAdd={ready ? (cell) => setDialog({ cell }) : undefined}
        onMove={move}
        onEdit={(tile) => setDialog({ tile })}
        onRemove={remove}
      />
      {dialog && <TileDialog tile={dialog.tile} onSubmit={handleSubmit} onClose={() => setDialog(null)} />}
    </>
  );
}
