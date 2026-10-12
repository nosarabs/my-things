import { AppsIcon, DownloadIcon, UploadIcon } from '@primer/octicons-react';
import { useRef, type ChangeEvent } from 'react';
import { exportTiles, importTiles } from '../storage';
import type { Tile } from '../types';
import styles from './Header.module.css';

type Props = { tiles: Tile[]; onImport(tiles: Tile[]): void };

export function Header({ tiles, onImport }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const imported = await importTiles(file);
      const message = `Replace your ${tiles.length} tiles with ${imported.length} imported tiles?`;
      if (tiles.length === 0 || confirm(message)) onImport(imported);
    } catch {
      alert("That file isn't a valid tiles export.");
    }
  }

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>
        <AppsIcon size={24} />
        My Things
      </h1>
      <button type="button" className="btn" onClick={() => exportTiles(tiles)} disabled={!tiles.length}>
        <DownloadIcon size={16} />
        Export
      </button>
      <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
        <UploadIcon size={16} />
        Import
      </button>
      <input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={handleFile} />
    </header>
  );
}
