import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MovieDetail } from '../../models/movie-detail.model';
import { MovieApiService } from '../../services/movie-api.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Location } from '@angular/common';
import { switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-movie-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './movie-detail.component.html',
})
export class MovieDetailComponent implements OnInit {
  movie: MovieDetail | null = null;
  safeTrailerUrl: SafeResourceUrl | null = null;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private movieService: MovieApiService,
    private sanitizer: DomSanitizer,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        tap(() => {
          this.isLoading = true; // ✅ Show loading before fetching
          this.movie = null; // ✅ Clear previous movie data
        }),
        switchMap((params) => {
          const movieId = params.get('id');
          return movieId ? this.movieService.getMovieDetails(movieId) : [];
        })
      )
      .subscribe((response) => {
        if (!response) return;

        this.movie = response;
        this.isLoading = false; // ✅ Hide loading after fetching

        // ✅ Scroll to top when new movie is rendered
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // ✅ Extract Director
        const director = response.credits?.crew.find(
          (person) => person.job === 'Director'
        );
        this.movie.director = director
          ? { id: director.id, name: director.name }
          : null;

        // ✅ Get Trailer URL
        const trailer = response.videos?.results.find(
          (video) => video.type === 'Trailer' && video.site === 'YouTube'
        );
        this.safeTrailerUrl = trailer
          ? this.sanitizer.bypassSecurityTrustResourceUrl(
              `https://www.youtube.com/embed/${trailer.key}`
            )
          : null;
      });
  }

  goBack(): void {
    this.location.back();
  }

  getGenres(): string {
    return (
      this.movie?.genres?.map((genre) => genre.name).join(', ') || 'Unknown'
    );
  }

  getProductionCompanies(): string {
    return (
      this.movie?.production_companies
        ?.map((company) => company.name)
        .join(', ') || 'Unknown'
    );
  }

  formatCurrency(amount?: number): string {
    return amount ? `$${amount.toLocaleString()}` : 'N/A';
  }

  getTrailerUrl(): string | null {
    const trailer = this.movie?.videos?.results?.find(
      (video) => video.site === 'YouTube' && video.type === 'Trailer'
    );
    return trailer
      ? `https://www.youtube.com/embed/${trailer.key}?autoplay=1&fs=1`
      : null;
  }

  hasCast(): boolean {
    return !!this.movie?.credits?.cast?.length;
  }

  hasTrailers(): boolean {
    return !!this.movie?.videos?.results?.length;
  }

  hasReviews(): boolean {
    return !!this.movie?.reviews?.results?.length;
  }

  hasSimilar(): boolean {
    return !!this.movie?.similar?.results?.length;
  }
}
