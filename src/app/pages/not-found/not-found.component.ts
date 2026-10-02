import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.css'],
})
export class NotFoundComponent {
  private router = inject(Router);
  searchQuery = '';

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/search'], {
        queryParams: { q: this.searchQuery.trim() },
      });
    }
  }
}
