import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MovieService {
  
  private apiUrl = `https://backend-binge.onrender.com/api/nowplaying`;

  constructor(private http: HttpClient) { }

  getNowPlayingMovies(): Observable<any> {    
    return this.http.get<any>(this.apiUrl);
  }

}
