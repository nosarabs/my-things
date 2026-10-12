import { AppsIcon, DownloadIcon, PlusIcon, UploadIcon } from '@primer/octicons-react';
import { useRef, type ChangeEvent } from 'react';
import { exportTiles, importTiles } from '../storage';
import type { Tile } from '../types';
import styles from './Header.module.css';

type Props = { tiles: Tile[]; onNew(): void; onImport(tiles: Tile[]): void };

export function Header({ tiles, onNew, onImport }: Props) {
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
      <button
        type="button"
        className={`btn ${styles.compact}`}
        onClick={() => exportTiles(tiles)}
        disabled={!tiles.length}
      >
        <DownloadIcon size={16} />
        <span className={styles.label}>Export</span>
      </button>
      <button type="button" className={`btn ${styles.compact}`} onClick={() => fileInput.current?.click()}>
        <UploadIcon size={16} />
        <span className={styles.label}>Import</span>
      </button>
      <button type="button" className="btn btn-primary" onClick={onNew}>
        <PlusIcon size={16} />
        New
      </button>
      <input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={handleFile} />
    </header>
  );
}
