import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminService, AdminCreateSourcePayload } from '../../services/admin.service';
import { AdminAuthService } from '../../services/admin-auth.service';
import { MovieSource } from '../../models/movie.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit {
  private adminService = inject(AdminService);
  adminAuth = inject(AdminAuthService);

  sources: MovieSource[] = [];
  isLoading = false;
  isSubmitting = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  showAddForm = false;

  // Login form state
  loginUsername = 'admin';
  loginPassword = '';
  isLoggingIn = false;
  loginError: string | null = null;

  formData: AdminCreateSourcePayload = {
    tmdbId: 10331,
    title: '',
    year: new Date().getFullYear(),
    sourceProvider: 'internet_archive',
    playbackType: 'direct',
    category: 'full_movie',
    playbackUrl: '',
    embedUrl: '',
    quality: '720p',
    license: 'Public Domain',
    attribution: 'Internet Archive',
    approved: true,
  };

  ngOnInit(): void {
    if (this.isAuthenticated) {
      this.loadSources();
    }
  }

  get isAuthenticated(): boolean {
    return this.adminAuth.isAuthenticated();
  }

  get currentAdminUser(): { username: string; role: string } | null {
    return this.adminAuth.getCurrentUser();
  }

  onLogin(): void {
    if (!this.loginUsername || !this.loginPassword) {
      this.loginError = 'Please enter both username and password.';
      return;
    }

    this.isLoggingIn = true;
    this.loginError = null;

    this.adminAuth.login(this.loginUsername, this.loginPassword).subscribe({
      next: () => {
        this.isLoggingIn = false;
        this.loginPassword = '';
        this.loadSources();
      },
      error: (err) => {
        this.isLoggingIn = false;
        this.loginError =
          err.error?.message || err.error?.error || 'Invalid username or password. Access denied.';
      },
    });
  }

  onLogout(): void {
    this.adminAuth.logout();
    this.sources = [];
    this.showAddForm = false;
    this.successMessage = null;
    this.errorMessage = null;
  }

  loadSources(): void {
    this.isLoading = true;
    this.adminService.getSources().subscribe({
      next: (list) => {
        this.sources = list;
        this.isLoading = false;
      },
      error: (err) => {
        if (err.status === 401) {
          this.adminAuth.logout();
          this.loginError = 'Session expired. Please log in again.';
        } else {
          this.errorMessage = 'Failed to load sources from admin API.';
        }
        this.isLoading = false;
        console.error(err);
      },
    });
  }

  toggleApproval(source: MovieSource): void {
    const updatedStatus = !source.approved;
    this.adminService.setApproval(source.id, updatedStatus).subscribe({
      next: (updated) => {
        source.approved = updated.approved;
        source.verifiedAt = updated.verifiedAt;
        this.showMessage('Source approval status updated.');
      },
      error: (err) => {
        if (err.status === 401) {
          this.adminAuth.logout();
        } else {
          this.showError('Failed to update source approval.');
        }
      },
    });
  }

  deleteSource(id: string): void {
    if (!confirm('Are you sure you want to remove this source?')) return;
    this.adminService.deleteSource(id).subscribe({
      next: () => {
        this.sources = this.sources.filter((s) => s.id !== id);
        this.showMessage('Source successfully deleted.');
      },
      error: (err) => {
        if (err.status === 401) {
          this.adminAuth.logout();
        } else {
          this.showError('Failed to delete source.');
        }
      },
    });
  }

  submitNewSource(): void {
    if (!this.formData.title || !this.formData.playbackUrl || !this.formData.tmdbId) {
      this.showError('Title, TMDB ID, and Playback URL are required.');
      return;
    }

    this.isSubmitting = true;
    this.adminService.addSource(this.formData).subscribe({
      next: (created) => {
        this.sources.unshift(created);
        this.isSubmitting = false;
        this.showAddForm = false;
        this.showMessage('New legal source added and verified.');
        this.resetForm();
      },
      error: (err) => {
        this.isSubmitting = false;
        if (err.status === 401) {
          this.adminAuth.logout();
        } else {
          this.showError(err.error?.error || 'Failed to add source. Ensure URL is valid and safe.');
        }
      },
    });
  }

  resetForm(): void {
    this.formData = {
      tmdbId: 10331,
      title: '',
      year: new Date().getFullYear(),
      sourceProvider: 'internet_archive',
      playbackType: 'direct',
      category: 'full_movie',
      playbackUrl: '',
      embedUrl: '',
      quality: '720p',
      license: 'Public Domain',
      attribution: 'Internet Archive',
      approved: true,
    };
  }

  private showMessage(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => (this.successMessage = null), 4000);
  }

  private showError(msg: string): void {
    this.errorMessage = msg;
    setTimeout(() => (this.errorMessage = null), 4000);
  }
}
