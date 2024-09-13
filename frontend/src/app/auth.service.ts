import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

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
    return this.http.post<{ token: string }>(`${this.apiUrl}/auth/login`, { username, password }, { observe: 'response', withCredentials: true  })
      .pipe(
        tap(response => {
          if (response.status === 200 && response.body && response.body.token) {
            const token = response.body.token;
  
            localStorage.setItem('token', token);
  
            this.setLoggedIn(true);
          }
        }),
        catchError(error => {
          this.setLoggedIn(false);
          return throwError(() => new Error('Connexion échouée'));
        })
      );
  }
  
  logout(): Observable<any> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/logout`, {}, { 
      observe: 'response', 
      withCredentials: true,
      headers: new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('token')}`)
    })
    .pipe(
      tap(response => {
        if (response.status === 200) {
          this.setLoggedIn(false);
          localStorage.removeItem('token'); 
        }
      }),
      catchError(error => {
        console.error('Erreur lors de la déconnexion:', error);
        this.setLoggedIn(false);
        return throwError(() => new Error('Déconnexion échouée'));
      })
    );
  }
  

  getProfil(): Observable<any> {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return throwError(() => new Error('Aucun token trouvé'));
    }
  
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  
    return this.http.get<any>(`${this.apiUrl}/auth/profil`, { headers });
  }

  changeNickname(newNickname: string): Observable<any> {
    const token = localStorage.getItem('token');
    
  
    return this.http.patch<any>(`${this.apiUrl}/auth/profil/update`, 
      { newNickname }, 
      { 
        headers: new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }),
        withCredentials: true
      }
    ).pipe(
      tap(
        response => console.log('Réponse:', response),
        error => console.error('Erreur:', error)
      )
    );
  }
   

  register(username: string, password: string, nickname: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, { username, password, nickname }, { observe: 'response' });
  }
  private setLoggedIn(status: boolean): void {
    this.isLoggedInSubject.next(status);
  }

}
