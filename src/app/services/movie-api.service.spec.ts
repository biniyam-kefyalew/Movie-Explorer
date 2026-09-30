import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MovieApiService } from './movie-api.service';

describe('MovieApiService', () => {
  let service: MovieApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MovieApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch latest movies with page parameter', () => {
    service.getLatest(2).subscribe((res) => {
      expect(res.page).toBe(2);
      expect(res.results.length).toBe(1);
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/movies/latest') && r.params.get('page') === '2');
    expect(req.request.method).toBe('GET');
    req.flush({ page: 2, totalPages: 10, totalResults: 100, results: [{ id: 1, title: 'Test Movie' }] });
  });

  it('should fetch search results for query', () => {
    service.search('batman', 1).subscribe((res) => {
      expect(res.results.length).toBe(1);
      expect(res.results[0].title).toBe('Batman Begins');
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/movies/search') && r.params.get('q') === 'batman');
    expect(req.request.method).toBe('GET');
    req.flush({ page: 1, totalPages: 1, totalResults: 1, results: [{ id: 272, title: 'Batman Begins' }] });
  });

  it('should fetch movie details and resolved sources', () => {
    service.getMovieDetails(10331).subscribe((movie) => {
      expect(movie.title).toBe('Night of the Living Dead');
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/movies/10331'));
    expect(req.request.method).toBe('GET');
    req.flush({ id: 10331, tmdbId: 10331, title: 'Night of the Living Dead', freePlayable: true });
  });
});
