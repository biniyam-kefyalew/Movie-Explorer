import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrendingMoviesComponent } from './trending-movies.component';

describe('TrendingMoviesComponent', () => {
  let component: TrendingMoviesComponent;
  let fixture: ComponentFixture<TrendingMoviesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrendingMoviesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrendingMoviesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
