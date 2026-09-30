import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MovieCardComponent } from '../../components/movie-card/movie-card.component';
import { MovieApiService } from '../../services/movie-api.service';
import { MoviePreview } from '../../models/movie.model';

@Component({
  selector: 'app-genre-movies',
  standalone: true,
  imports: [CommonModule, MovieCardComponent],
  templateUrl: './genre-movies.component.html',
  styleUrls: ['./genre-movies.component.css'],
})
export class GenreMoviesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private movieApi = inject(MovieApiService);

  genreId = '';
  genreName = '';
  movies: MoviePreview[] = [];
  page = 1;
  totalPages = 1;
  isLoading = true;
  isLoadingMore = false;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.genreId = params.get('genre') || '';
      this.resolveGenreNameAndLoad();
    });
  }

  resolveGenreNameAndLoad(): void {
    this.isLoading = true;
    this.movieApi.getGenres().subscribe({
      next: (genres) => {
        const found = genres.find(
          (g) => g.id.toString() === this.genreId || g.name.toLowerCase() === this.genreId.toLowerCase()
        );
        if (found) {
          this.genreName = found.name;
          this.genreId = found.id.toString();
        } else {
          this.genreName = `Genre ${this.genreId}`;
        }
        this.loadMovies(1, false);
      },
      error: () => {
        this.loadMovies(1, false);
      },
    });
  }

  loadMovies(page: number, append = false): void {
    if (append) this.isLoadingMore = true;
    else this.isLoading = true;

    this.movieApi.getLatest(page, { genre: this.genreId }).subscribe({
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
