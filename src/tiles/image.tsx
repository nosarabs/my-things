import { ImageIcon } from '@primer/octicons-react';
import { useState } from 'react';
import { compressImage, toOpenableUrl } from '../lib/image';
import type { TileDef } from '../types';
import styles from './tiles.module.css';

export const image: TileDef<'image'> = {
  label: 'Image',
  icon: ImageIcon,
  size: { w: 6, h: 6 },
  fields: [
    { name: 'file', label: 'Photo', kind: 'image' },
    { name: 'alt', label: 'Description (optional)', kind: 'text', placeholder: 'What is in the photo?' },
  ],
  defaults: (tile) => ({ file: tile.src, alt: tile.alt }),
  async parse(form, current) {
    const file = form.get('file');
    const alt = String(form.get('alt') ?? '').trim();
    if (file instanceof File && file.size > 0) {
      try {
        return { type: 'image', src: await compressImage(file), alt };
      } catch {
        return { error: "Couldn't read that photo. Try a different one." };
      }
    }
    return current ? { type: 'image', src: current.src, alt } : { error: 'Choose a photo first.' };
  },
  href: (tile) => toOpenableUrl(tile.src),
  View: function ImageView({ tile }) {
    const [failed, setFailed] = useState(false);

    if (failed) {
      return (
        <div className={styles.fallback}>
          <ImageIcon size={24} />
          Couldn't load this image.
        </div>
      );
    }
    return (
      <img
        className={styles.cover}
        src={tile.src}
        alt={tile.alt}
        draggable={false}
        onError={() => setFailed(true)}
      />
    );
  },
};
