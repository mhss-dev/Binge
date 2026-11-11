import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
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

export interface RoomIdentity {
  code: string;
  playerId: string;
  token: string;
}

export interface RoomPlayer {
  id: string;
  name: string;
  score: number;
  host: boolean;
  connected: boolean;
  solved: boolean;
  gained?: number;
  solvedMs?: number | null;
}

export interface RoomState {
  code: string;
  phase: 'lobby' | 'round' | 'reveal' | 'done';
  preparing: boolean;
  mode: GameType | null;
  me: string;
  hostId: string;
  round: number;
  rounds: number;
  duration: number;
  serverNow: number;
  startsAt?: number;
  endsAt?: number;
  revealUntil?: number;
  players: RoomPlayer[];
  question: { type: GameType; prompt: string; images?: string[]; captions?: string[]; text?: string; hints: string[] } | null;
  answer?: GameAnswer;
  history?: GameAnswer[];
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

  // Rooms: a player is a name plus a secret token, kept in this browser for the room's code.
  private roomUrl = `${environment.apiUrl}/game/rooms`;

  createRoom(name: string, mode: GameType | null): Observable<RoomIdentity> {
    return this.http.post<RoomIdentity>(this.roomUrl, { name, mode });
  }

  joinRoom(code: string, name: string): Observable<RoomIdentity> {
    return this.http.post<RoomIdentity>(`${this.roomUrl}/${code}/join`, { name });
  }

  roomState(who: RoomIdentity): Observable<RoomState> {
    return this.http.get<RoomState>(`${this.roomUrl}/${who.code}/state`, { headers: this.as(who) });
  }

  roomGuess(who: RoomIdentity, guess: string): Observable<{ correct: boolean; points?: number }> {
    return this.http.post<{ correct: boolean; points?: number }>(`${this.roomUrl}/${who.code}/guess`, { guess }, { headers: this.as(who) });
  }

  roomAction(who: RoomIdentity, action: 'start' | 'again' | 'leave'): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.roomUrl}/${who.code}/${action}`, {}, { headers: this.as(who) });
  }

  private as(who: RoomIdentity): HttpHeaders {
    return new HttpHeaders({ 'X-Game-Player': `${who.playerId}.${who.token}` });
  }

  savedIdentity(code: string): RoomIdentity | null {
    try {
      return JSON.parse(localStorage.getItem(`binge:game:room:${code}`) || 'null');
    } catch {
      return null;
    }
  }

  saveIdentity(who: RoomIdentity): void {
    try {
      localStorage.setItem(`binge:game:room:${who.code}`, JSON.stringify(who));
    } catch {}
  }

  forgetIdentity(code: string): void {
    try {
      localStorage.removeItem(`binge:game:room:${code}`);
    } catch {}
  }
}
