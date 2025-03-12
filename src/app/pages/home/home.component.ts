import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroSectionComponent } from '../../components/hero-section/hero-section.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { FeaturesSectionComponent } from '../../components/features-section/features-section.component';
import { TrendingMoviesComponent } from '../../components/trending-movies/trending-movies.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    HeroSectionComponent,
    FooterComponent,
    FeaturesSectionComponent,
    TrendingMoviesComponent,
  ],
  templateUrl: './home.component.html',
})
export class HomeComponent {}
