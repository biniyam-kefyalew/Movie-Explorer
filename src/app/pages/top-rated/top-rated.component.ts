import { Component, OnInit } from '@angular/core';
import { MovieCardComponent } from '../../components/movie-card/movie-card.component';
import { CommonModule } from '@angular/common';
import { Movie } from '../../models/movie.model';
import { MovieApiService } from '../../services/movie-api.service';

@Component({
  selector: 'app-top-rated',
  imports: [MovieCardComponent, CommonModule],
  templateUrl: './top-rated.component.html',
  styleUrl: './top-rated.component.css',
})
export class TopRatedComponent implements OnInit {
  movies: Movie[] = [];
  constructor(private movieService: MovieApiService) {}
  ngOnInit(): void {
    this.loadTopRatedMovies();
  }
  loadTopRatedMovies(): void {
    this.movieService.getTopRatedMovies().subscribe((movies) => {
      this.movies = movies || [];
    });
  }
}
