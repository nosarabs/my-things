import { ImageIcon } from '@primer/octicons-react';
import { useState } from 'react';
import { toHttpUrl } from '../lib/url';
import type { TileDef } from '../types';
import styles from './tiles.module.css';

export const image: TileDef<'image'> = {
  label: 'Image',
  icon: ImageIcon,
  fields: [
    { name: 'src', label: 'Image URL', kind: 'url', placeholder: 'https://example.com/photo.jpg' },
    { name: 'alt', label: 'Description (optional)', kind: 'text', placeholder: 'What is in the image?' },
  ],
  parse(values) {
    const src = toHttpUrl(values.src);
    return src ? { type: 'image', src, alt: values.alt.trim() } : { error: 'Enter a valid image URL.' };
  },
  title: (tile) => tile.alt || new URL(tile.src).hostname,
  href: (tile) => tile.src,
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
        className={styles.image}
        src={tile.src}
        alt={tile.alt}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  },
};
