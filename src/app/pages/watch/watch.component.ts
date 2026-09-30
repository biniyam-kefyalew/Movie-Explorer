import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MovieApiService } from '../../services/movie-api.service';
import { WatchHistoryService } from '../../services/watch-history.service';
import { NormalizedMovie, MovieSource } from '../../models/movie.model';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-watch',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './watch.component.html',
  styleUrls: ['./watch.component.css'],
})
export class WatchComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private movieApi = inject(MovieApiService);
  private historyService = inject(WatchHistoryService);
  private sanitizer = inject(DomSanitizer);
  private location = inject(Location);

  @ViewChild('videoPlayer') videoPlayerRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('playerContainer') playerContainerRef?: ElementRef<HTMLDivElement>;

  movie: NormalizedMovie | null = null;
  sources: MovieSource[] = [];
  activeSource: MovieSource | null = null;
  safeEmbedUrl: SafeResourceUrl | null = null;

  isLoading = true;
  errorMessage: string | null = null;

  // Player state
  isPlaying = false;
  currentTime = 0;
  duration = 0;
  volume = 1;
  isMuted = false;
  playbackRate = 1;
  isFullscreen = false;
  showControls = true;
  controlsTimeout: any = null;

  private resumePromptShown = false;
  savedResumePosition = 0;
  showResumeBanner = false;

  private progressSaveInterval: any = null;

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = params.get('id');
          if (!id) return of(null);
          this.isLoading = true;
          this.errorMessage = null;
          return this.movieApi.getMovieDetails(id);
        })
      )
      .subscribe({
        next: (movie) => {
          if (!movie) {
            this.isLoading = false;
            this.errorMessage = 'Movie not found';
            return;
          }
          this.movie = movie;

          // Check if there was previously saved progress to resume
          const historyEntry = this.historyService
            .getHistory()
            .find((h) => String(h.movieId) === String(movie.id));
          if (historyEntry && historyEntry.playbackPosition > 10 && !historyEntry.completed) {
            this.savedResumePosition = historyEntry.playbackPosition;
            this.showResumeBanner = true;
          }

          // Fetch resolved sources
          this.movieApi.getMovieSources(movie.id).subscribe({
            next: (res) => {
              this.sources = res.sources.filter((s) => s.approved);
              this.selectDefaultSource();
              this.isLoading = false;
            },
            error: (err) => {
              console.error('Failed to load movie sources:', err);
              this.isLoading = false;
              this.errorMessage = 'Unable to resolve playback sources.';
            },
          });
        },
        error: (err) => {
          console.error('Failed to load movie for playback:', err);
          this.isLoading = false;
          this.errorMessage = 'Failed to load movie details.';
        },
      });

    // Save progress every 5 seconds while playing
    this.progressSaveInterval = setInterval(() => {
      if (this.isPlaying && this.movie && this.currentTime > 0) {
        this.saveCurrentProgress();
      }
    }, 5000);
  }

  ngOnDestroy(): void {
    if (this.progressSaveInterval) {
      clearInterval(this.progressSaveInterval);
    }
    if (this.controlsTimeout) {
      clearTimeout(this.controlsTimeout);
    }
    // Save last known progress on destroy
    if (this.movie && this.currentTime > 0) {
      this.saveCurrentProgress();
    }
  }

  selectDefaultSource(): void {
    if (this.sources.length === 0) {
      // Fallback: check if movie has trailer embed
      if (this.movie?.trailers && this.movie.trailers.length > 0) {
        const tr = this.movie.trailers.find((t) => t.site === 'YouTube');
        if (tr) {
          this.safeEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
            `https://www.youtube-nocookie.com/embed/${tr.key}?autoplay=1&enablejsapi=1`
          );
        }
      }
      return;
    }

    // Prefer full movie direct stream (e.g. Internet Archive)
    const directFull = this.sources.find((s) => s.playbackType === 'direct' && s.category === 'full_movie');
    if (directFull) {
      this.setSource(directFull);
      return;
    }

    // Next prefer full movie embed
    const embedFull = this.sources.find((s) => ['youtube_embed', 'vimeo_embed'].includes(s.playbackType) && s.category === 'full_movie');
    if (embedFull) {
      this.setSource(embedFull);
      return;
    }

    // Default to first available source
    this.setSource(this.sources[0]);
  }

  setSource(source: MovieSource): void {
    this.activeSource = source;
    if (source.playbackType === 'direct') {
      this.safeEmbedUrl = null;
      // HTML5 video will load via src binding
    } else if (source.embedUrl) {
      this.safeEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(source.embedUrl);
    } else if (source.playbackType === 'youtube_embed') {
      this.safeEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.youtube-nocookie.com/embed/${source.sourceId}?autoplay=1&rel=0`
      );
    }
  }

  resumePlayback(): void {
    this.showResumeBanner = false;
    if (this.videoPlayerRef && this.savedResumePosition > 0) {
      const vid = this.videoPlayerRef.nativeElement;
      vid.currentTime = this.savedResumePosition;
      vid.play().catch(() => {});
    }
  }

  dismissResume(): void {
    this.showResumeBanner = false;
  }

  // Video Event Handlers
  onTimeUpdate(): void {
    if (this.videoPlayerRef) {
      this.currentTime = this.videoPlayerRef.nativeElement.currentTime;
    }
  }

  onLoadedMetadata(): void {
    if (this.videoPlayerRef) {
      this.duration = this.videoPlayerRef.nativeElement.duration || 0;
      if (this.savedResumePosition > 0 && !this.resumePromptShown) {
        // Auto-scroll to position if desired or let user click resume
        this.resumePromptShown = true;
      }
    }
  }

  onVideoPlay(): void {
    this.isPlaying = true;
  }

  onVideoPause(): void {
    this.isPlaying = false;
    this.saveCurrentProgress();
  }

  onVideoEnded(): void {
    this.isPlaying = false;
    if (this.movie) {
      this.historyService.saveProgress({
        movieId: this.movie.id,
        movieTitle: this.movie.title,
        posterUrl: this.movie.posterUrl,
        backdropUrl: this.movie.backdropUrl,
        playbackPosition: this.duration,
        duration: this.duration,
        lastWatchedTime: new Date().toISOString(),
        completed: true,
      });
    }
  }

  togglePlay(): void {
    if (!this.videoPlayerRef) return;
    const vid = this.videoPlayerRef.nativeElement;
    if (vid.paused) {
      vid.play().catch((err) => console.warn('Play interrupted:', err));
    } else {
      vid.pause();
    }
  }

  seek(event: Event): void {
    const input = event.target as HTMLInputElement;
    const time = parseFloat(input.value);
    if (this.videoPlayerRef) {
      this.videoPlayerRef.nativeElement.currentTime = time;
      this.currentTime = time;
    }
  }

  setVolume(event: Event): void {
    const input = event.target as HTMLInputElement;
    const vol = parseFloat(input.value);
    this.volume = vol;
    if (this.videoPlayerRef) {
      this.videoPlayerRef.nativeElement.volume = vol;
      this.isMuted = vol === 0;
    }
  }

  toggleMute(): void {
    if (!this.videoPlayerRef) return;
    const vid = this.videoPlayerRef.nativeElement;
    vid.muted = !vid.muted;
    this.isMuted = vid.muted;
  }

  setPlaybackRate(rate: number): void {
    this.playbackRate = rate;
    if (this.videoPlayerRef) {
      this.videoPlayerRef.nativeElement.playbackRate = rate;
    }
  }

  toggleFullscreen(): void {
    const container = this.playerContainerRef?.nativeElement;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        this.isFullscreen = true;
      }).catch((err) => console.warn('Fullscreen error:', err));
    } else {
      document.exitFullscreen().then(() => {
        this.isFullscreen = false;
      }).catch((err) => console.warn('Exit fullscreen error:', err));
    }
  }

  skip(seconds: number): void {
    if (!this.videoPlayerRef) return;
    const vid = this.videoPlayerRef.nativeElement;
    vid.currentTime = Math.max(0, Math.min(vid.duration, vid.currentTime + seconds));
  }

  onMouseMove(): void {
    this.showControls = true;
    if (this.controlsTimeout) {
      clearTimeout(this.controlsTimeout);
    }
    this.controlsTimeout = setTimeout(() => {
      if (this.isPlaying) {
        this.showControls = false;
      }
    }, 3000);
  }

  saveCurrentProgress(): void {
    if (!this.movie || this.currentTime <= 0) return;
    this.historyService.saveProgress({
      movieId: this.movie.id,
      movieTitle: this.movie.title,
      posterUrl: this.movie.posterUrl,
      backdropUrl: this.movie.backdropUrl,
      playbackPosition: Math.floor(this.currentTime),
      duration: Math.floor(this.duration),
      lastWatchedTime: new Date().toISOString(),
      completed: this.duration > 0 && this.currentTime >= this.duration * 0.95,
      sourceTitle: this.activeSource?.title,
      sourceProvider: this.activeSource?.provider,
      playbackType: this.activeSource?.playbackType,
    });
  }

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const formattedSecs = secs < 10 ? `0${secs}` : `${secs}`;
    if (hrs > 0) {
      const formattedMins = mins < 10 ? `0${mins}` : `${mins}`;
      return `${hrs}:${formattedMins}:${formattedSecs}`;
    }
    return `${mins}:${formattedSecs}`;
  }

  goBack(): void {
    if (this.movie) {
      this.router.navigate(['/movie', this.movie.slug || this.movie.id]);
    } else {
      this.location.back();
    }
  }
}
