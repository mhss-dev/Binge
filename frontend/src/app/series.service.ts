import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, tap } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SeriesService {
  private apiUrl = `${environment.apiUrl}/series`;
  private serieCache = new Map<number, any>();

  constructor(private http: HttpClient) {}

  getSeries(page: number = 1, sortOption: string = 'popularity.desc', genreId: string = '', era?: number | null, minVotes?: number): Observable<any> {
    let params = new HttpParams()
      .set('page', Math.max(1, page).toString())
      .set('sort_by', sortOption);

    if (genreId) {
      params = params.set('genre', genreId);
    }
    if (era) {
      params = params.set('era', era.toString());
    }
    if (minVotes) {
      params = params.set('min_votes', minVotes.toString());
    }

    return this.http.get<any>(this.apiUrl, { params });
  }

  searchSeries(query: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/search`, { params: { query } });
  }

  getSerieByID(id: number): Observable<any> {
    if (this.serieCache.has(id)) {
      return of(this.serieCache.get(id));
    }
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(tap((serie) => this.serieCache.set(id, serie)));
  }

  getSeason(id: number, season: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/season/${season}`);
  }

  loadBatchSeries(ids: number[]): Observable<any[]> {
    const chunks: number[][] = [];
    for (let i = 0; i < ids.length; i += 40) {
      chunks.push(ids.slice(i, i + 40));
    }
    return chunks.length
      ? forkJoin(chunks.map((chunk) => this.http.get<any[]>(`${this.apiUrl}/batch`, { params: { ids: chunk.join(',') } }).pipe(catchError(() => of([]))))).pipe(map((parts) => parts.flat()))
      : of([]);
  }
}
