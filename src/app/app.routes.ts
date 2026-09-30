import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LatestComponent } from './pages/latest/latest.component';
import { TrendingComponent } from './pages/trending/trending.component';
import { PopularComponent } from './pages/popular/popular.component';
import { TopRatedComponent } from './pages/top-rated/top-rated.component';
import { NowPlayingComponent } from './pages/now-playing/now-playing.component';
import { UpcomingComponent } from './pages/upcoming/upcoming.component';
import { FreeMoviesComponent } from './pages/free-movies/free-movies.component';
import { GenreMoviesComponent } from './pages/genre-movies/genre-movies.component';
import { SearchComponent } from './pages/search/search.component';
import { MovieDetailComponent } from './pages/movie-detail/movie-detail.component';
import { WatchComponent } from './pages/watch/watch.component';
import { FavoritesComponent } from './pages/favorites/favorites.component';
import { HistoryComponent } from './pages/history/history.component';
import { AdminComponent } from './pages/admin/admin.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Movie Explorer — Discover & Stream Movies Legally' },
  { path: 'latest', component: LatestComponent, title: 'Latest Releases — Movie Explorer' },
  { path: 'trending', component: TrendingComponent, title: 'Trending Movies — Movie Explorer' },
  { path: 'popular', component: PopularComponent, title: 'Popular Movies — Movie Explorer' },
  { path: 'top-rated', component: TopRatedComponent, title: 'Top Rated Movies — Movie Explorer' },
  { path: 'now-playing', component: NowPlayingComponent, title: 'Now Playing in Theaters — Movie Explorer' },
  { path: 'upcoming', component: UpcomingComponent, title: 'Upcoming Movies — Movie Explorer' },
  { path: 'free-movies', component: FreeMoviesComponent, title: 'Free Legal Streams — Movie Explorer' },
  { path: 'genres/:genre', component: GenreMoviesComponent, title: 'Browse by Genre — Movie Explorer' },
  { path: 'search', component: SearchComponent, title: 'Search Movies & TV — Movie Explorer' },
  { path: 'movie/:id', component: MovieDetailComponent, title: 'Movie Details — Movie Explorer' },
  { path: 'watch/:id', component: WatchComponent, title: 'Watch Stream — Movie Explorer' },
  { path: 'favorites', component: FavoritesComponent, title: 'My Watchlist — Movie Explorer' },
  { path: 'history', component: HistoryComponent, title: 'Watch History — Movie Explorer' },
  { path: 'portal/ops/internal/gateway', component: AdminComponent, title: 'System Portal — Movie Explorer' },
  { path: 'portal/ops/internal/login', redirectTo: 'portal/ops/internal/gateway', pathMatch: 'full' },
  { path: 'admin', redirectTo: 'portal/ops/internal/gateway', pathMatch: 'full' },
  { path: '**', redirectTo: '' },
];
