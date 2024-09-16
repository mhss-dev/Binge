import { HttpClient, HttpParams  } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DiscoverService {

  

  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }
  getFilms(page: number = 1, adult: boolean = false, sortOption: string = 'popularity.desc'): Observable<any> {
    const validPage = Math.max(1, Math.min(page, 500));
  
    let params = new HttpParams()
      .set('page', validPage.toString())
      .set('sort_by', sortOption)
      .set('include_adult', adult ? 'true' : 'false');
  
    const url = `${this.apiUrl}/films`;
  
    return this.http.get<any>(url, { params }).pipe(
      map((response: any) => {
        return response;
      })
    );
  }
  
  
  
  getMoviesByActor(id: number, page: number = 1): Observable<any> {
    const validPage = Math.max(1, Math.min(page, 500));

    let params = new HttpParams()
      .set('with_people', id.toString())
      .set('page', validPage.toString())

    const url = `${this.apiUrl}/actorid`; 

    return this.http.get<any>(url, { params });
  }


  searchFilms(query: string): Observable<any> {
    if (!query) {
      throw new Error('Search query hello?');
    }

    let params = new HttpParams();
    params = params.set('query', query);

    const url = `${this.apiUrl}/search`;

    return this.http.get<any>(url, { params });
  }
  
  getMovieByID(id: number): Observable<any> {
    const url = `${this.apiUrl}`; 
    return this.http.get<any>(url);
  }
}