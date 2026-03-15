import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, from, throwError } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private readonly fallbackLocations = ['Belgium', 'France', 'Luxembourg'];

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

  getConnectedDevices() {
    const token = localStorage.getItem('token');
  
    return this.http.get<any[]>(
      `${this.apiUrl}/auth/devices`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  }
  private generateDeviceId(): string {
    return 'device-' + Math.random().toString(36).substring(2, 10);
  }

  private async resolveLocation(deviceId: string): Promise<string> {
    try {
      const response = await fetch('https://ipapi.co/json/');

      if (!response.ok) {
        throw new Error(`Location lookup failed with status ${response.status}`);
      }

      const data = await response.json();
      const countryName = typeof data?.country_name === 'string' ? data.country_name.trim() : '';

      if (countryName) {
        return countryName;
      }
    } catch (error) {
      console.warn('Location lookup failed, using fallback location.', error);
    }

    return this.getFallbackLocation(deviceId);
  }

  private getFallbackLocation(deviceId: string): string {
    const hash = Array.from(deviceId).reduce((total, char) => total + char.charCodeAt(0), 0);
    return this.fallbackLocations[hash % this.fallbackLocations.length];
  }

  login(username: string, password: string, nickname?: string, avatar_url?: string): Observable<any> {
    let deviceId = localStorage.getItem('deviceId') ?? this.generateDeviceId();
    if (!deviceId) {
      deviceId = this.generateDeviceId();
      localStorage.setItem('deviceId', deviceId);
    }

    return from(this.resolveLocation(deviceId)).pipe(
      switchMap((location) =>
        this.http.post<{ token: string }>(
          `${this.apiUrl}/auth/login`,
          { username, password, nickname, avatar_url, deviceId, location },
          { observe: 'response', withCredentials: true }
        )
      ),
      tap(response => {
        
        if (response.status === 200 && response.body && response.body.token) {
          const token = response.body.token;
          localStorage.setItem('token', token);
          this.setLoggedIn(true);
        } else {
          console.warn('Erreur aucun token');
        }
      }),
      catchError(error => {
        
        this.setLoggedIn(false);
  
        
        console.error('Connexion echouée :', error);
  
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

  getProfil(nickname?: string, avatar?: string): Observable<any> {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return throwError(() => new Error('Aucun token trouvé'));
    }
  
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  
    const url = nickname ? `${this.apiUrl}/auth/profil/${nickname}` : `${this.apiUrl}/auth/profil`;
  
    return this.http.get<any>(url, { headers });
  }
  
  
  changeNickname(newNickname: string): Observable<any> {
    const token = localStorage.getItem('token');
    
    const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    });

    return this.http.patch<any>(
        `${this.apiUrl}/auth/profil/update`, 
        { newNickname },
        { headers }
    );
}

changeBio(newBio: string): Observable<any> {
  const token = localStorage.getItem('token');

  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  return this.http.patch<any>(
    `${this.apiUrl}/auth/profil/update`,
    { newBio },
    { headers }
  );
}


  register(username: string, password: string, nickname: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, { username, password, nickname }, { observe: 'response' });
  }
  private setLoggedIn(status: boolean): void {
    this.isLoggedInSubject.next(status);
  }

}
