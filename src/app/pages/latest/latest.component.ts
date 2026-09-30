import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MovieCardComponent } from '../../components/movie-card/movie-card.component';
import { FilterPanelComponent } from '../../components/filter-panel/filter-panel.component';
import { MovieApiService, MovieFilterParams } from '../../services/movie-api.service';
import { MoviePreview } from '../../models/movie.model';

@Component({
  selector: 'app-latest',
  standalone: true,
  imports: [CommonModule, FormsModule, MovieCardComponent, FilterPanelComponent],
  templateUrl: './latest.component.html',
  styleUrls: ['./latest.component.css'],
})
export class LatestComponent implements OnInit {
  private movieApi = inject(MovieApiService);

  movies: MoviePreview[] = [];
  page = 1;
  totalPages = 1;
  totalResults = 0;
  isLoading = false;
  isLoadingMore = false;
  isFilterOpen = false;

  searchFilter = '';
  filters: MovieFilterParams = {
    sortBy: 'primary_release_date.desc',
  };

  ngOnInit(): void {
    this.loadMovies(1);
  }

  loadMovies(page: number, append = false): void {
    if (append) {
      this.isLoadingMore = true;
    } else {
      this.isLoading = true;
    }

    this.movieApi.getLatest(page, this.filters).subscribe({
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
        console.error('Error loading latest movies:', err);
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

  onFiltersChange(newFilters: MovieFilterParams): void {
    this.filters = { ...this.filters, ...newFilters };
    this.loadMovies(1, false);
  }

  get displayedMovies(): MoviePreview[] {
    if (!this.searchFilter.trim()) {
      return this.movies;
    }
    const q = this.searchFilter.toLowerCase().trim();
    return this.movies.filter((m) => m.title.toLowerCase().includes(q));
  }

  openFilters(): void {
    this.isFilterOpen = true;
  }

  closeFilters(): void {
    this.isFilterOpen = false;
  }

  clearAllFilters(): void {
    this.searchFilter = '';
    this.filters = { sortBy: 'primary_release_date.desc' };
    this.loadMovies(1, false);
  }
}
