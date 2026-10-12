import { AlertIcon, XIcon } from '@primer/octicons-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { tileDefs, tileTypes } from '../tiles/registry';
import type { Field, NewTile, TileDef, TileType } from '../types';
import styles from './AddTileDialog.module.css';

type Props = { onAdd(tile: NewTile): void; onClose(): void };

export function AddTileDialog({ onAdd, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const pressedBackdrop = useRef(false);
  const [type, setType] = useState<TileType | null>(null);
  const [error, setError] = useState('');
  const def: TileDef<TileType> | null = type && tileDefs[type];

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const close = () => ref.current?.close();

  function back() {
    setType(null);
    setError('');
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!def) return;
    const values = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    const result = def.parse(values);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    onAdd(result);
    close();
  }

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby="add-tile-title"
      onClose={onClose}
      onPointerDown={(event) => (pressedBackdrop.current = event.target === event.currentTarget)}
      onClick={(event) => pressedBackdrop.current && event.target === event.currentTarget && close()}
    >
      <div className={styles.content}>
        <header className={styles.header}>
          <h2 id="add-tile-title" className={styles.title}>
            {def ? `Add ${def.label}` : 'Add a tile'}
          </h2>
          <button type="button" className="btn btn-icon" onClick={close} aria-label="Close">
            <XIcon size={16} />
          </button>
        </header>

        {def ? (
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {def.fields.map((field, index) => (
              <FieldInput key={field.name} field={field} autoFocus={index === 0} />
            ))}
            {error && (
              <p className={styles.error} role="alert">
                <AlertIcon size={16} />
                {error}
              </p>
            )}
            <footer className={styles.footer}>
              <button type="button" className="btn" onClick={back}>
                Back
              </button>
              <button type="submit" className="btn btn-primary">
                Add tile
              </button>
            </footer>
          </form>
        ) : (
          <div className={styles.types}>
            {tileTypes.map((t) => {
              const { label, icon: Icon } = tileDefs[t];
              return (
                <button key={t} type="button" className={styles.type} onClick={() => setType(t)}>
                  <Icon size={24} />
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </dialog>
  );
}

function FieldInput({ field, autoFocus }: { field: Field; autoFocus: boolean }) {
  const common = { name: field.name, placeholder: field.placeholder, autoFocus, className: 'input' };
  const isUrl = field.kind === 'url';

  return (
    <label className={styles.field}>
      <span className={styles.label}>{field.label}</span>
      {field.kind === 'textarea' ? (
        <textarea {...common} />
      ) : (
        <input
          {...common}
          type="text"
          inputMode={isUrl ? 'url' : undefined}
          autoCapitalize={isUrl ? 'none' : undefined}
          autoComplete="off"
          spellCheck={!isUrl}
        />
      )}
    </label>
  );
}
