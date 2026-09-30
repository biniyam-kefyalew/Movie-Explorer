import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MovieSource, SourceCategory, SourceProvider, PlaybackType } from '../models/movie.model';
import { AdminAuthService } from './admin-auth.service';

export interface AdminCreateSourcePayload {
  tmdbId: number;
  title: string;
  year?: number;
  sourceProvider: SourceProvider | string;
  playbackType: PlaybackType | string;
  category: SourceCategory | string;
  playbackUrl: string;
  embedUrl?: string;
  quality?: string;
  license?: string;
  attribution?: string;
  approved?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private http = inject(HttpClient);
  private authService = inject(AdminAuthService);
  private apiUrl = '/api/admin';

  private getAuthHeaders(): { headers: HttpHeaders } {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
    });
    return { headers };
  }

  getSources(): Observable<MovieSource[]> {
    return this.http.get<MovieSource[]>(`${this.apiUrl}/sources`, this.getAuthHeaders());
  }

  setApproval(id: string, approved: boolean): Observable<MovieSource> {
    return this.http.patch<MovieSource>(
      `${this.apiUrl}/sources/${id}/approve`,
      { approved },
      this.getAuthHeaders()
    );
  }

  deleteSource(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(
      `${this.apiUrl}/sources/${id}`,
      this.getAuthHeaders()
    );
  }

  addSource(payload: AdminCreateSourcePayload): Observable<MovieSource> {
    return this.http.post<MovieSource>(
      `${this.apiUrl}/sources`,
      payload,
      this.getAuthHeaders()
    );
  }
}
