import { GlobeIcon } from '@primer/octicons-react';
import { useState } from 'react';
import { toHttpUrl } from '../lib/url';
import type { TileDef } from '../types';
import styles from './tiles.module.css';

// Most sites refuse to load inside an iframe, so tiles show a screenshot from thum.io instead.
const preview = (url: string) => `https://image.thum.io/get/width/800/crop/600/${url}`;

export const website: TileDef<'website'> = {
  label: 'Website',
  icon: GlobeIcon,
  size: { w: 8, h: 6 },
  fields: [{ name: 'url', label: 'Website URL', kind: 'url', placeholder: 'example.com' }],
  defaults: (tile) => ({ url: tile.url }),
  parse(form) {
    const url = toHttpUrl(String(form.get('url') ?? ''));
    return url ? { type: 'website', url } : { error: 'Enter a valid website URL.' };
  },
  href: (tile) => tile.url,
  View: function WebsiteView({ tile }) {
    const [failed, setFailed] = useState(false);
    const host = new URL(tile.url).hostname;

    return (
      <div className={styles.site}>
        {failed ? (
          <div className={styles.fallback}>
            <GlobeIcon size={24} />
          </div>
        ) : (
          <img
            className={`${styles.cover} ${styles.top}`}
            src={preview(tile.url)}
            alt={`Preview of ${host}`}
            loading="lazy"
            draggable={false}
            onError={() => setFailed(true)}
          />
        )}
        <span className={styles.chip}>
          <GlobeIcon size={12} />
          <span className={styles.chipText}>{host}</span>
        </span>
      </div>
    );
  },
};
