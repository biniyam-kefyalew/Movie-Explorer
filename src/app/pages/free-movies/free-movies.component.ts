import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MovieCardComponent } from '../../components/movie-card/movie-card.component';
import { MovieApiService } from '../../services/movie-api.service';
import { MoviePreview } from '../../models/movie.model';

@Component({
  selector: 'app-free-movies',
  standalone: true,
  imports: [CommonModule, MovieCardComponent],
  templateUrl: './free-movies.component.html',
  styleUrls: ['./free-movies.component.css'],
})
export class FreeMoviesComponent implements OnInit {
  private movieApi = inject(MovieApiService);

  movies: MoviePreview[] = [];
  page = 1;
  totalPages = 1;
  isLoading = true;
  isLoadingMore = false;

  ngOnInit(): void {
    this.loadMovies(1);
  }

  loadMovies(page: number, append = false): void {
    if (append) this.isLoadingMore = true;
    else this.isLoading = true;

    this.movieApi.getFreeMovies(page).subscribe({
      next: (res) => {
        this.page = res.page;
        this.totalPages = res.totalPages;
        this.movies = append ? [...this.movies, ...res.results] : res.results;
        this.isLoading = false;
        this.isLoadingMore = false;
      },
      error: () => {
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
}
