import { ImageIcon } from '@primer/octicons-react';
import { useState } from 'react';
import { compressImage } from '../lib/image';
import { savePhoto, toOpenableUrl, usePhotoUrl } from '../lib/photos';
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
    if (!(file instanceof File && file.size > 0)) {
      return current ? { type: 'image', src: current.src, alt } : { error: 'Choose a photo first.' };
    }

    let photo: Blob;
    try {
      photo = await compressImage(file);
    } catch {
      return { error: "Couldn't read that photo. Try a different one." };
    }
    try {
      return { type: 'image', src: await savePhoto(photo), alt };
    } catch {
      return { error: "Couldn't upload that photo. Check your connection and try again." };
    }
  },
  href: (tile) => toOpenableUrl(tile.src),
  View: function ImageView({ tile }) {
    const src = usePhotoUrl(tile.src);
    const [failedSrc, setFailedSrc] = useState<string>();

    if (src === undefined) return null;
    if (!src || failedSrc === src) {
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
        src={src}
        alt={tile.alt}
        draggable={false}
        onError={() => setFailedSrc(src)}
      />
    );
  },
};
