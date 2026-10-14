import { AppsIcon, DownloadIcon, MarkGithubIcon, PlusIcon, UploadIcon } from '@primer/octicons-react';
import type { User } from '@supabase/supabase-js';
import { useRef, type ChangeEvent } from 'react';
import { embedPhotos } from '../lib/photos';
import { signIn, supabase } from '../lib/supabase';
import { exportTiles, importTiles } from '../storage';
import type { Tile } from '../types';
import { AccountMenu } from './AccountMenu';
import styles from './Header.module.css';

type Props = {
  tiles: Tile[];
  /** Undefined while the session loads. */
  user: User | null | undefined;
  ready: boolean;
  onNew(): void;
  onImport(tiles: Tile[]): void;
};

export function Header({ tiles, user, ready, onNew, onImport }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleExport() {
    try {
      exportTiles(await embedPhotos(tiles));
    } catch {
      alert("Couldn't download your photos for the export. Check your connection and try again.");
    }
  }

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
        onClick={handleExport}
        disabled={!ready || !tiles.length}
      >
        <DownloadIcon size={16} />
        <span className={styles.label}>Export</span>
      </button>
      <button
        type="button"
        className={`btn ${styles.compact}`}
        onClick={() => fileInput.current?.click()}
        disabled={!ready}
      >
        <UploadIcon size={16} />
        <span className={styles.label}>Import</span>
      </button>
      <button type="button" className="btn btn-primary" onClick={onNew} disabled={!ready}>
        <PlusIcon size={16} />
        New
      </button>
      {supabase && user === null && (
        <button type="button" className={`btn ${styles.compact}`} onClick={signIn}>
          <MarkGithubIcon size={16} />
          <span className={styles.label}>Sign in</span>
        </button>
      )}
      {user && <AccountMenu user={user} />}
      <input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={handleFile} />
    </header>
  );
}
