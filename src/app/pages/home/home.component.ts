import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeroSectionComponent } from '../../components/hero-section/hero-section.component';
import { MovieSliderComponent } from '../../components/movie-slider/movie-slider.component';
import { MovieCardComponent } from '../../components/movie-card/movie-card.component';
import { MovieApiService } from '../../services/movie-api.service';
import { WatchHistoryService } from '../../services/watch-history.service';
import { MoviePreview, WatchHistoryItem } from '../../models/movie.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, HeroSectionComponent, MovieSliderComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  private movieApi = inject(MovieApiService);
  private historyService = inject(WatchHistoryService);

  heroMovies: MoviePreview[] = [];
  trendingMovies: MoviePreview[] = [];
  freeMovies: MoviePreview[] = [];
  latestMovies: MoviePreview[] = [];
  popularMovies: MoviePreview[] = [];
  topRatedMovies: MoviePreview[] = [];
  nowPlayingMovies: MoviePreview[] = [];
  upcomingMovies: MoviePreview[] = [];
  continueWatching: WatchHistoryItem[] = [];

  loadingTrending = true;
  loadingFree = true;
  loadingLatest = true;
  loadingPopular = true;
  loadingTopRated = true;

  ngOnInit(): void {
    this.continueWatching = this.historyService.getContinueWatching();

    // 0. Hero Spotlight Slideshow (popular movies enriched with trailers)
    this.movieApi.getHeroMovies().subscribe({
      next: (movies) => {
        this.heroMovies = movies || [];
      },
      error: () => {
        // Fallback to trending movies if hero endpoint fails
        if (this.trendingMovies.length > 0) {
          this.heroMovies = this.trendingMovies.slice(0, 6);
        }
      },
    });

    // 1. Trending
    this.movieApi.getTrending(1).subscribe({
      next: (res) => {
        this.trendingMovies = res.results || [];
        if (this.heroMovies.length === 0 && this.trendingMovies.length > 0) {
          this.heroMovies = this.trendingMovies.slice(0, 6);
        }
        this.loadingTrending = false;
      },
      error: (err) => {
        console.warn('Failed to load trending:', err);
        this.loadingTrending = false;
      },
    });

    // 2. Verified Free Movies (Internet Archive)
    this.movieApi.getFreeMovies(1).subscribe({
      next: (res) => {
        this.freeMovies = res.results || [];
        this.loadingFree = false;
      },
      error: (err) => {
        console.warn('Failed to load free movies:', err);
        this.loadingFree = false;
      },
    });

    // 3. Latest Movies
    this.movieApi.getLatest(1).subscribe({
      next: (res) => {
        this.latestMovies = res.results || [];
        this.loadingLatest = false;
      },
      error: (err) => {
        console.warn('Failed to load latest movies:', err);
        this.loadingLatest = false;
      },
    });

    // 4. Popular Movies
    this.movieApi.getPopular(1).subscribe({
      next: (res) => {
        this.popularMovies = res.results || [];
        this.loadingPopular = false;
      },
      error: (err) => {
        console.warn('Failed to load popular movies:', err);
        this.loadingPopular = false;
      },
    });

    // 5. Top Rated Movies
    this.movieApi.getTopRated(1).subscribe({
      next: (res) => {
        this.topRatedMovies = res.results || [];
        this.loadingTopRated = false;
      },
      error: (err) => {
        console.warn('Failed to load top rated movies:', err);
        this.loadingTopRated = false;
      },
    });

    // 6. Now Playing
    this.movieApi.getNowPlaying(1).subscribe({
      next: (res) => {
        this.nowPlayingMovies = res.results || [];
      },
      error: (err) => console.warn('Failed to load now playing:', err),
    });

    // 7. Upcoming
    this.movieApi.getUpcoming(1).subscribe({
      next: (res) => {
        this.upcomingMovies = res.results || [];
      },
      error: (err) => console.warn('Failed to load upcoming:', err),
    });
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
}
