import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FavoritesService } from '../../services/favorites.service';
import { FavoriteItem } from '../../models/movie.model';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.css'],
})
export class FavoritesComponent implements OnInit {
  favoritesService = inject(FavoritesService);
  favorites: FavoriteItem[] = [];

  ngOnInit(): void {
    this.favoritesService.favorites$.subscribe((list) => {
      this.favorites = list;
    });
  }

  remove(id: number, event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.favoritesService.removeFavorite(id);
  }

  clearAll(): void {
    if (confirm('Are you sure you want to clear your entire watchlist?')) {
      this.favoritesService.clearFavorites();
    }
  }
}
