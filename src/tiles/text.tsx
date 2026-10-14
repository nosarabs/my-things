import { NoteIcon } from '@primer/octicons-react';
import { MAX_TEXT } from '../storage';
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
    if (!text) return { error: 'Write some text first.' };
    if (text.length > MAX_TEXT) return { error: `Keep it under ${MAX_TEXT.toLocaleString()} characters.` };
    return { type: 'text', text };
  },
  View: ({ tile }) => <p className={styles.text}>{tile.text}</p>,
};
