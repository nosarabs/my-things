import { useState } from 'react';
import { AddTileDialog } from './components/AddTileDialog';
import { Grid } from './components/Grid';
import { Header } from './components/Header';
import { useTiles } from './useTiles';

export default function App() {
  const { tiles, add, remove, replaceAll } = useTiles();
  const [addingAt, setAddingAt] = useState<number | null>(null);

  return (
    <>
      <Header tiles={tiles} onImport={replaceAll} />
      <Grid tiles={tiles} onAdd={setAddingAt} onRemove={remove} />
      {addingAt !== null && (
        <AddTileDialog onAdd={(tile) => add(tile, addingAt)} onClose={() => setAddingAt(null)} />
      )}
    </>
  );
}
