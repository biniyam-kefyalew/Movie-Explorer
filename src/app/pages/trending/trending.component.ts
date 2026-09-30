import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MovieCardComponent } from '../../components/movie-card/movie-card.component';
import { MovieApiService } from '../../services/movie-api.service';
import { MoviePreview } from '../../models/movie.model';

@Component({
  selector: 'app-trending',
  standalone: true,
  imports: [CommonModule, FormsModule, MovieCardComponent],
  templateUrl: './trending.component.html',
  styleUrls: ['./trending.component.css'],
})
export class TrendingComponent implements OnInit {
  private movieApi = inject(MovieApiService);

  movies: MoviePreview[] = [];
  page = 1;
  totalPages = 1;
  totalResults = 0;
  isLoading = false;
  isLoadingMore = false;
  searchFilter = '';

  ngOnInit(): void {
    this.loadMovies(1);
  }

  loadMovies(page: number, append = false): void {
    if (append) {
      this.isLoadingMore = true;
    } else {
      this.isLoading = true;
    }

    this.movieApi.getTrending(page).subscribe({
      next: (res) => {
        this.page = res.page;
        this.totalPages = res.totalPages;
        this.totalResults = res.totalResults;

        if (append) {
          this.movies = [...this.movies, ...res.results];
        } else {
          this.movies = res.results;
        }

        this.isLoading = false;
        this.isLoadingMore = false;
      },
      error: (err) => {
        console.error('Error loading trending movies:', err);
        this.isLoading = false;
        this.isLoadingMore = false;
      },
    });
  }

  loadMore(): void {
    if (this.page < this.totalPages && !this.isLoadingMore) {
      this.loadMovies(this.page + 1, true);
    }
  }

  get displayedMovies(): MoviePreview[] {
    if (!this.searchFilter.trim()) {
      return this.movies;
    }
    const q = this.searchFilter.toLowerCase().trim();
    return this.movies.filter((m) => m.title.toLowerCase().includes(q));
  }
}
