import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MovieApiService, SourceResolutionResult } from '../../services/movie-api.service';
import { FavoritesService } from '../../services/favorites.service';
import { MovieCardComponent } from '../../components/movie-card/movie-card.component';
import { NormalizedMovie, MovieSource } from '../../models/movie.model';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-movie-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MovieCardComponent],
  templateUrl: './movie-detail.component.html',
  styleUrls: ['./movie-detail.component.css'],
})
export class MovieDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private movieApi = inject(MovieApiService);
  private sanitizer = inject(DomSanitizer);
  private location = inject(Location);
  favoritesService = inject(FavoritesService);

  movie: NormalizedMovie | null = null;
  sourcesResult: SourceResolutionResult | null = null;
  safeTrailerUrl: SafeResourceUrl | null = null;
  isLoading = true;
  copySuccess = false;

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id');
          if (!id) return of(null);
          this.isLoading = true;
          this.movie = null;
          return this.movieApi.getMovieDetails(id);
        })
      )
      .subscribe({
        next: (movie) => {
          if (!movie) {
            this.isLoading = false;
            return;
          }
          this.movie = movie;
          this.isLoading = false;
          window.scrollTo({ top: 0, behavior: 'smooth' });

          // Load resolved legal playback sources
          this.movieApi.getMovieSources(movie.id).subscribe({
            next: (res) => {
              this.sourcesResult = res;
              // Set up trailer embed if available
              const trailerSource = res.sources.find(
                (s) => s.category === 'trailer' && s.playbackType === 'youtube_embed'
              );
              if (trailerSource && trailerSource.embedUrl) {
                this.safeTrailerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(trailerSource.embedUrl);
              } else if (movie.trailers && movie.trailers.length > 0) {
                const firstTrailer = movie.trailers.find((t) => t.site === 'YouTube');
                if (firstTrailer) {
                  this.safeTrailerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
                    `https://www.youtube-nocookie.com/embed/${firstTrailer.key}`
                  );
                }
              }
            },
            error: (err) => console.warn('Failed to resolve sources:', err),
          });
        },
        error: (err) => {
          console.error('Failed to load movie details:', err);
          this.isLoading = false;
        },
      });
  }

  get isFavorite(): boolean {
    return this.movie ? this.favoritesService.isFavorite(this.movie.id) : false;
  }

  toggleFavorite(): void {
    if (this.movie) {
      this.favoritesService.toggleFavorite(this.movie);
    }
  }

  get primaryDirectSource(): MovieSource | undefined {
    return this.sourcesResult?.sources.find(
      (s) => s.playbackType === 'direct' && s.category === 'full_movie' && s.approved
    );
  }

  get primaryEmbedSource(): MovieSource | undefined {
    return this.sourcesResult?.sources.find(
      (s) => ['youtube_embed', 'vimeo_embed'].includes(s.playbackType) && s.category === 'full_movie' && s.approved
    );
  }

  get hasWatchOption(): boolean {
    return !!(this.primaryDirectSource || this.primaryEmbedSource || this.movie?.freePlayable);
  }

  onWatchNowClick(): void {
    if (this.movie) {
      this.router.navigate(['/watch', this.movie.slug || this.movie.id]);
    }
  }

  scrollToTrailer(): void {
    const el = document.getElementById('trailer-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  shareMovie(): void {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      this.copySuccess = true;
      setTimeout(() => (this.copySuccess = false), 2500);
    }
  }

  goBack(): void {
    this.location.back();
  }

  formatCurrency(val?: number): string {
    return val && val > 0 ? `$${val.toLocaleString()}` : 'N/A';
  }

  formatRuntime(mins: number | null): string {
    if (!mins) return '';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }
}
