import { Component, OnInit, OnDestroy, ElementRef, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, Subscription, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { MovieApiService } from '../../services/movie-api.service';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.css'],
})
export class SearchBarComponent implements OnInit, OnDestroy {
  searchQuery = '';
  isDropdownOpen = false;
  isLoading = false;
  suggestions: any[] = [];

  private searchSubject = new Subject<string>();
  private sub!: Subscription;
  private router = inject(Router);
  private movieApi = inject(MovieApiService);
  private elementRef = inject(ElementRef);

  ngOnInit(): void {
    this.sub = this.searchSubject
      .pipe(
        debounceTime(280),
        distinctUntilChanged(),
        switchMap((query) => {
          if (!query || query.trim().length < 2) {
            this.isLoading = false;
            return of({ results: [] });
          }
          this.isLoading = true;
          return this.movieApi.search(query.trim(), 1).pipe(
            catchError(() => {
              this.isLoading = false;
              return of({ results: [] });
            })
          );
        })
      )
      .subscribe((res: any) => {
        this.isLoading = false;
        this.suggestions = (res?.results || []).slice(0, 6);
        this.isDropdownOpen = this.suggestions.length > 0 && this.searchQuery.trim().length >= 2;
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery = val;
    this.searchSubject.next(val);
  }

  onSearch(): void {
    const q = this.searchQuery.trim();
    if (q) {
      this.closeDropdown();
      this.router.navigate(['/search'], { queryParams: { q } });
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.suggestions = [];
    this.isDropdownOpen = false;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  selectItem(item: any): void {
    this.closeDropdown();
    if (item.type === 'person') {
      this.router.navigate(['/search'], { queryParams: { q: item.title } });
    } else {
      this.router.navigate(['/movie', item.slug || item.id]);
    }
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    this.closeDropdown();
  }
}
