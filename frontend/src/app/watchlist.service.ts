import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WatchlistService {

  private apiUrl = `${environment.apiUrl}/watchlist`;

  constructor(private http: HttpClient) { }


  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  addWatchlist(movieId: number): Observable<any> {  
    return this.http.post<any>(`${this.apiUrl}/${movieId}/add`, {}, { headers: this.getAuthHeaders() }).pipe(
      tap(response => {

        if (response.message) {
          console.log(response.message);
        }
      })
    );
  }

  removeFromWatchlist(movieId: number): Observable<any> {
  
    return this.http.delete<any>(`${this.apiUrl}/${movieId}/delete`, { headers: this.getAuthHeaders() }).pipe(
      tap(response => {
       if (response.message) {
          console.log(response.message);
        }
      }),
    );
  }

  getWatchlist(nickname?: string): Observable<any[]> {
    let url = this.apiUrl;
    
    if (nickname) {
      url += `?nickname=${nickname}`; 
    }
  
    return this.http.get<any[]>(url, { headers: this.getAuthHeaders() }).pipe(
      catchError(error => {
        console.error(error);
        return throwError(error);
      })
    );
  }
}
