import { VideoIcon } from '@primer/octicons-react';
import { parseYouTubeId } from '../lib/url';
import type { TileDef } from '../types';
import styles from './tiles.module.css';

export const youtube: TileDef<'youtube'> = {
  label: 'YouTube',
  icon: VideoIcon,
  fields: [
    { name: 'url', label: 'YouTube link', kind: 'url', placeholder: 'https://youtube.com/watch?v=…' },
  ],
  parse({ url }) {
    const videoId = parseYouTubeId(url);
    return videoId ? { type: 'youtube', videoId } : { error: 'Enter a valid YouTube link or video ID.' };
  },
  title: () => 'YouTube',
  href: (tile) => `https://www.youtube.com/watch?v=${tile.videoId}`,
  View: ({ tile }) => (
    <iframe
      className={styles.frame}
      src={`https://www.youtube-nocookie.com/embed/${tile.videoId}`}
      title="YouTube video"
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />
  ),
};
