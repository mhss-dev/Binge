import { CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private http: HttpClient) {}
  private apiUrl = `${environment.apiUrl}`;

  
  canActivate(): Observable<boolean> {
    const token = localStorage.getItem('token');

    if (!token) {
      this.router.navigate(['/login']);
      return of(false);
    }
  
    if (this.isTokenExpired(token)) {
      localStorage.removeItem('token');
      this.router.navigate(['/login']);
      return of(false);
    }
  
    return this.http.get(`${this.apiUrl}/auth/validate-token`, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
      map(() => {
        return true;
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 403 || error.status === 401) {
          localStorage.removeItem('token');
          this.router.navigate(['/login']);
        }
        return of(false);
      })
    );
  }
  
  private isTokenExpired(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return true;
      }
  
      const payloadPart = parts[1];
      const payload = JSON.parse(atob(payloadPart));
  
      const currentTime = Math.floor(new Date().getTime() / 1000);
  
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }
  
  
  
  
  
  
  
}  