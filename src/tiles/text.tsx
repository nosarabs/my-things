import { NoteIcon } from '@primer/octicons-react';
import type { TileDef } from '../types';
import styles from './tiles.module.css';

export const text: TileDef<'text'> = {
  label: 'Text',
  icon: NoteIcon,
  fields: [{ name: 'text', label: 'Text', kind: 'textarea', placeholder: 'Write something…' }],
  parse(values) {
    const text = values.text.trim();
    return text ? { type: 'text', text } : { error: 'Write some text first.' };
  },
  title: () => 'Note',
  View: ({ tile }) => <p className={styles.text}>{tile.text}</p>,
};
