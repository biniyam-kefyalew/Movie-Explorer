import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MovieCardComponent } from '../../components/movie-card/movie-card.component';
import { MovieApiService } from '../../services/movie-api.service';
import { MoviePreview } from '../../models/movie.model';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, MovieCardComponent],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css'],
})
export class SearchComponent implements OnInit {
  private movieApi = inject(MovieApiService);
  private route = inject(ActivatedRoute);

  query = '';
  activeTab: 'all' | 'movie' | 'tv' | 'person' = 'all';
  allItems: any[] = [];
  page = 1;
  totalPages = 1;
  totalResults = 0;
  isLoading = false;
  isLoadingMore = false;

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const q = params['q'] || params['query'] || '';
      if (q && q !== this.query) {
        this.query = q;
        this.executeSearch(q, 1, false);
      }
    });
  }

  executeSearch(query: string, page = 1, append = false): void {
    if (!query.trim()) return;

    if (append) this.isLoadingMore = true;
    else this.isLoading = true;

    this.movieApi.search(query.trim(), page).subscribe({
      next: (res) => {
        this.page = res.page;
        this.totalPages = res.totalPages;
        this.totalResults = res.totalResults;
        this.allItems = append ? [...this.allItems, ...res.results] : res.results;
        this.isLoading = false;
        this.isLoadingMore = false;
      },
      error: () => {
        this.isLoading = false;
        this.isLoadingMore = false;
      },
    });
  }

  loadMore(): void {
    if (this.page < this.totalPages && !this.isLoadingMore) {
      this.executeSearch(this.query, this.page + 1, true);
    }
  }

  setTab(tab: 'all' | 'movie' | 'tv' | 'person'): void {
    this.activeTab = tab;
  }

  get filteredItems(): any[] {
    if (this.activeTab === 'all') return this.allItems;
    return this.allItems.filter((item) => (item.type || 'movie') === this.activeTab);
  }

  get moviesList(): MoviePreview[] {
    return this.filteredItems.filter((i) => i.type !== 'person');
  }

  get peopleList(): any[] {
    return this.filteredItems.filter((i) => i.type === 'person');
  }
}
