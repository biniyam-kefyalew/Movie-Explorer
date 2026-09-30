import { TestBed } from '@angular/core';
import { FavoritesService } from './favorites.service';

describe('FavoritesService', () => {
  let service: FavoritesService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(FavoritesService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should add, toggle, and check favorites', () => {
    const mockMovie: any = {
      id: 19,
      title: 'Metropolis',
      year: 1927,
      rating: 8.2,
      posterUrl: 'https://example.com/poster.jpg',
    };

    expect(service.isFavorite(19)).toBeFalse();

    service.addFavorite(mockMovie);
    expect(service.isFavorite(19)).toBeTrue();
    expect(service.getFavorites().length).toBe(1);

    // Toggle off
    const stillFav = service.toggleFavorite(mockMovie);
    expect(stillFav).toBeFalse();
    expect(service.isFavorite(19)).toBeFalse();
  });
});
