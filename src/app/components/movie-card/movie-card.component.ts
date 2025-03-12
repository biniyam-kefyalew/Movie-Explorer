import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // ✅ Import RouterModule
import { Movie } from '../../models/movie.model';

@Component({
  selector: 'app-movie-card',
  standalone: true,
  imports: [CommonModule, RouterModule], // ✅ Include RouterModule
  templateUrl: './movie-card.component.html',
})
export class MovieCardComponent {
  @Input() movie!: Movie; // ✅ Use Movie interface instead of 'any'
}
