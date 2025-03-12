import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Movie } from '../../models/movie.model';
import { MovieApiService } from '../../services/movie-api.service';
import { MovieCardComponent } from '../../components/movie-card/movie-card.component';

@Component({
  selector: 'app-latest',
  standalone: true,
  imports: [CommonModule, MovieCardComponent],
  templateUrl: './latest.component.html',
  styleUrls: ['./latest.component.css'],
})
export class LatestComponent implements OnInit {
  movies: Movie[] = [];

  constructor(private movieService: MovieApiService) {}

  ngOnInit(): void {
    this.loadLatestMovies();
  }

  loadLatestMovies(): void {
    this.movieService.getLatestMovies().subscribe((movies) => {
      this.movies = movies || []; // ✅ `movies` is already an array, no need for `.results`
    });
  }
}
