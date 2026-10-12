import { AlertIcon, ImageIcon, XIcon } from '@primer/octicons-react';
import { useEffect, useState, type FormEvent } from 'react';
import { tileDefs, tileTypes } from '../tiles/registry';
import type { Field, NewTile, Tile, TileDef, TileType } from '../types';
import { Modal } from './Modal';
import styles from './TileDialog.module.css';

type Props = {
  /** The tile to edit. Without it, the dialog adds a new tile. */
  tile?: Tile;
  onSubmit(content: NewTile): void;
  onClose(): void;
};

export function TileDialog({ tile, onSubmit, onClose }: Props) {
  const [type, setType] = useState<TileType | null>(tile?.type ?? null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const def: TileDef<TileType> | null = type && tileDefs[type];
  const defaults = tile && def ? def.defaults(tile) : {};

  function back() {
    setType(null);
    setError('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!def || pending) return;
    setPending(true);
    const result = await def.parse(new FormData(event.currentTarget), tile);
    setPending(false);
    if ('error' in result) setError(result.error);
    else onSubmit(result);
  }

  return (
    <Modal labelledBy="tile-dialog-title" onClose={onClose}>
      <div className={styles.content}>
        <header className={styles.header}>
          <h2 id="tile-dialog-title" className={styles.title}>
            {!def ? 'Add a tile' : tile ? `Edit ${def.label}` : `Add ${def.label}`}
          </h2>
          <button type="button" className="btn btn-icon" onClick={onClose} aria-label="Close">
            <XIcon size={16} />
          </button>
        </header>

        {def ? (
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {def.fields.map((field, index) => (
              <FieldInput
                key={field.name}
                field={field}
                defaultValue={defaults[field.name]}
                autoFocus={index === 0}
              />
            ))}
            {error && (
              <p className={styles.error} role="alert">
                <AlertIcon size={16} />
                {error}
              </p>
            )}
            <footer className={styles.footer}>
              <button type="button" className="btn" onClick={tile ? onClose : back}>
                {tile ? 'Cancel' : 'Back'}
              </button>
              <button type="submit" className="btn btn-primary" disabled={pending}>
                {pending ? 'Saving…' : tile ? 'Save' : 'Add tile'}
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
    </Modal>
  );
}

type FieldProps = { field: Field; defaultValue?: string; autoFocus: boolean };

function FieldInput({ field, defaultValue, autoFocus }: FieldProps) {
  if (field.kind === 'image') return <ImageField field={field} defaultValue={defaultValue} />;

  const common = { name: field.name, placeholder: field.placeholder, defaultValue, autoFocus, className: 'input' };
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

function ImageField({ field, defaultValue }: Omit<FieldProps, 'autoFocus'>) {
  const [preview, setPreview] = useState(defaultValue);

  useEffect(
    () => () => {
      if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  return (
    <div className={styles.field}>
      <span className={styles.label}>{field.label}</span>
      <label className={styles.picker}>
        {preview ? (
          <img className={styles.preview} src={preview} alt="" />
        ) : (
          <>
            <ImageIcon size={24} />
            Choose a photo
          </>
        )}
        <input
          className="sr-only"
          type="file"
          name={field.name}
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) setPreview(URL.createObjectURL(file));
          }}
        />
      </label>
    </div>
  );
}
