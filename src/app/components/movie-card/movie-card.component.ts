import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MoviePreview } from '../../models/movie.model';
import { FavoritesService } from '../../services/favorites.service';

@Component({
  selector: 'app-movie-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './movie-card.component.html',
  styleUrls: ['./movie-card.component.css'],
})
export class MovieCardComponent {
  @Input() movie!: MoviePreview;
  private favoritesService = inject(FavoritesService);

  get posterUrl(): string {
    if (this.movie.posterUrl) return this.movie.posterUrl;
    if (this.movie.poster_path) return `https://image.tmdb.org/t/p/w500${this.movie.poster_path}`;
    return 'assets/image/icon.png';
  }

  get movieYear(): string {
    if (this.movie.year) return this.movie.year.toString();
    const date = this.movie.releaseDate || this.movie.release_date;
    if (date) return date.split('-')[0];
    return '';
  }

  get movieRating(): string {
    const r = this.movie.rating ?? this.movie.vote_average ?? 0;
    return r ? r.toFixed(1) : '';
  }

  get detailLink(): string {
    return `/movie/${this.movie.slug || this.movie.id}`;
  }

  get isFavorite(): boolean {
    return this.favoritesService.isFavorite(this.movie.id);
  }

  toggleFavorite(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.favoritesService.toggleFavorite(this.movie);
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/image/icon.png';
  }
}
