import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  NormalizedMovie,
  MoviePreview,
  PaginatedResult,
  MovieGenre,
  MovieSource,
  VideoItem,
  WatchProvidersByRegion,
} from '../models/movie.model';
import { environment } from '../../environments/environment';

export interface MovieFilterParams {
  genre?: string;
  year?: string;
  minRating?: string;
  maxRating?: string;
  sortBy?: string;
  freeOnly?: boolean;
}

export interface SourceResolutionResult {
  sources: MovieSource[];
  freePlayable: boolean;
  hasFullMovie: boolean;
  watchAction: 'watch_direct' | 'watch_embed' | 'where_to_watch' | 'none';
}

@Injectable({
  providedIn: 'root',
})
export class MovieApiService {
  private baseUrl = environment.apiBaseUrl || '/api';

  constructor(private http: HttpClient) {}

  getHeroMovies(): Observable<MoviePreview[]> {
    return this.http.get<MoviePreview[]>(`${this.baseUrl}/movies/hero`);
  }

  getLatest(page = 1, filters: MovieFilterParams = {}): Observable<PaginatedResult<MoviePreview>> {
    let params = new HttpParams().set('page', page.toString());
    if (filters.genre) params = params.set('genre', filters.genre);
    if (filters.year) params = params.set('year', filters.year);
    if (filters.minRating) params = params.set('minRating', filters.minRating);
    if (filters.maxRating) params = params.set('maxRating', filters.maxRating);
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.freeOnly) params = params.set('freeOnly', 'true');

    return this.http.get<PaginatedResult<MoviePreview>>(`${this.baseUrl}/movies/latest`, { params });
  }

  getTrending(page = 1, timeWindow = 'day'): Observable<PaginatedResult<MoviePreview>> {
    const params = new HttpParams().set('page', page.toString()).set('timeWindow', timeWindow);
    return this.http.get<PaginatedResult<MoviePreview>>(`${this.baseUrl}/movies/trending`, { params });
  }

  getPopular(page = 1): Observable<PaginatedResult<MoviePreview>> {
    const params = new HttpParams().set('page', page.toString());
    return this.http.get<PaginatedResult<MoviePreview>>(`${this.baseUrl}/movies/popular`, { params });
  }

  getTopRated(page = 1): Observable<PaginatedResult<MoviePreview>> {
    const params = new HttpParams().set('page', page.toString());
    return this.http.get<PaginatedResult<MoviePreview>>(`${this.baseUrl}/movies/top-rated`, { params });
  }

  getNowPlaying(page = 1): Observable<PaginatedResult<MoviePreview>> {
    const params = new HttpParams().set('page', page.toString());
    return this.http.get<PaginatedResult<MoviePreview>>(`${this.baseUrl}/movies/now-playing`, { params });
  }

  getUpcoming(page = 1): Observable<PaginatedResult<MoviePreview>> {
    const params = new HttpParams().set('page', page.toString());
    return this.http.get<PaginatedResult<MoviePreview>>(`${this.baseUrl}/movies/upcoming`, { params });
  }

  getFreeMovies(page = 1): Observable<PaginatedResult<MoviePreview>> {
    const params = new HttpParams().set('page', page.toString());
    return this.http.get<PaginatedResult<MoviePreview>>(`${this.baseUrl}/movies/free-movies`, { params });
  }

  getGenres(): Observable<MovieGenre[]> {
    return this.http.get<MovieGenre[]>(`${this.baseUrl}/movies/genres`);
  }

  search(query: string, page = 1): Observable<PaginatedResult<any>> {
    const params = new HttpParams().set('q', query).set('page', page.toString());
    return this.http.get<PaginatedResult<any>>(`${this.baseUrl}/movies/search`, { params });
  }

  getMovieDetails(idOrSlug: string | number): Observable<NormalizedMovie> {
    return this.http.get<NormalizedMovie>(`${this.baseUrl}/movies/${idOrSlug}`);
  }

  getMovieSources(idOrSlug: string | number): Observable<SourceResolutionResult> {
    return this.http.get<SourceResolutionResult>(`${this.baseUrl}/movies/${idOrSlug}/sources`);
  }

  getMovieTrailers(idOrSlug: string | number): Observable<VideoItem[]> {
    return this.http.get<VideoItem[]>(`${this.baseUrl}/movies/${idOrSlug}/trailers`);
  }

  getMovieProviders(idOrSlug: string | number): Observable<WatchProvidersByRegion | null> {
    return this.http.get<WatchProvidersByRegion | null>(`${this.baseUrl}/movies/${idOrSlug}/providers`);
  }
}
