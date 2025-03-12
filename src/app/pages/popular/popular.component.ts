import { Component, OnInit } from '@angular/core';
import { Movie } from '../../models/movie.model';
import { MovieApiService } from '../../services/movie-api.service';
import { MovieCardComponent } from '../../components/movie-card/movie-card.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-popular',
  imports: [MovieCardComponent, CommonModule],
  templateUrl: './popular.component.html',
  styleUrl: './popular.component.css',
})
export class PopularComponent implements OnInit {
  movies: Movie[] = [];
  constructor(private movieService: MovieApiService) {}
  ngOnInit(): void {
    this.loadPopularMovies();
  }
  loadPopularMovies(): void {
    this.movieService.getPopularMovies().subscribe((movies) => {
      this.movies = movies || [];
    });
  }
}
