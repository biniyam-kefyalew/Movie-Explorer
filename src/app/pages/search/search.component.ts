import { Component, OnInit } from '@angular/core';
import { MovieCardComponent } from '../../components/movie-card/movie-card.component';
import { Movie } from '../../models/movie.model';
import { MovieApiService } from '../../services/movie-api.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-search',
  imports: [MovieCardComponent, CommonModule],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css',
})
export class SearchComponent implements OnInit {
  movies: Movie[] = [];

  constructor(
    private movieService: MovieApiService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // ✅ Listen for query parameter changes
    this.route.queryParams.subscribe((params) => {
      const searchQuery = params['query']; // Get search query from URL
      if (searchQuery) {
        this.handleSearch(searchQuery);
      }
    });
  }

  // ✅ Handle Search
  handleSearch(query: string) {
    this.movieService.searchMovies(query).subscribe((response) => {
      this.movies = response.results || [];
    });
  }
}
