import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface AdminAuthResponse {
  success: boolean;
  token: string;
  user: {
    username: string;
    role: string;
  };
  expiresIn: number;
}

const TOKEN_KEY = 'movie_explorer_admin_token';
const USER_KEY = 'movie_explorer_admin_user';

@Injectable({
  providedIn: 'root',
})
export class AdminAuthService {
  private http = inject(HttpClient);
  private tokenSubject = new BehaviorSubject<string | null>(this.getStoredToken());
  public token$ = this.tokenSubject.asObservable();

  login(username: string, password: string): Observable<AdminAuthResponse> {
    return this.http.post<AdminAuthResponse>('/api/admin/login', { username, password }).pipe(
      tap((res) => {
        if (res && res.token) {
          this.setSession(res.token, res.user);
        }
      })
    );
  }

  logout(): void {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (err) {
      console.warn('Error clearing admin session storage', err);
    }
    this.tokenSubject.next(null);
  }

  getToken(): string | null {
    return this.tokenSubject.getValue();
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const parts = token.split('.');
      if (parts.length === 2) {
        const payload = JSON.parse(atob(parts[0]));
        if (payload.exp && Date.now() > payload.exp) {
          this.logout();
          return false;
        }
      }
    } catch {
      // If parsing fails, allow server verification to decide
    }

    return true;
  }

  getCurrentUser(): { username: string; role: string } | null {
    try {
      const stored = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private setSession(token: string, user: { username: string; role: string }): void {
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
      sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (err) {
      console.warn('Error storing admin session', err);
    }
    this.tokenSubject.next(token);
  }

  private getStoredToken(): string | null {
    try {
      return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || null;
    } catch {
      return null;
    }
  }
}
