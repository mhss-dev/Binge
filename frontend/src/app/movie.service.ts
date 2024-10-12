import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MovieService {
  
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  getNowPlayingMovies(region: string = 'BE', page: number = 1): Observable<any> {    
    return this.http.get<any>(`${this.apiUrl}/nowplaying`, { params: { region, page } });
  }
  

  getTrending(): Observable<any> {    
    return this.http.get<any>(`${this.apiUrl}/trending`);
  }

  getTopRated(): Observable<any> {    
    return this.http.get<any>(`${this.apiUrl}/top`);
  }

  getUpcoming(region: string = 'BE', page: number = 1): Observable<any> {    
    return this.http.get<any>(`${this.apiUrl}/upcoming`, { params: { region, page } });
  }

}
