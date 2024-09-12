import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
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
        console.log(response);
        if (response.message) {
          console.log(response.message);
        }
      }),
      catchError(error => {
        console.error('Erreur lors de l’ajout du film aux favoris:', error.message);
        return throwError(() => new Error('Erreur lors de l’ajout du film aux favoris'));
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
        console.error('Erreur lors de la suppression du film des favoris:', error.message);
        return throwError(() => new Error('Erreur lors de la suppression du film des favoris'));
      })
    );
  }
  
  getWatched(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}`, { headers: this.getAuthHeaders() }).pipe(
      tap(response => {
        console.log('Films récupérés:', response);
      }),
      catchError(error => {
        console.error('Erreur lors de la récupération des films vus:', error.message);
        return throwError(() => new Error('Erreur lors de la récupération des films vus'));
      })
    );
  }  
}