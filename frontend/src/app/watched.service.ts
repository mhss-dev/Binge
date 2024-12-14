import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, of, tap, throwError } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WatchedService {

  private apiUrl = `${environment.apiUrl}/watched`;
  
  
  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }
  
  
  addWatched(movieId: number): Observable<any> {  
    return this.http.post<any>(`${this.apiUrl}/${movieId}/add`, {}, { headers: this.getAuthHeaders() }).pipe(
      tap(response => {

        if (response.message) {
          console.log(response.message);
        }
      })
    );
  }

  
  removeWatched(movieId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${movieId}/delete`, { headers: this.getAuthHeaders() }).pipe(
      tap(response => {
        console.log(response);
        if (response.message) {
          console.log(response.message);
        }
      }),
      catchError(error => {
        console.error('Erreur lors de la suppression du film à la watched :', error.message);
        return throwError(() => new Error('Erreur lors de la suppression du film des à la watched'));
      })
    );
  }
  
  getWatched(nickname?: string): Observable<any[]> {
    let url = `${this.apiUrl}/watched`;
  
    if (nickname) {
        url += `/${nickname}`;
    }
  
    return this.http.get<any[]>(url, { headers: this.getAuthHeaders() }).pipe(
        catchError(error => {
            console.error('Watched erreur :', error);
            return throwError(error);
        })
    );
  }
}