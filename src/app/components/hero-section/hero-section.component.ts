import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MoviePreview } from '../../models/movie.model';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './hero-section.component.html',
  styleUrls: ['./hero-section.component.css'],
})
export class HeroSectionComponent implements OnInit, OnDestroy, OnChanges {
  @Input() movies: MoviePreview[] = [];
  @Input() set movie(val: MoviePreview | null | undefined) {
    if (val) {
      this.movies = [val];
      this.currentIndex = 0;
      this.updateTrailerForCurrent();
    }
  }

  private sanitizer = inject(DomSanitizer);

  currentIndex = 0;
  isMuted = true;
  safeTrailerUrl: SafeResourceUrl | null = null;
  private autoAdvanceTimer: any = null;
  isHovered = false;

  ngOnInit(): void {
    this.updateTrailerForCurrent();
    this.startAutoTimer();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['movies'] && this.movies.length > 0) {
      if (this.currentIndex >= this.movies.length) {
        this.currentIndex = 0;
      }
      this.updateTrailerForCurrent();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoTimer();
  }

  get currentMovie(): MoviePreview | null {
    if (!this.movies || this.movies.length === 0) return null;
    return this.movies[this.currentIndex] || null;
  }

  get backdropUrl(): string {
    const m = this.currentMovie;
    if (m?.backdropUrl) return m.backdropUrl;
    if (m?.posterUrl) return m.posterUrl;
    return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1600&auto=format&fit=crop';
  }

  get movieYear(): string {
    const m = this.currentMovie;
    if (m?.year) return m.year.toString();
    if (m?.releaseDate) return m.releaseDate.split('-')[0];
    return '';
  }

  get movieRating(): string {
    const r = this.currentMovie?.rating;
    return r ? r.toFixed(1) : '';
  }

  get detailLink(): string {
    const m = this.currentMovie;
    return `/movie/${m?.slug || m?.id || ''}`;
  }

  get watchLink(): string {
    const m = this.currentMovie;
    return `/watch/${m?.slug || m?.id || ''}`;
  }

  startAutoTimer(): void {
    this.stopAutoTimer();
    this.autoAdvanceTimer = setInterval(() => {
      if (!this.isHovered && this.movies.length > 1) {
        this.nextSlide();
      }
    }, 14000);
  }

  stopAutoTimer(): void {
    if (this.autoAdvanceTimer) {
      clearInterval(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }
  }

  onMouseEnter(): void {
    this.isHovered = true;
  }

  onMouseLeave(): void {
    this.isHovered = false;
  }

  nextSlide(): void {
    if (this.movies.length === 0) return;
    this.currentIndex = (this.currentIndex + 1) % this.movies.length;
    this.updateTrailerForCurrent();
  }

  prevSlide(): void {
    if (this.movies.length === 0) return;
    this.currentIndex = (this.currentIndex - 1 + this.movies.length) % this.movies.length;
    this.updateTrailerForCurrent();
  }

  goToSlide(index: number): void {
    if (index === this.currentIndex || index < 0 || index >= this.movies.length) return;
    this.currentIndex = index;
    this.updateTrailerForCurrent();
  }

  toggleSound(): void {
    this.isMuted = !this.isMuted;
    this.updateTrailerForCurrent();
  }

  private updateTrailerForCurrent(): void {
    const m = this.currentMovie;
    if (m && m.trailerKey) {
      const muteParam = this.isMuted ? '1' : '0';
      this.safeTrailerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.youtube-nocookie.com/embed/${m.trailerKey}?autoplay=1&mute=${muteParam}&controls=0&loop=1&playlist=${m.trailerKey}&playsinline=1&rel=0&modestbranding=1&enablejsapi=1`
      );
    } else {
      this.safeTrailerUrl = null;
    }
  }
}
