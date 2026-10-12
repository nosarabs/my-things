import { useState } from 'react';
import { AddTileDialog } from './components/AddTileDialog';
import { Board } from './components/Board';
import { Header } from './components/Header';
import { firstFit, fitRect } from './lib/layout';
import { tileDefs } from './tiles/registry';
import type { Cell, NewTile } from './types';
import { useTiles } from './useTiles';

export default function App() {
  const { tiles, add, update, remove, replaceAll } = useTiles();
  const [adding, setAdding] = useState<{ cell?: Cell } | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);

  function handleAdd(tile: NewTile) {
    const { size } = tileDefs[tile.type];
    const rect = adding?.cell ? fitRect(adding.cell, size, tiles) : firstFit(size, tiles);
    if (rect) setFocusId(add(tile, rect));
  }

  return (
    <>
      <Header tiles={tiles} onNew={() => setAdding({})} onImport={replaceAll} />
      <Board
        tiles={tiles}
        focusId={focusId}
        onAdd={(cell) => setAdding({ cell })}
        onUpdate={update}
        onRemove={remove}
      />
      {adding && <AddTileDialog onAdd={handleAdd} onClose={() => setAdding(null)} />}
    </>
  );
}
