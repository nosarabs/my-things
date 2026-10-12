import { GlobeIcon } from '@primer/octicons-react';
import { toHttpUrl } from '../lib/url';
import type { TileDef } from '../types';
import styles from './tiles.module.css';

export const website: TileDef<'website'> = {
  label: 'Website',
  icon: GlobeIcon,
  fields: [{ name: 'url', label: 'Website URL', kind: 'url', placeholder: 'example.com' }],
  parse(values) {
    const url = toHttpUrl(values.url);
    return url ? { type: 'website', url } : { error: 'Enter a valid website URL.' };
  },
  title: (tile) => new URL(tile.url).hostname,
  href: (tile) => tile.url,
  View: ({ tile }) => (
    <iframe
      className={styles.frame}
      src={tile.url}
      title={new URL(tile.url).hostname}
      loading="lazy"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      referrerPolicy="no-referrer"
    />
  ),
};
