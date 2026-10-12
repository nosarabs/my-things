import { NoteIcon } from '@primer/octicons-react';
import type { TileDef } from '../types';
import styles from './tiles.module.css';

export const text: TileDef<'text'> = {
  label: 'Text',
  icon: NoteIcon,
  size: { w: 6, h: 4 },
  fields: [{ name: 'text', label: 'Text', kind: 'textarea', placeholder: 'Write something…' }],
  defaults: (tile) => ({ text: tile.text }),
  parse(form) {
    const text = String(form.get('text') ?? '').trim();
    return text ? { type: 'text', text } : { error: 'Write some text first.' };
  },
  View: ({ tile }) => <p className={styles.text}>{tile.text}</p>,
};
