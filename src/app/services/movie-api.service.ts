import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable } from 'rxjs';
import { Movie } from '../models/movie.model';
import { MovieDetail } from '../models/movie-detail.model';
import { environment } from '../../environments/environment';
import { map, tap } from 'rxjs/operators';

interface MovieSearchResponse {
  results: Movie[];
  total_results: number;
  total_pages: number;
}

@Injectable({
  providedIn: 'root',
})
export class MovieApiService {
  private apiKey = environment.tmdbApiKey; // TMDb API Key
  private apiUrl = 'https://api.themoviedb.org/3';

  constructor(private http: HttpClient) {}

  // 🔍 Search for movies by title
  searchMovies(query: string): Observable<MovieSearchResponse> {
    return this.http
      .get<MovieSearchResponse>(`${this.apiUrl}/search/movie`, {
        params: {
          api_key: this.apiKey,
          query,
          language: 'en-US',
          include_adult: 'false',
        },
      })
      .pipe(
        tap((response) => console.log('Full API Response:', response)) // ✅ Logs full response
      );
  }

  // 📌 Get Movie Details by ID
  getMovieDetails(movieId: string): Observable<MovieDetail> {
    return this.http.get<MovieDetail>(`${this.apiUrl}/movie/${movieId}`, {
      params: {
        api_key: this.apiKey,
        language: 'en-US',
        append_to_response:
          'credits,videos,images,reviews,similar,recommendations',
      },
    });
  }

  // ✅ Get Latest Movies
  getLatestMovies(): Observable<Movie[]> {
    const totalPagesToFetch = 25; // 25 pages * 20 movies per page = 500 movies
    const requests: Observable<MovieSearchResponse>[] = [];

    for (let page = 1; page <= totalPagesToFetch; page++) {
      requests.push(
        this.http.get<MovieSearchResponse>(`${this.apiUrl}/discover/movie`, {
          params: {
            api_key: this.apiKey,
            language: 'en-US',
            sort_by: 'release_date.desc', // Latest movies first
            include_adult: 'false',
            include_video: 'false',
            page: page.toString(),
            'release_date.lte': new Date().toISOString().split('T')[0], // Only past releases
          },
        })
      );
    }

    return forkJoin(requests).pipe(
      map((responses) => responses.flatMap((response) => response.results)) // Merge results from all pages
    );
  }

  // ✅ Get Popular Movies
  getPopularMovies(): Observable<Movie[]> {
    const totalPagesToFetch = 25;
    const requests: Observable<MovieSearchResponse>[] = [];
    for (let page = 1; page <= totalPagesToFetch; page++) {
      requests.push(
        this.http.get<MovieSearchResponse>(`${this.apiUrl}/movie/popular`, {
          params: {
            api_key: this.apiKey,
            language: 'en-US',
            page: page.toString(),
          },
        })
      );
    }
    return forkJoin(requests).pipe(
      map((responses) => responses.flatMap((response) => response.results)) // Merge results from all pages
    );
  }

  // ✅ Get Top Rated Movies
  getTopRatedMovies(): Observable<Movie[]> {
    const totalPagesToFetch = 25;
    const requests: Observable<MovieSearchResponse>[] = [];
    for (let page = 1; page <= totalPagesToFetch; page++) {
      requests.push(
        this.http.get<MovieSearchResponse>(`${this.apiUrl}/movie/top_rated`, {
          params: {
            api_key: this.apiKey,
            language: 'en-US',
            page: page.toString(),
          },
        })
      );
    }
    return forkJoin(requests).pipe(
      map((responses) => responses.flatMap((response) => response.results)) // Merge results from all pages
    );
  }

  // ✅ Get Upcoming Movies
  getUpcomingMovies(): Observable<Movie[]> {
    const totalPagesToFetch = 25;
    const requests: Observable<MovieSearchResponse>[] = [];
    for (let page = 1; page <= totalPagesToFetch; page++) {
      requests.push(
        this.http.get<MovieSearchResponse>(`${this.apiUrl}/movie/upcoming`, {
          params: {
            api_key: this.apiKey,
            language: 'en-US',
            page: page.toString(),
          },
        })
      );
    }
    return forkJoin(requests).pipe(
      map((responses) => responses.flatMap((response) => response.results)) // Merge results from all pages
    );
  }
}
