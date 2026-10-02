import { config } from '../config';
import { globalCache } from '../cache/cacheService';
import {
  NormalizedMovie,
  NormalizedMoviePreview,
  PaginatedResult,
  CastMember,
  VideoItem,
  WatchProviderItem,
} from '../types/movie';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export function createSlug(title: string, id: number | string): string {
  const cleanTitle = (title || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleanTitle ? `${cleanTitle}-${id}` : `${id}`;
}

export function extractIdFromSlug(slugOrId: string): number {
  if (!slugOrId) return 0;
  const parts = slugOrId.split('-');
  const lastPart = parts[parts.length - 1];
  const num = parseInt(lastPart, 10);
  return isNaN(num) ? parseInt(slugOrId, 10) || 0 : num;
}

export class TMDBAdapter {
  private apiKey: string;
  private accessToken: string;

  constructor() {
    this.apiKey = config.tmdbApiKey;
    this.accessToken = config.tmdbAccessToken;
  }

  private async fetchWithRetry(url: string, params: Record<string, string> = {}, retries = 3): Promise<any> {
    const urlObj = new URL(url);
    if (this.apiKey) {
      urlObj.searchParams.set('api_key', this.apiKey);
    }
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        urlObj.searchParams.set(key, value);
      }
    }

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    let delay = 500;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(urlObj.toString(), {
          headers,
        });

        if (response.status === 429) {
          // Rate limited, wait and retry
          const retryAfter = parseInt(response.headers.get('Retry-After') || '1', 10);
          await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000 + delay));
          delay *= 2;
          continue;
        }

        if (!response.ok) {
          if (response.status === 404) return null;
          throw new Error(`TMDB HTTP error ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (err: any) {
        if (attempt === retries) {
          console.error(`[TMDBAdapter] Final attempt failed for ${url}:`, err.message);
          throw err;
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
    return null;
  }

  normalizePreview(raw: any, genresMap?: Map<number, string>): NormalizedMoviePreview {
    const title = raw.title || raw.name || 'Untitled';
    const releaseDate = raw.release_date || raw.first_air_date || '';
    const year = releaseDate ? parseInt(releaseDate.substring(0, 4), 10) || null : null;
    const genres = (raw.genre_ids || []).map((gid: number) => ({
      id: gid,
      name: genresMap?.get(gid) || `Genre ${gid}`,
    }));

    return {
      id: raw.id,
      tmdbId: raw.id,
      title,
      slug: createSlug(title, raw.id),
      overview: raw.overview || '',
      posterUrl: raw.poster_path ? `${IMAGE_BASE_URL}/w500${raw.poster_path}` : null,
      backdropUrl: raw.backdrop_path ? `${IMAGE_BASE_URL}/original${raw.backdrop_path}` : null,
      releaseDate,
      year,
      rating: typeof raw.vote_average === 'number' ? Math.round(raw.vote_average * 10) / 10 : 0,
      voteCount: raw.vote_count || 0,
      genres,
      type: raw.media_type === 'tv' ? 'tv' : 'movie',
    };
  }

  async getGenres(): Promise<Array<{ id: number; name: string }>> {
    const cacheKey = 'tmdb:genres';
    return globalCache.getOrSet(cacheKey, 86400, async () => {
      const data = await this.fetchWithRetry(`${TMDB_BASE_URL}/genre/movie/list`, { language: 'en-US' });
      return data?.genres || [];
    });
  }

  private async getGenresMap(): Promise<Map<number, string>> {
    const genres = await this.getGenres();
    return new Map(genres.map((g) => [g.id, g.name]));
  }

  async getLatest(page = 1, filters: { genre?: string; year?: string; minRating?: string; maxRating?: string; sortBy?: string } = {}): Promise<PaginatedResult<NormalizedMoviePreview>> {
    const cacheKey = `tmdb:latest:${page}:${JSON.stringify(filters)}`;
    return globalCache.getOrSet(cacheKey, 600, async () => {
      const today = new Date().toISOString().split('T')[0];
      const params: Record<string, string> = {
        language: 'en-US',
        page: page.toString(),
        include_adult: 'false',
        include_video: 'false',
        sort_by: filters.sortBy || 'primary_release_date.desc',
        'primary_release_date.lte': today,
      };

      if (filters.genre) params['with_genres'] = filters.genre;
      if (filters.year) params['primary_release_year'] = filters.year;
      if (filters.minRating) params['vote_average.gte'] = filters.minRating;
      if (filters.maxRating) params['vote_average.lte'] = filters.maxRating;

      const data = await this.fetchWithRetry(`${TMDB_BASE_URL}/discover/movie`, params);
      const genresMap = await this.getGenresMap();

      return {
        page: data?.page || 1,
        totalPages: Math.min(data?.total_pages || 1, 500),
        totalResults: data?.total_results || 0,
        results: (data?.results || []).map((m: any) => this.normalizePreview(m, genresMap)),
      };
    });
  }

  async getTrending(timeWindow = 'day', page = 1): Promise<PaginatedResult<NormalizedMoviePreview>> {
    const cacheKey = `tmdb:trending:${timeWindow}:${page}`;
    return globalCache.getOrSet(cacheKey, 600, async () => {
      const data = await this.fetchWithRetry(`${TMDB_BASE_URL}/trending/movie/${timeWindow}`, {
        language: 'en-US',
        page: page.toString(),
      });
      const genresMap = await this.getGenresMap();
      return {
        page: data?.page || 1,
        totalPages: Math.min(data?.total_pages || 1, 500),
        totalResults: data?.total_results || 0,
        results: (data?.results || []).map((m: any) => this.normalizePreview(m, genresMap)),
      };
    });
  }

  async getPopular(page = 1): Promise<PaginatedResult<NormalizedMoviePreview>> {
    const cacheKey = `tmdb:popular:${page}`;
    return globalCache.getOrSet(cacheKey, 600, async () => {
      const data = await this.fetchWithRetry(`${TMDB_BASE_URL}/movie/popular`, {
        language: 'en-US',
        page: page.toString(),
      });
      const genresMap = await this.getGenresMap();
      return {
        page: data?.page || 1,
        totalPages: Math.min(data?.total_pages || 1, 500),
        totalResults: data?.total_results || 0,
        results: (data?.results || []).map((m: any) => this.normalizePreview(m, genresMap)),
      };
    });
  }

  async getTopRated(page = 1): Promise<PaginatedResult<NormalizedMoviePreview>> {
    const cacheKey = `tmdb:top_rated:${page}`;
    return globalCache.getOrSet(cacheKey, 600, async () => {
      const data = await this.fetchWithRetry(`${TMDB_BASE_URL}/movie/top_rated`, {
        language: 'en-US',
        page: page.toString(),
      });
      const genresMap = await this.getGenresMap();
      return {
        page: data?.page || 1,
        totalPages: Math.min(data?.total_pages || 1, 500),
        totalResults: data?.total_results || 0,
        results: (data?.results || []).map((m: any) => this.normalizePreview(m, genresMap)),
      };
    });
  }

  async getNowPlaying(page = 1): Promise<PaginatedResult<NormalizedMoviePreview>> {
    const cacheKey = `tmdb:now_playing:${page}`;
    return globalCache.getOrSet(cacheKey, 600, async () => {
      const data = await this.fetchWithRetry(`${TMDB_BASE_URL}/movie/now_playing`, {
        language: 'en-US',
        page: page.toString(),
      });
      const genresMap = await this.getGenresMap();
      return {
        page: data?.page || 1,
        totalPages: Math.min(data?.total_pages || 1, 500),
        totalResults: data?.total_results || 0,
        results: (data?.results || []).map((m: any) => this.normalizePreview(m, genresMap)),
      };
    });
  }

  async getUpcoming(page = 1): Promise<PaginatedResult<NormalizedMoviePreview>> {
    const cacheKey = `tmdb:upcoming:${page}`;
    return globalCache.getOrSet(cacheKey, 600, async () => {
      const data = await this.fetchWithRetry(`${TMDB_BASE_URL}/movie/upcoming`, {
        language: 'en-US',
        page: page.toString(),
      });
      const genresMap = await this.getGenresMap();
      return {
        page: data?.page || 1,
        totalPages: Math.min(data?.total_pages || 1, 500),
        totalResults: data?.total_results || 0,
        results: (data?.results || []).map((m: any) => this.normalizePreview(m, genresMap)),
      };
    });
  }

  async getHeroMovies(): Promise<NormalizedMoviePreview[]> {
    const cacheKey = 'tmdb:hero_movies';
    return globalCache.getOrSet(cacheKey, 1800, async () => {
      const trending = await this.getTrending('day', 1);
      const candidates = (trending.results || [])
        .filter((m) => !!m.backdropUrl)
        .slice(0, 7);

      const enriched = await Promise.all(
        candidates.map(async (movie) => {
          try {
            const vData = await this.fetchWithRetry(`${TMDB_BASE_URL}/movie/${movie.id}/videos`, { language: 'en-US' });
            const videos = vData?.results || [];
            const trailer = videos.find(
              (v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
            ) || videos.find((v: any) => v.site === 'YouTube');

            if (trailer && trailer.key) {
              return {
                ...movie,
                trailerKey: trailer.key,
                trailerEmbedUrl: `https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&mute=1&loop=1&playlist=${trailer.key}&controls=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1`,
              };
            }
          } catch (e) {
            // ignore trailer fetch error for single movie
          }
          return movie;
        })
      );

      return enriched;
    });
  }

  async searchMulti(query: string, page = 1): Promise<PaginatedResult<any>> {
    const cacheKey = `tmdb:search:${query.toLowerCase().trim()}:${page}`;
    return globalCache.getOrSet(cacheKey, 300, async () => {
      const data = await this.fetchWithRetry(`${TMDB_BASE_URL}/search/multi`, {
        query,
        language: 'en-US',
        page: page.toString(),
        include_adult: 'false',
      });
      const genresMap = await this.getGenresMap();

      const items = (data?.results || []).map((item: any) => {
        if (item.media_type === 'person') {
          return {
            id: item.id,
            tmdbId: item.id,
            title: item.name,
            slug: createSlug(item.name, item.id),
            overview: `Known for: ${(item.known_for || []).map((k: any) => k.title || k.name).join(', ')}`,
            posterUrl: item.profile_path ? `${IMAGE_BASE_URL}/w500${item.profile_path}` : null,
            backdropUrl: null,
            releaseDate: '',
            year: null,
            rating: Math.round((item.popularity || 0) * 10) / 10,
            voteCount: 0,
            genres: [],
            type: 'person',
          };
        }
        return this.normalizePreview(item, genresMap);
      });

      return {
        page: data?.page || 1,
        totalPages: Math.min(data?.total_pages || 1, 500),
        totalResults: data?.total_results || 0,
        results: items,
      };
    });
  }

  async getMovieDetails(movieId: number): Promise<NormalizedMovie | null> {
    const cacheKey = `tmdb:movie:${movieId}`;
    return globalCache.getOrSet(cacheKey, 3600, async () => {
      const data = await this.fetchWithRetry(`${TMDB_BASE_URL}/movie/${movieId}`, {
        language: 'en-US',
        append_to_response: 'credits,videos,similar,recommendations,watch/providers',
      });

      if (!data) return null;

      const title = data.title || 'Untitled';
      const releaseDate = data.release_date || '';
      const year = releaseDate ? parseInt(releaseDate.substring(0, 4), 10) || null : null;

      // Extract director
      const crew = data.credits?.crew || [];
      const directorObj = crew.find((c: any) => c.job === 'Director');
      const director = directorObj ? directorObj.name : undefined;

      // Cast
      const cast: CastMember[] = (data.credits?.cast || []).slice(0, 20).map((c: any) => ({
        id: c.id,
        name: c.name,
        character: c.character || '',
        profilePath: c.profile_path ? `${IMAGE_BASE_URL}/w200${c.profile_path}` : null,
        order: c.order,
      }));

      // Videos / Trailers
      const trailers: VideoItem[] = (data.videos?.results || []).map((v: any) => ({
        id: v.id,
        key: v.key,
        name: v.name,
        site: v.site,
        type: v.type,
        official: !!v.official,
        publishedAt: v.published_at,
      }));

      // Similar and recommendations
      const genresMap = await this.getGenresMap();
      const similar = (data.similar?.results || []).slice(0, 10).map((m: any) => this.normalizePreview(m, genresMap));
      const recommended = (data.recommendations?.results || []).slice(0, 10).map((m: any) => this.normalizePreview(m, genresMap));

      // Watch Providers
      const usProviders = data['watch/providers']?.results?.US || data['watch/providers']?.results?.GB || Object.values(data['watch/providers']?.results || {})[0] as any;
      const providers = usProviders ? {
        link: usProviders.link,
        flatrate: (usProviders.flatrate || []).map((p: any) => ({
          id: p.provider_id,
          name: p.provider_name,
          logoUrl: `${IMAGE_BASE_URL}/w92${p.logo_path}`,
        })),
        rent: (usProviders.rent || []).map((p: any) => ({
          id: p.provider_id,
          name: p.provider_name,
          logoUrl: `${IMAGE_BASE_URL}/w92${p.logo_path}`,
        })),
        buy: (usProviders.buy || []).map((p: any) => ({
          id: p.provider_id,
          name: p.provider_name,
          logoUrl: `${IMAGE_BASE_URL}/w92${p.logo_path}`,
        })),
        free: (usProviders.free || []).map((p: any) => ({
          id: p.provider_id,
          name: p.provider_name,
          logoUrl: `${IMAGE_BASE_URL}/w92${p.logo_path}`,
        })),
      } : undefined;

      return {
        id: data.id,
        tmdbId: data.id,
        title,
        originalTitle: data.original_title || title,
        slug: createSlug(title, data.id),
        type: 'movie',
        overview: data.overview || '',
        tagline: data.tagline || '',
        posterUrl: data.poster_path ? `${IMAGE_BASE_URL}/w500${data.poster_path}` : null,
        backdropUrl: data.backdrop_path ? `${IMAGE_BASE_URL}/original${data.backdrop_path}` : null,
        releaseDate,
        year,
        rating: typeof data.vote_average === 'number' ? Math.round(data.vote_average * 10) / 10 : 0,
        voteCount: data.vote_count || 0,
        genres: data.genres || [],
        runtime: data.runtime || null,
        budget: data.budget,
        revenue: data.revenue,
        status: data.status,
        cast,
        director,
        productionCompanies: (data.production_companies || []).map((pc: any) => ({
          id: pc.id,
          name: pc.name,
          logoPath: pc.logo_path ? `${IMAGE_BASE_URL}/w200${pc.logo_path}` : null,
        })),
        spokenLanguages: (data.spoken_languages || []).map((l: any) => l.english_name || l.name),
        homepage: data.homepage,
        trailers,
        similar,
        recommended,
        providers,
        freePlayable: false, // Calculated by source resolver
        sources: [],
      };
    });
  }
}

export const tmdbAdapter = new TMDBAdapter();
