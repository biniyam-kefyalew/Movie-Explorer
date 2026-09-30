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
  flatrate?: WatchProviderItem[];
  rent?: WatchProviderItem[];
  buy?: WatchProviderItem[];
  free?: WatchProviderItem[];
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
  genres: Array<{ id: number; name: string }>;
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
  similar: NormalizedMoviePreview[];
  recommended: NormalizedMoviePreview[];
  providers?: {
    link?: string;
    flatrate: WatchProviderItem[];
    rent: WatchProviderItem[];
    buy: WatchProviderItem[];
    free: WatchProviderItem[];
  };
  freePlayable: boolean;
  sources: MovieSource[];
}

export interface NormalizedMoviePreview {
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
  genres: Array<{ id: number; name: string }>;
  freePlayable?: boolean;
  type?: 'movie' | 'tv' | 'person';
  trailerKey?: string;
  trailerEmbedUrl?: string;
}

export interface PaginatedResult<T> {
  page: number;
  totalPages: number;
  totalResults: number;
  results: T[];
}

export interface AdminSourcePayload {
  tmdbId: number;
  title: string;
  year?: number;
  sourceProvider: SourceProvider;
  playbackType: PlaybackType;
  playbackUrl: string;
  embedUrl?: string;
  category: SourceCategory;
  quality?: string;
  license: string;
  attribution: string;
  approved: boolean;
}
