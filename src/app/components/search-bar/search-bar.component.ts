import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-bar.component.html',
})
export class SearchBarComponent {
  searchQuery = '';

  constructor(private router: Router) {}

  onSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/search'], {
        queryParams: { query: this.searchQuery },
      });
    }
  }
}
