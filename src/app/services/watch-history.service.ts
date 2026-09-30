import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { WatchHistoryItem } from '../models/movie.model';

const STORAGE_KEY = 'movie_explorer_watch_history';

@Injectable({
  providedIn: 'root',
})
export class WatchHistoryService {
  private historySubject: BehaviorSubject<WatchHistoryItem[]>;
  public history$: Observable<WatchHistoryItem[]>;

  constructor() {
    const initial = this.loadFromStorage();
    this.historySubject = new BehaviorSubject<WatchHistoryItem[]>(initial);
    this.history$ = this.historySubject.asObservable();
  }

  getHistory(): WatchHistoryItem[] {
    return this.historySubject.getValue();
  }

  getContinueWatching(): WatchHistoryItem[] {
    return this.getHistory().filter((item) => {
      // In progress: has watched at least 5 seconds, not marked complete, and not within 95% of ending
      const notFinished = !item.completed && (item.duration <= 0 || item.playbackPosition < item.duration * 0.95);
      return item.playbackPosition >= 5 && notFinished;
    });
  }

  getRecentlyWatched(): WatchHistoryItem[] {
    return [...this.getHistory()].sort(
      (a, b) => new Date(b.lastWatchedTime).getTime() - new Date(a.lastWatchedTime).getTime()
    );
  }

  saveProgress(entry: WatchHistoryItem): void {
    const current = this.getHistory();
    const existingIndex = current.findIndex((item) => String(item.movieId) === String(entry.movieId));

    let updated: WatchHistoryItem[];
    if (existingIndex >= 0) {
      const merged: WatchHistoryItem = {
        ...current[existingIndex],
        ...entry,
        lastWatchedTime: entry.lastWatchedTime || new Date().toISOString(),
      };
      // Move to top of history
      updated = [merged, ...current.filter((_, idx) => idx !== existingIndex)];
    } else {
      updated = [
        {
          ...entry,
          lastWatchedTime: entry.lastWatchedTime || new Date().toISOString(),
        },
        ...current,
      ];
    }

    // Limit history to 50 items
    if (updated.length > 50) {
      updated = updated.slice(0, 50);
    }

    this.saveToStorage(updated);
    this.historySubject.next(updated);
  }

  removeFromHistory(movieId: number | string): void {
    const updated = this.getHistory().filter((item) => String(item.movieId) !== String(movieId));
    this.saveToStorage(updated);
    this.historySubject.next(updated);
  }

  clearHistory(): void {
    this.saveToStorage([]);
    this.historySubject.next([]);
  }

  private loadFromStorage(): WatchHistoryItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(items: WatchHistoryItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.warn('Failed to save watch history to localStorage', err);
    }
  }
}
