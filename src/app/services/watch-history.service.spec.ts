import { TestBed } from '@angular/core/testing';
import { WatchHistoryService } from './watch-history.service';

describe('WatchHistoryService', () => {
  let service: WatchHistoryService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(WatchHistoryService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created and start empty', () => {
    expect(service).toBeTruthy();
    expect(service.getHistory().length).toBe(0);
  });

  it('should save and update progress for a movie', () => {
    service.saveProgress({
      movieId: 10331,
      movieTitle: 'Night of the Living Dead',
      playbackPosition: 120,
      duration: 5400,
      lastWatchedTime: new Date().toISOString(),
      completed: false,
    });

    const items = service.getHistory();
    expect(items.length).toBe(1);
    expect(items[0].playbackPosition).toBe(120);

    // Continue watching includes in-progress items
    const continueList = service.getContinueWatching();
    expect(continueList.length).toBe(1);
  });

  it('should remove item from history', () => {
    service.saveProgress({
      movieId: 10331,
      movieTitle: 'Night of the Living Dead',
      playbackPosition: 120,
      duration: 5400,
      lastWatchedTime: new Date().toISOString(),
      completed: false,
    });
    service.removeFromHistory(10331);
    expect(service.getHistory().length).toBe(0);
  });
});
