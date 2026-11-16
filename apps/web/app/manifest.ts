import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ISHTI — Spiritual OS',
    short_name: 'ISHTI',
    description: 'A modern spiritual ecosystem rooted in Indian wisdom and canonical Vedic traditions.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8F4ED',
    theme_color: '#711B16',
    icons: [
      {
        src: '/brand/ishti-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
