import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FavoriteItem, MoviePreview, NormalizedMovie } from '../models/movie.model';

const STORAGE_KEY = 'movie_explorer_favorites';

@Injectable({
  providedIn: 'root',
})
export class FavoritesService {
  private favoritesSubject: BehaviorSubject<FavoriteItem[]>;
  public favorites$: Observable<FavoriteItem[]>;

  constructor() {
    const initial = this.loadFromStorage();
    this.favoritesSubject = new BehaviorSubject<FavoriteItem[]>(initial);
    this.favorites$ = this.favoritesSubject.asObservable();
  }

  getFavorites(): FavoriteItem[] {
    return this.favoritesSubject.getValue();
  }

  isFavorite(id: number | string): boolean {
    const numId = Number(id);
    return this.getFavorites().some((f) => f.id === numId);
  }

  addFavorite(movie: MoviePreview | NormalizedMovie | any): void {
    const current = this.getFavorites();
    const numId = Number(movie.id || movie.tmdbId);
    if (current.some((f) => f.id === numId)) return;

    const item: FavoriteItem = {
      id: numId,
      title: movie.title,
      posterUrl: movie.posterUrl || movie.poster_path || null,
      backdropUrl: movie.backdropUrl || null,
      year: movie.year || (movie.releaseDate ? parseInt(movie.releaseDate.split('-')[0], 10) : null),
      rating: movie.rating ?? movie.vote_average ?? 0,
      addedAt: new Date().toISOString(),
    };

    const updated = [item, ...current];
    this.saveToStorage(updated);
    this.favoritesSubject.next(updated);
  }

  removeFavorite(id: number | string): void {
    const numId = Number(id);
    const updated = this.getFavorites().filter((f) => f.id !== numId);
    this.saveToStorage(updated);
    this.favoritesSubject.next(updated);
  }

  toggleFavorite(movie: MoviePreview | NormalizedMovie | any): boolean {
    const numId = Number(movie.id || movie.tmdbId);
    if (this.isFavorite(numId)) {
      this.removeFavorite(numId);
      return false;
    } else {
      this.addFavorite(movie);
      return true;
    }
  }

  clearFavorites(): void {
    this.saveToStorage([]);
    this.favoritesSubject.next([]);
  }

  private loadFromStorage(): FavoriteItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(items: FavoriteItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.warn('Failed to save favorites to localStorage', err);
    }
  }
}
