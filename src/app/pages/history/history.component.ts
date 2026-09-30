import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WatchHistoryService } from '../../services/watch-history.service';
import { WatchHistoryItem } from '../../models/movie.model';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css'],
})
export class HistoryComponent implements OnInit {
  historyService = inject(WatchHistoryService);

  continueWatching: WatchHistoryItem[] = [];
  recentlyWatched: WatchHistoryItem[] = [];

  ngOnInit(): void {
    this.historyService.history$.subscribe(() => {
      this.continueWatching = this.historyService.getContinueWatching();
      this.recentlyWatched = this.historyService.getRecentlyWatched();
    });
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  formatDate(isoString: string): string {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  removeItem(movieId: number | string, event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.historyService.removeFromHistory(movieId);
  }

  clearAll(): void {
    if (confirm('Are you sure you want to clear your entire watch history?')) {
      this.historyService.clearHistory();
    }
  }
}
