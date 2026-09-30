import { tmdbAdapter } from '../adapters/tmdbAdapter';
import { internetArchiveAdapter } from '../adapters/internetArchiveAdapter';
import { youtubeAdapter } from '../adapters/youtubeAdapter';
import { vimeoAdapter } from '../adapters/vimeoAdapter';
import { adminSourceStore } from './adminSourceStore';
import { MovieSource, NormalizedMovie } from '../types/movie';
import { globalCache } from '../cache/cacheService';

export class SourceResolverService {
  /**
   * Resolves all verified legal sources for a movie, applying multi-source resolution:
   * 1. Admin manually approved / verified sources
   * 2. Internet Archive search with rights & license inspection
   * 3. YouTube trailers (from TMDB vetted official video keys or YouTube API embeddable search)
   * 4. Vimeo authorized video (if enabled)
   * 5. External streaming providers (TMDB Watch Providers / JustWatch)
   */
  async resolveMovieSources(movie: NormalizedMovie): Promise<{
    sources: MovieSource[];
    freePlayable: boolean;
    hasFullMovie: boolean;
    watchAction: 'watch_direct' | 'watch_embed' | 'where_to_watch' | 'none';
  }> {
    const cacheKey = `sources:resolved:${movie.id}`;
    return globalCache.getOrSet(cacheKey, 1800, async () => {
      const allSources: MovieSource[] = [];

      // Step 1: Pre-verified & Admin Approved Sources
      const adminSources = adminSourceStore.getByMovieId(movie.id);
      allSources.push(...adminSources);

      // Step 2 & 3: Internet Archive Legal Playable Streams
      const hasDirectFullMovie = adminSources.some((s) => s.category === 'full_movie' && s.approved);
      if (!hasDirectFullMovie) {
        try {
          const iaSources = await internetArchiveAdapter.resolveSources(
            movie.title,
            movie.year,
            movie.id
          );

          // If no match on English title and originalTitle differs, try originalTitle
          if (iaSources.length === 0 && movie.originalTitle && movie.originalTitle !== movie.title) {
            const iaOriginalSources = await internetArchiveAdapter.resolveSources(
              movie.originalTitle,
              movie.year,
              movie.id
            );
            allSources.push(...iaOriginalSources);
          } else {
            allSources.push(...iaSources);
          }
        } catch (err: any) {
          console.warn(`[SourceResolver] IA resolution failure for ${movie.id}:`, err.message);
        }
      }

      // Step 4: YouTube Official Trailers and Clips
      try {
        // TMDB videos (high accuracy, vetted official keys from studios)
        const tmdbTrailerSources = youtubeAdapter.fromTmdbVideos(movie.trailers, movie.title, movie.id);
        allSources.push(...tmdbTrailerSources);

        // If no trailers from TMDB, try YouTube Data API
        if (tmdbTrailerSources.length === 0) {
          const ytApiTrailer = await youtubeAdapter.searchTrailer(movie.title, movie.year, movie.id);
          if (ytApiTrailer) {
            allSources.push(ytApiTrailer);
          }
        }
      } catch (err: any) {
        console.warn(`[SourceResolver] YouTube resolution failure for ${movie.id}:`, err.message);
      }

      // Step 5: Check Vimeo if enabled
      if (vimeoAdapter.isEnabled()) {
        try {
          const vimeoSource = await vimeoAdapter.searchVideo(movie.title, movie.year, movie.id);
          if (vimeoSource) {
            allSources.push(vimeoSource);
          }
        } catch (err: any) {
          console.warn(`[SourceResolver] Vimeo resolution failure for ${movie.id}:`, err.message);
        }
      }

      // Prioritize sources:
      // 1. Direct full movie stream (Internet Archive, verified)
      // 2. Embed full movie stream
      // 3. YouTube official trailer
      // 4. Clips & others
      const priorityOrder: Record<string, number> = {
        'direct_full_movie': 100,
        'vimeo_embed_full_movie': 90,
        'youtube_embed_full_movie': 80,
        'youtube_embed_trailer': 70,
        'youtube_embed_clip': 50,
      };

      allSources.sort((a, b) => {
        const keyA = `${a.playbackType}_${a.category}`;
        const keyB = `${b.playbackType}_${b.category}`;
        return (priorityOrder[keyB] || 0) - (priorityOrder[keyA] || 0);
      });

      // Compute status flags strictly following the prompt rules
      const approvedDirectSources = allSources.filter(
        (s) => s.playbackType === 'direct' && s.category === 'full_movie' && s.approved
      );
      const approvedEmbedSources = allSources.filter(
        (s) => ['youtube_embed', 'vimeo_embed'].includes(s.playbackType) && s.category === 'full_movie' && s.approved
      );

      const hasApprovedDirect = approvedDirectSources.length > 0;
      const hasApprovedEmbed = approvedEmbedSources.length > 0;
      const freePlayable = hasApprovedDirect || hasApprovedEmbed;

      let watchAction: 'watch_direct' | 'watch_embed' | 'where_to_watch' | 'none' = 'none';
      if (hasApprovedDirect) {
        watchAction = 'watch_direct';
      } else if (hasApprovedEmbed) {
        watchAction = 'watch_embed';
      } else if (
        movie.providers &&
        (movie.providers.flatrate.length > 0 ||
          movie.providers.free.length > 0 ||
          movie.providers.rent.length > 0 ||
          movie.providers.buy.length > 0)
      ) {
        watchAction = 'where_to_watch';
      }

      return {
        sources: allSources,
        freePlayable,
        hasFullMovie: hasApprovedDirect || hasApprovedEmbed,
        watchAction,
      };
    });
  }

  /**
   * Enriches a movie model with its resolved sources and playback flags
   */
  async enrichMovie(movie: NormalizedMovie): Promise<NormalizedMovie> {
    const resolution = await this.resolveMovieSources(movie);
    return {
      ...movie,
      sources: resolution.sources,
      freePlayable: resolution.freePlayable,
    };
  }
}

export const sourceResolver = new SourceResolverService();
