import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export type SerieList = 'favorites' | 'watched' | 'watchlist';
export interface SerieState { favorite: boolean; watched: boolean; watchlist: boolean; }
export interface SerieListEntry { serie_id: number; added_at: string | null; }
export type SerieLists = Record<SerieList, SerieListEntry[]>;

@Injectable({
  providedIn: 'root',
})
export class SeriesListsService {
  private apiUrl = `${environment.apiUrl}/series-lists`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('token')}`);
  }

  getLists(nickname?: string): Observable<SerieLists> {
    return nickname
      ? this.http.get<SerieLists>(`${this.apiUrl}/profile/${encodeURIComponent(nickname)}`)
      : this.http.get<SerieLists>(this.apiUrl, { headers: this.getAuthHeaders() });
  }

  add(list: SerieList, serieId: number): Observable<SerieState> {
    return this.http.post<SerieState>(`${this.apiUrl}/${list}/${serieId}`, {}, { headers: this.getAuthHeaders() });
  }

  remove(list: SerieList, serieId: number): Observable<SerieState> {
    return this.http.delete<SerieState>(`${this.apiUrl}/${list}/${serieId}`, { headers: this.getAuthHeaders() });
  }

  static stateOf(lists: SerieLists, serieId: number): SerieState {
    const has = (list: SerieList) => lists[list].some((entry) => entry.serie_id === serieId);
    return { favorite: has('favorites'), watched: has('watched'), watchlist: has('watchlist') };
  }
}
