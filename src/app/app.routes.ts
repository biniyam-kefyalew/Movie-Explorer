// import { Routes } from '@angular/router';

// export const routes: Routes = [
//   {
//     path: '',
//     loadComponent: () =>
//       import('./pages/home/home.component').then((m) => m.HomeComponent),
//   },
//   {
//     path: 'movie/:id',
//     loadComponent: () =>
//       import('./pages/movie-detail/movie-detail.component').then(
//         (m) => m.MovieDetailComponent
//       ),
//   },
// ];
import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { MovieDetailComponent } from './pages/movie-detail/movie-detail.component';
import { LatestComponent } from './pages/latest/latest.component';
import { PopularComponent } from './pages/popular/popular.component';
import { UpcomingComponent } from './pages/upcoming/upcoming.component';
import { TopRatedComponent } from './pages/top-rated/top-rated.component';
import { SearchComponent } from './pages/search/search.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'search', component: SearchComponent },
  { path: 'movie/:id', component: MovieDetailComponent },
  { path: 'latest', component: LatestComponent },
  { path: 'popular', component: PopularComponent },
  { path: 'top-rated', component: TopRatedComponent },
  { path: 'upcoming', component: UpcomingComponent },
];
