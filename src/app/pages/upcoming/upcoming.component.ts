import { Component, OnInit } from '@angular/core';
import { Movie } from '../../models/movie.model';
import { MovieApiService } from '../../services/movie-api.service';
import { MovieCardComponent } from '../../components/movie-card/movie-card.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-upcoming',
  imports: [MovieCardComponent, CommonModule],
  templateUrl: './upcoming.component.html',
  styleUrl: './upcoming.component.css',
})
export class UpcomingComponent implements OnInit {
  movies: Movie[] = [];
  constructor(private movieService: MovieApiService) {}
  ngOnInit(): void {
    this.loadUpcomingMovies();
  }
  loadUpcomingMovies(): void {
    this.movieService.getUpcomingMovies().subscribe((movies) => {
      this.movies = movies || [];
    });
  }
}
