import { useState } from 'react';
import { Board } from './components/Board';
import { Header } from './components/Header';
import { TileDialog } from './components/TileDialog';
import { firstFit, fitRect } from './lib/layout';
import { tileDefs } from './tiles/registry';
import type { Cell, NewTile, Tile } from './types';
import { useTiles } from './useTiles';

type DialogState = { cell?: Cell; tile?: Tile };

export default function App() {
  const { tiles, add, move, edit, remove, replaceAll } = useTiles();
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);

  function handleSubmit(content: NewTile) {
    if (dialog?.tile) {
      if (edit(dialog.tile.id, content)) setDialog(null);
      return;
    }
    const { size } = tileDefs[content.type];
    const rect = (dialog?.cell && fitRect(dialog.cell, size, tiles)) || firstFit(size, tiles);
    const id = add(content, rect);
    if (id) {
      setFocusId(id);
      setDialog(null);
    }
  }

  return (
    <>
      <Header tiles={tiles} onNew={() => setDialog({})} onImport={replaceAll} />
      <Board
        tiles={tiles}
        focusId={focusId}
        onAdd={(cell) => setDialog({ cell })}
        onMove={move}
        onEdit={(tile) => setDialog({ tile })}
        onRemove={remove}
      />
      {dialog && <TileDialog tile={dialog.tile} onSubmit={handleSubmit} onClose={() => setDialog(null)} />}
    </>
  );
}
