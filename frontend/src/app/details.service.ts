import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { EMPTY, Observable, catchError, defaultIfEmpty, map, merge, of, scan, tap } from 'rxjs';
import { environment } from '../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class DetailsService {
  private apiUrl = `${environment.apiUrl}`;
  private movieCache = new Map<number, any>();

  constructor(private http: HttpClient) { }

  getMovieByID(id: number): Observable<any> {
    if (this.movieCache.has(id)) {
      return of(this.movieCache.get(id));
    }
    
    const url = `${this.apiUrl}/films/${id}`;
    let params = new HttpParams().append('append_to_response', 'credits');
    
    return this.http.get<any>(url, { params }).pipe(
      tap(movie => this.movieCache.set(id, movie))
    );
  }

  loadBatchMovies(movieIds: number[], batchSize: number = 24): Observable<any[]> {
    if (!movieIds.length) return of([]);
    const chunks: number[][] = [];
    for (let i = 0; i < movieIds.length; i += batchSize) {
      chunks.push(movieIds.slice(i, i + batchSize));
    }
    return merge(
      ...chunks.map((ids, index) =>
        this.http.get<any[]>(`${this.apiUrl}/films/batch`, { params: { ids: ids.join(',') } }).pipe(
          map((movies) => ({ index, movies })),
          catchError(() => EMPTY)
        )
      )
    ).pipe(
      scan((acc: any[][], part) => {
        const next = [...acc];
        next[part.index] = part.movies;
        return next;
      }, [] as any[][]),
      map((parts) => parts.flat()),
      defaultIfEmpty([] as any[])
    );
  }

  getLogoByID(id: number): Observable<any> {
    const url = `${this.apiUrl}/logo/${id}`;
    return this.http.get<any>(url);
  }
  getTeaserByID(id: number): Observable<any> {
    const url = `${this.apiUrl}/teaser/${id}`;
    return this.http.get<any>(url);
  }
  getProviders(id: number): Observable<any> {
    const url = `${this.apiUrl}/providers/${id}`;
    return this.http.get<any>(url);
  }
  getSimilarByID(id: number): Observable<any> {
    const url = `${this.apiUrl}/similar/${id}`;
    return this.http.get<any>(url);
  }
}
