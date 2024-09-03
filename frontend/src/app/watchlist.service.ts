import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WatchlistService {

  private apiUrl = `https://backend-binge.onrender.com/api/watchlist`;

  constructor(private http: HttpClient) { }

  addWatchlist(movieId: number): Observable<any> {  
    return this.http.post<any>(`${this.apiUrl}/${movieId}/add`, {}, { withCredentials: true }).pipe(
      tap(response => {

        if (response.message) {
          console.log(response.message);
        }
      })
    );
  }

  removeFromWatchlist(movieId: number): Observable<any> {
  
    return this.http.delete<any>(`${this.apiUrl}/${movieId}/delete`, { withCredentials: true }).pipe(
      tap(response => {
       if (response.message) {
          console.log(response.message);
        }
      }),
    );
  }

  getWatchlist(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}`, { withCredentials: true }).pipe(
      catchError(error => {
        console.error(error);
        return throwError(error);
      })
    );
  }
}
