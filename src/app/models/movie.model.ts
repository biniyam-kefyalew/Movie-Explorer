export type PlaybackType = 'direct' | 'youtube_embed' | 'vimeo_embed' | 'external';
export type SourceProvider = 'internet_archive' | 'youtube' | 'vimeo' | 'tmdb_watch_provider' | 'manual_verified';
export type SourceCategory = 'full_movie' | 'trailer' | 'clip' | 'external_provider';

export interface MovieSource {
  id: string;
  movieId: number | string;
  provider: SourceProvider;
  sourceId: string;
  title: string;
  playbackType: PlaybackType;
  category: SourceCategory;
  url: string;
  embedUrl?: string | null;
  quality?: string;
  format?: string;
  duration?: number;
  thumbnail?: string;
  license?: string;
  attribution: string;
  approved: boolean;
  verifiedAt?: string;
}

export interface WatchProviderItem {
  id: number;
  name: string;
  logoUrl: string;
  url?: string;
}

export interface WatchProvidersByRegion {
  link?: string;
  flatrate: WatchProviderItem[];
  rent: WatchProviderItem[];
  buy: WatchProviderItem[];
  free: WatchProviderItem[];
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
  order?: number;
}

export interface VideoItem {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  publishedAt?: string;
}

export interface MovieGenre {
  id: number;
  name: string;
}

export interface MoviePreview {
  id: number;
  tmdbId: number;
  title: string;
  slug: string;
  overview: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  releaseDate: string;
  year: number | null;
  rating: number;
  voteCount: number;
  genres: MovieGenre[];
  freePlayable?: boolean;
  type?: 'movie' | 'tv' | 'person';
  trailerKey?: string;
  trailerEmbedUrl?: string;
  // Backward compatibility fields for any legacy template references
  poster_path?: string;
  release_date?: string;
  vote_average?: number;
}

export interface NormalizedMovie {
  id: number;
  tmdbId: number;
  title: string;
  originalTitle: string;
  slug: string;
  type: 'movie' | 'tv' | 'person';
  overview: string;
  tagline?: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  releaseDate: string;
  year: number | null;
  rating: number;
  voteCount: number;
  genres: MovieGenre[];
  runtime: number | null;
  budget?: number;
  revenue?: number;
  status?: string;
  cast: CastMember[];
  director?: string;
  productionCompanies?: Array<{ id: number; name: string; logoPath: string | null }>;
  spokenLanguages?: string[];
  homepage?: string;
  trailers: VideoItem[];
  similar: MoviePreview[];
  recommended: MoviePreview[];
  providers?: WatchProvidersByRegion;
  freePlayable: boolean;
  sources: MovieSource[];
}

export interface PaginatedResult<T> {
  page: number;
  totalPages: number;
  totalResults: number;
  results: T[];
}

export interface WatchHistoryItem {
  movieId: number | string;
  movieTitle: string;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  playbackPosition: number; // in seconds
  duration: number; // in seconds
  lastWatchedTime: string; // ISO date string
  completed: boolean;
  sourceTitle?: string;
  sourceProvider?: string;
  playbackType?: PlaybackType;
}

export interface FavoriteItem {
  id: number;
  title: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  year: number | null;
  rating: number;
  addedAt: string;
}

// Keep Movie alias for legacy imports
export type Movie = MoviePreview;
