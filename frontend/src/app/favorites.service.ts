import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {

  private apiUrl = `${environment.apiUrl}/favorites`;

  constructor(private http: HttpClient) { }

  private getAuthHeaders() : HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`)

  }

  addFavorite(movieId: number): Observable<any> {  
    return this.http.post<any>(`${this.apiUrl}/${movieId}/add`, {}, { headers: this.getAuthHeaders() }).pipe(
      tap(response => {
        if (response.message) {
          console.log(response.message);
        }
      })
    );
  }
  
  removeFavorite(movieId: number): Observable<any> {
      return this.http.delete<any>(`${this.apiUrl}/${movieId}/delete`, { headers: this.getAuthHeaders() }).pipe(
      tap(response => {
        if (response.message) {
          console.log(response.message);
        }
      }),
    );
  }
  getFavorites(nickname?: string): Observable<any[]> {
    let url = `${this.apiUrl}/favorites`;
  
    if (nickname) {
        url += `/${nickname}`;
        console.log('Fetching from URL:', url);
    }
  
    return this.http.get<any[]>(url, { headers: this.getAuthHeaders() }).pipe(
        catchError(error => {
            console.error('Error during favorites retrieval:', error);
            return throwError(error);
        })
    );
  }
  



  
  
  
  

}