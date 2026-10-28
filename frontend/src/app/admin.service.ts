import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface AdminUser {
  id: number;
  nickname: string;
  username: string;
  avatar_url: string | null;
  watched: number;
  favorites: number;
  reset_pending: boolean;
  is_admin: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private adminUrl = `${environment.apiUrl}/admin`;
  private resetUrl = `${environment.apiUrl}/password-reset`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('token')}`);
  }

  isAdmin(): Observable<{ admin: boolean }> {
    return this.http.get<{ admin: boolean }>(`${this.adminUrl}/me`, { headers: this.getAuthHeaders() });
  }

  getUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.adminUrl}/users`, { headers: this.getAuthHeaders() });
  }

  createResetLink(userId: number): Observable<{ link: string; nickname: string; expires_at: string }> {
    return this.http.post<{ link: string; nickname: string; expires_at: string }>(`${this.adminUrl}/users/${userId}/reset-link`, {}, { headers: this.getAuthHeaders() });
  }

  deleteUser(userId: number, confirm: string): Observable<{ deleted: string }> {
    return this.http.delete<{ deleted: string }>(`${this.adminUrl}/users/${userId}`, { headers: this.getAuthHeaders(), body: { confirm } });
  }

  checkResetToken(token: string): Observable<{ nickname: string; username: string }> {
    return this.http.post<{ nickname: string; username: string }>(`${this.resetUrl}/check`, { token });
  }

  resetPassword(token: string, password: string): Observable<{ nickname: string }> {
    return this.http.post<{ nickname: string }>(this.resetUrl, { token, password });
  }
}
