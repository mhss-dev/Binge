import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export type GameType = 'scene' | 'actors' | 'synopsis';

export interface GameQuestion {
  id: string;
  type: GameType;
  duration: number;
  filmId: number;
  prompt: string;
  hints: string[];
  images?: string[];
  captions?: string[];
  text?: string;
}

export interface GameAnswer {
  title: string;
  year: string;
  poster_path: string | null;
  filmId: number;
}

export interface GuessResult {
  correct: boolean;
  points?: number;
  answer?: GameAnswer;
}

// Open to everyone: no token, no account.
@Injectable({ providedIn: 'root' })
export class GameService {
  private apiUrl = `${environment.apiUrl}/game`;

  constructor(private http: HttpClient) {}

  question(type: GameType | null, seen: number[]): Observable<GameQuestion> {
    let params = new HttpParams().set('seen', seen.join(','));
    if (type) params = params.set('type', type);
    return this.http.get<GameQuestion>(`${this.apiUrl}/question`, { params });
  }

  guess(id: string, guess: string): Observable<GuessResult> {
    return this.http.post<GuessResult>(`${this.apiUrl}/answer`, { id, guess });
  }

  reveal(id: string): Observable<{ answer: GameAnswer }> {
    return this.http.post<{ answer: GameAnswer }>(`${this.apiUrl}/reveal`, { id });
  }
}
