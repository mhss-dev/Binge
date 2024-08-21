import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {

  private apiUrl = 'http://localhost:3000/api/favorites';

  constructor(private http: HttpClient) { }

  addFavorite(movieId: number): Observable<any> {  
    return this.http.post<any>(`${this.apiUrl}/${movieId}/add`, {}, { withCredentials: true }).pipe(
      tap(response => {
        if (response.message) {
          console.log(response.message);
        }
      })
    );
  }
  
  removeFavorite(movieId: number): Observable<any> {
      return this.http.delete<any>(`${this.apiUrl}/${movieId}/delete`, { withCredentials: true }).pipe(
      tap(response => {
        if (response.message) {
          console.log(response.message);
        }
      }),
    );
  }
  getFavorites(): Observable<any[]> {
    
    return this.http.get<any[]>(`${this.apiUrl}`, { withCredentials: true }).pipe(
      catchError(error => {
        console.error(error);
        return throwError(error);
      })
    );
  }

}