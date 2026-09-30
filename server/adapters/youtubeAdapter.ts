import { config } from '../config';
import { globalCache } from '../cache/cacheService';
import { MovieSource, VideoItem } from '../types/movie';

export class YouTubeAdapter {
  private apiKey: string;
  private enabled: boolean;

  constructor() {
    this.apiKey = config.youtubeApiKey;
    this.enabled = config.enableYouTube;
  }

  /**
   * Search YouTube for legally embeddable official trailers
   */
  async searchTrailer(title: string, year?: number | null, movieId: number | string = 0): Promise<MovieSource | null> {
    if (!this.enabled || !this.apiKey) return null;

    const query = `${title} ${year || ''} official trailer`.trim();
    const cacheKey = `yt:search:${query.toLowerCase()}`;

    return globalCache.getOrSet(cacheKey, 86400, async () => {
      try {
        const url = new URL('https://www.googleapis.com/youtube/v3/search');
        url.searchParams.set('part', 'snippet');
        url.searchParams.set('q', query);
        url.searchParams.set('type', 'video');
        url.searchParams.set('videoEmbeddable', 'true'); // ONLY legally embeddable videos
        url.searchParams.set('videoSyndicated', 'true');
        url.searchParams.set('maxResults', '1');
        url.searchParams.set('key', this.apiKey);

        const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) });
        if (!res.ok) {
          console.warn(`[YouTube] API search status: ${res.status}`);
          return null;
        }

        const data = await res.json();
        const item = data?.items?.[0];
        if (!item || !item.id?.videoId) return null;

        const videoId = item.id.videoId;
        return {
          id: `yt_${videoId}`,
          movieId,
          provider: 'youtube',
          sourceId: videoId,
          title: item.snippet?.title || `${title} Official Trailer`,
          playbackType: 'youtube_embed',
          category: 'trailer',
          url: `https://www.youtube.com/watch?v=${videoId}`,
          embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&enablejsapi=1`,
          thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url,
          attribution: 'YouTube (Official Embed)',
          approved: true,
          verifiedAt: new Date().toISOString(),
        };
      } catch (err: any) {
        console.warn(`[YouTube] Search error for "${title}":`, err.message);
        return null;
      }
    });
  }

  /**
   * Converts TMDB video items (official trailers with YouTube video keys) into normalized sources
   */
  fromTmdbVideos(videos: VideoItem[], movieTitle: string, movieId: number | string): MovieSource[] {
    const youtubeVideos = (videos || []).filter(
      (v) => v.site?.toLowerCase() === 'youtube' && !!v.key
    );

    // Prioritize: Official Trailer > Trailer > Teaser > Clip
    const sorted = [...youtubeVideos].sort((a, b) => {
      if (a.official && !b.official) return -1;
      if (!a.official && b.official) return 1;
      if (a.type === 'Trailer' && b.type !== 'Trailer') return -1;
      if (a.type !== 'Trailer' && b.type === 'Trailer') return 1;
      return 0;
    });

    return sorted.map((v) => {
      const isTrailer = v.type === 'Trailer' || v.type === 'Teaser';
      return {
        id: `yt_${v.key}`,
        movieId,
        provider: 'youtube',
        sourceId: v.key,
        title: v.name || `${movieTitle} ${v.type || 'Trailer'}`,
        playbackType: 'youtube_embed',
        category: isTrailer ? 'trailer' : 'clip',
        url: `https://www.youtube.com/watch?v=${v.key}`,
        embedUrl: `https://www.youtube-nocookie.com/embed/${v.key}?autoplay=1&enablejsapi=1`,
        thumbnail: `https://img.youtube.com/vi/${v.key}/hqdefault.jpg`,
        license: 'Official YouTube Embed Terms',
        attribution: 'YouTube (Official Video)',
        approved: true,
        verifiedAt: new Date().toISOString(),
      };
    });
  }
}

export const youtubeAdapter = new YouTubeAdapter();
