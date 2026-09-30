import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MovieGenre } from '../../models/movie.model';
import { MovieApiService, MovieFilterParams } from '../../services/movie-api.service';

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-panel.component.html',
  styleUrls: ['./filter-panel.component.css'],
})
export class FilterPanelComponent implements OnInit {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() filtersChange = new EventEmitter<MovieFilterParams>();

  private movieApi = inject(MovieApiService);

  genres: MovieGenre[] = [];
  selectedGenre = '';
  selectedYear = '';
  minRating = '0';
  maxRating = '10';
  selectedSort = 'primary_release_date.desc';
  freeOnly = false;

  years: number[] = [];

  sortOptions = [
    { label: 'Latest Release', value: 'primary_release_date.desc' },
    { label: 'Oldest Release', value: 'primary_release_date.asc' },
    { label: 'Most Popular', value: 'popularity.desc' },
    { label: 'Highest Rated', value: 'vote_average.desc' },
    { label: 'Title (A-Z)', value: 'title.asc' },
  ];

  ngOnInit(): void {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear; y >= 1920; y--) {
      this.years.push(y);
    }

    this.movieApi.getGenres().subscribe({
      next: (list) => {
        this.genres = list;
      },
      error: (err) => console.warn('Failed to load genres:', err),
    });
  }

  applyFilters(): void {
    const params: MovieFilterParams = {
      genre: this.selectedGenre || undefined,
      year: this.selectedYear || undefined,
      minRating: this.minRating !== '0' ? this.minRating : undefined,
      maxRating: this.maxRating !== '10' ? this.maxRating : undefined,
      sortBy: this.selectedSort,
      freeOnly: this.freeOnly,
    };
    this.filtersChange.emit(params);
    this.close.emit();
  }

  resetFilters(): void {
    this.selectedGenre = '';
    this.selectedYear = '';
    this.minRating = '0';
    this.maxRating = '10';
    this.selectedSort = 'primary_release_date.desc';
    this.freeOnly = false;
    this.applyFilters();
  }

  onClose(): void {
    this.close.emit();
  }
}
