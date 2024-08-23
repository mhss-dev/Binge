import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/api';

  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(private http: HttpClient) {
    this.checkLoginStatus();
  }

  checkLoginStatus(): void {
    this.getProfil().subscribe({
      next: () => this.setLoggedIn(true),
      error: () => this.setLoggedIn(false)
    });
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, { username, password }, { observe: 'response', withCredentials: true })
      .pipe(
        tap(() => this.setLoggedIn(true)),
        catchError(() => {
          this.setLoggedIn(false);
          return throwError(() => new Error('Login failed'));
        })
      );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/logout`, {}, { observe: 'response', withCredentials: true })
      .pipe(
        tap(() => this.setLoggedIn(false)),
        catchError(error => {
          console.error('Logout error:', error);
          return throwError(() => new Error('Logout failed'));
        })
      );
  }

  getProfil(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/auth/profil`, { withCredentials: true });
  }

  register(username: string, password: string, nickname: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, { username, password, nickname }, { observe: 'response' });
  }
  private setLoggedIn(status: boolean): void {
    this.isLoggedInSubject.next(status);
  }
}
