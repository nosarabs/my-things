import { VideoIcon } from '@primer/octicons-react';
import { parseYouTubeId } from '../lib/url';
import type { TileDef } from '../types';
import styles from './tiles.module.css';

export const youtube: TileDef<'youtube'> = {
  label: 'YouTube',
  icon: VideoIcon,
  size: { w: 8, h: 5 },
  interactive: true,
  fields: [
    { name: 'url', label: 'YouTube link', kind: 'url', placeholder: 'https://youtube.com/watch?v=…' },
  ],
  defaults: (tile) => ({ url: `https://youtu.be/${tile.videoId}` }),
  parse(form) {
    const videoId = parseYouTubeId(String(form.get('url') ?? ''));
    return videoId ? { type: 'youtube', videoId } : { error: 'Enter a valid YouTube link or video ID.' };
  },
  href: (tile) => `https://www.youtube.com/watch?v=${tile.videoId}`,
  View: ({ tile, active }) =>
    active ? (
      <iframe
        className={styles.frame}
        src={`https://www.youtube-nocookie.com/embed/${tile.videoId}?autoplay=1`}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    ) : (
      <div className={styles.poster}>
        <img
          className={styles.cover}
          src={`https://i.ytimg.com/vi/${tile.videoId}/hqdefault.jpg`}
          alt="YouTube video thumbnail"
          loading="lazy"
          draggable={false}
        />
        <span className={styles.play} />
      </div>
    ),
};
