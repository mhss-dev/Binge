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

  getNowPlayingMovies(): Observable<any> {    
    return this.http.get<any>(`${this.apiUrl}/nowplaying`);
  }

  getTrending(): Observable<any> {    
    return this.http.get<any>(`${this.apiUrl}/trending`);
  }

  getTopRated(): Observable<any> {    
    return this.http.get<any>(`${this.apiUrl}/top`);
  }

  getUpcoming(): Observable<any> {    
    return this.http.get<any>(`${this.apiUrl}/upcoming`);
  }

}
