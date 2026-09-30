import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MovieCardComponent } from '../movie-card/movie-card.component';
import { MoviePreview } from '../../models/movie.model';

@Component({
  selector: 'app-movie-slider',
  standalone: true,
  imports: [CommonModule, RouterModule, MovieCardComponent],
  templateUrl: './movie-slider.component.html',
  styleUrls: ['./movie-slider.component.css'],
})
export class MovieSliderComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() viewAllLink = '';
  @Input() movies: MoviePreview[] = [];
  @Input() loading = false;
  @Input() icon = '🔥';

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  scrollLeft(): void {
    if (this.scrollContainer) {
      this.scrollContainer.nativeElement.scrollBy({ left: -600, behavior: 'smooth' });
    }
  }

  scrollRight(): void {
    if (this.scrollContainer) {
      this.scrollContainer.nativeElement.scrollBy({ left: 600, behavior: 'smooth' });
    }
  }
}
