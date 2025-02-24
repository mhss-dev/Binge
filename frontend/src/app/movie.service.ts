import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MovieService {
  
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  getNowPlayingMovies(region: string = 'FR', page: number = 1): Observable<any> {    
    return this.http.get<any>(`${this.apiUrl}/nowplaying`, { params: { region, page } });
  }
  

  getTrending(): Observable<any> {    
    return this.http.get<any>(`${this.apiUrl}/trending`);
  }

  getTopRated(page: number = 1): Observable<any> {    
    const validPage = Math.max(1, Math.min(page, 500));

    let params = new HttpParams()
      .set('page', validPage.toString())

    const url = `${this.apiUrl}/top`;

    return this.http.get<any>(url, { params }).pipe(
      map((response: any) => {
        return response;
      })
    );  
  }

  getUpcoming(region: string = 'BE', page: number = 1): Observable<any> {    
    return this.http.get<any>(`${this.apiUrl}/upcoming`, { params: { region, page } });
  }

}
