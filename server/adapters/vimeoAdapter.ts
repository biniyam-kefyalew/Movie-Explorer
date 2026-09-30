import { config } from '../config';
import { MovieSource } from '../types/movie';

export class VimeoAdapter {
  private enabled: boolean;
  private accessToken: string;

  constructor() {
    this.enabled = config.enableVimeo;
    this.accessToken = config.vimeoAccessToken;
  }

  isEnabled(): boolean {
    return this.enabled && !!this.accessToken;
  }

  async searchVideo(title: string, year?: number | null, movieId: number | string = 0): Promise<MovieSource | null> {
    if (!this.isEnabled()) return null;

    try {
      const query = `${title} ${year || ''}`.trim();
      const url = new URL('https://api.vimeo.com/videos');
      url.searchParams.set('query', query);
      url.searchParams.set('per_page', '1');
      url.searchParams.set('filter', 'playable'); // only playable

      const res = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/vnd.vimeo.*+json;version=3.4',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) return null;
      const data = await res.json();
      const item = data?.data?.[0];
      if (!item || !item.uri) return null;

      const vimeoId = item.uri.replace('/videos/', '');
      return {
        id: `vimeo_${vimeoId}`,
        movieId,
        provider: 'vimeo',
        sourceId: vimeoId,
        title: item.name || `${title} (Vimeo)`,
        playbackType: 'vimeo_embed',
        category: 'full_movie',
        url: item.link || `https://vimeo.com/${vimeoId}`,
        embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
        thumbnail: item.pictures?.sizes?.[0]?.link,
        duration: item.duration,
        license: item.license || 'Vimeo Authorized Content',
        attribution: 'Vimeo',
        approved: true,
        verifiedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      console.warn(`[Vimeo] Search error:`, err.message);
      return null;
    }
  }
}

export const vimeoAdapter = new VimeoAdapter();
