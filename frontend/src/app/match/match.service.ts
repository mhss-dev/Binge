import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface MatchFilters {
  genres?: number[];
  yearFrom?: number;
}

export interface MatchSession {
  code: string;
  title: string | null;
  filters: MatchFilters;
  created_at: string;
  expires_at: string;
  open: boolean;
  max_participants: number;
  mine_to_manage: boolean;
}

export interface MatchParticipant {
  id: number;
  name: string;
  registered: boolean;
  swiped: number;
  me: boolean;
}

export interface MatchCard {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number | null;
  overview: string;
  genre_ids: number[];
}

export interface MatchMovie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
}

export interface MatchEntry {
  movie: MatchMovie;
  matched_at: string;
  picked: boolean;
  picked_by: number | null;
}

export interface SessionInfo {
  session: MatchSession;
  participants: MatchParticipant[];
  joined: boolean;
  full: boolean;
}

export interface SessionState {
  session: MatchSession;
  me: number;
  participants: MatchParticipant[];
  matches: MatchEntry[];
}

export interface SwipeResult {
  recorded: boolean;
  match: boolean;
  movie: MatchMovie | null;
}

export interface MySession {
  code: string;
  title: string | null;
  created_at: string;
  expires_at: string;
  participants: number;
  matches: number;
}

export interface JoinResult {
  participant_id: number;
  name: string;
  guest_token?: string;
}

export const MATCH_GENRES: { id: number; label: string }[] = [
  { id: 28, label: 'Action' },
  { id: 12, label: 'Aventure' },
  { id: 16, label: 'Animation' },
  { id: 35, label: 'Comédie' },
  { id: 80, label: 'Policier' },
  { id: 18, label: 'Drame' },
  { id: 10751, label: 'Familial' },
  { id: 14, label: 'Fantastique' },
  { id: 27, label: 'Horreur' },
  { id: 9648, label: 'Mystère' },
  { id: 10749, label: 'Romance' },
  { id: 878, label: 'Science-fiction' },
  { id: 53, label: 'Thriller' },
];

@Injectable({ providedIn: 'root' })
export class MatchService {
  private apiUrl = `${environment.apiUrl}/match`;

  constructor(private http: HttpClient) {}

  guestToken(code: string): string | null {
    try {
      return localStorage.getItem(`match_guest_${code}`);
    } catch {
      return null;
    }
  }

  saveGuestToken(code: string, token: string): void {
    try {
      localStorage.setItem(`match_guest_${code}`, token);
    } catch {
      return;
    }
  }

  private headers(code?: string): HttpHeaders {
    let headers = new HttpHeaders();
    const token = localStorage.getItem('token');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    const guest = code ? this.guestToken(code) : null;
    if (guest) {
      headers = headers.set('X-Match-Guest', guest);
    }
    return headers;
  }

  createSession(title: string, filters: MatchFilters): Observable<{ session: MatchSession; participant_id: number }> {
    return this.http.post<{ session: MatchSession; participant_id: number }>(
      `${this.apiUrl}/sessions`,
      { title, filters },
      { headers: this.headers() }
    );
  }

  mySessions(): Observable<MySession[]> {
    return this.http.get<MySession[]>(`${this.apiUrl}/sessions`, { headers: this.headers() });
  }

  getSession(code: string): Observable<SessionInfo> {
    return this.http.get<SessionInfo>(`${this.apiUrl}/sessions/${code}`, { headers: this.headers(code) });
  }

  join(code: string, name: string): Observable<JoinResult> {
    return this.http.post<JoinResult>(`${this.apiUrl}/sessions/${code}/join`, { name }, { headers: this.headers(code) });
  }

  getDeck(code: string, limit = 8): Observable<{ cards: MatchCard[]; exhausted: boolean }> {
    return this.http.get<{ cards: MatchCard[]; exhausted: boolean }>(`${this.apiUrl}/sessions/${code}/deck?limit=${limit}`, {
      headers: this.headers(code),
    });
  }

  swipe(code: string, movieId: number, liked: boolean): Observable<SwipeResult> {
    return this.http.post<SwipeResult>(`${this.apiUrl}/sessions/${code}/swipe`, { movieId, liked }, { headers: this.headers(code) });
  }

  getState(code: string): Observable<SessionState> {
    return this.http.get<SessionState>(`${this.apiUrl}/sessions/${code}/state`, { headers: this.headers(code) });
  }

  pick(code: string, movieId: number, picked: boolean): Observable<{ movie_id: number; picked: boolean }> {
    return this.http.post<{ movie_id: number; picked: boolean }>(
      `${this.apiUrl}/sessions/${code}/pick`,
      { movieId, picked },
      { headers: this.headers(code) }
    );
  }

  updateFilters(code: string, filters: MatchFilters): Observable<{ session: MatchSession }> {
    return this.http.patch<{ session: MatchSession }>(`${this.apiUrl}/sessions/${code}`, { filters }, { headers: this.headers(code) });
  }

  endSession(code: string): Observable<{ ended: boolean }> {
    return this.http.delete<{ ended: boolean }>(`${this.apiUrl}/sessions/${code}`, { headers: this.headers(code) });
  }
}
