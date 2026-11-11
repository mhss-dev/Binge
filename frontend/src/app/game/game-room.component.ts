import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { GameService, RoomIdentity, RoomPlayer, RoomState } from '../game.service';

const POLL_MS = 900;
const HINT_EVERY = 6;
export const NAME_KEY = 'binge:game:name';

@Component({
  selector: 'app-game-room',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './game-room.component.html',
  styleUrl: './game.component.css',
})
export class GameRoomComponent implements OnInit, OnDestroy {
  code = '';
  who: RoomIdentity | null = null;
  state: RoomState | null = null;
  joinName = '';
  guess = '';
  wrong = false;
  error = '';
  lost = false; // the room is gone, or this browser is no longer in it
  gone = false; // ...and it is the room that is gone
  copied = false;
  now = Date.now(); // server time, refreshed by a local ticker

  private offset = 0;
  private poller: ReturnType<typeof setInterval> | null = null;
  private clock: ReturnType<typeof setInterval> | null = null;
  private polling = false;
  private failures = 0;
  private lastRound = 0;
  mine = { solved: false, gained: 0 };

  @ViewChild('field') field?: ElementRef<HTMLInputElement>;

  constructor(private route: ActivatedRoute, private router: Router, private game: GameService) {}

  ngOnInit(): void {
    this.code = (this.route.snapshot.paramMap.get('code') || '').toLowerCase();
    try {
      this.joinName = localStorage.getItem(NAME_KEY) || '';
    } catch {}
    this.who = this.game.savedIdentity(this.code);
    if (this.who) this.startPolling();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  get isHost(): boolean {
    return !!this.state && this.state.hostId === this.state.me;
  }

  get ranking(): RoomPlayer[] {
    return [...(this.state?.players || [])].sort((a, b) => b.score - a.score);
  }

  get myScore(): number {
    return this.state?.players.find((p) => p.id === this.state?.me)?.score || 0;
  }

  get roundRanking(): RoomPlayer[] {
    return [...(this.state?.players || [])].sort((a, b) => (b.gained || 0) - (a.gained || 0) || (a.solvedMs ?? 1e9) - (b.solvedMs ?? 1e9));
  }

  get shareLink(): string {
    return `${location.origin}/jeu/${this.code}`;
  }

  /** Seconds until the clue shows (positive during the countdown). */
  get countdown(): number {
    return this.state?.startsAt ? Math.max(0, Math.ceil((this.state.startsAt - this.now) / 1000)) : 0;
  }

  get playing(): boolean {
    return this.state?.phase === 'round' && this.countdown === 0;
  }

  get remaining(): number {
    if (!this.state?.endsAt) return 0;
    return Math.max(0, (this.state.endsAt - this.now) / 1000);
  }

  get progress(): number {
    return this.state ? this.remaining / this.state.duration : 0;
  }

  get nextProgress(): number {
    if (!this.state?.revealUntil) return 0;
    return Math.max(0, Math.min(1, (this.state.revealUntil - this.now) / 7000));
  }

  get blur(): number {
    return Math.round(this.progress * 22);
  }

  get elapsed(): number {
    return this.state ? this.state.duration - this.remaining : 0;
  }

  get hints(): string[] {
    const hints = this.state?.question?.hints || [];
    return hints.slice(0, Math.min(hints.length, Math.floor(this.elapsed / HINT_EVERY)));
  }

  get modeLabel(): string {
    const labels: Record<string, string> = { scene: 'Scènes', actors: 'Acteurs', synopsis: 'Synopsis' };
    return (this.state?.mode && labels[this.state.mode]) || 'Tout mélangé';
  }

  join(): void {
    const name = this.joinName.trim();
    if (!name) return;
    this.error = '';
    this.game.joinRoom(this.code, name).subscribe({
      next: (who) => {
        try {
          localStorage.setItem(NAME_KEY, name);
        } catch {}
        this.who = who;
        this.game.saveIdentity(who);
        this.lost = false;
        this.gone = false;
        this.startPolling();
      },
      error: (err: HttpErrorResponse) => (this.error = err.error?.error || 'Impossible de rejoindre la salle.'),
    });
  }

  private startPolling(): void {
    this.stopPolling();
    this.poll();
    this.poller = setInterval(() => this.poll(), POLL_MS);
    this.clock = setInterval(() => (this.now = Date.now() + this.offset), 100);
  }

  private stopPolling(): void {
    if (this.poller) clearInterval(this.poller);
    if (this.clock) clearInterval(this.clock);
    this.poller = this.clock = null;
  }

  private poll(): void {
    if (!this.who || this.polling) return;
    this.polling = true;
    this.game.roomState(this.who).subscribe({
      next: (state) => {
        this.polling = false;
        this.failures = 0;
        this.error = '';
        this.offset = state.serverNow - Date.now();
        this.now = state.serverNow;
        if (state.round !== this.lastRound || state.phase === 'lobby') {
          this.lastRound = state.round;
          this.guess = '';
          this.mine = { solved: false, gained: 0 };
        }
        const me = state.players.find((p) => p.id === state.me);
        if (me?.solved) this.mine.solved = true;
        const justStarted = state.phase === 'round' && this.state?.phase !== 'round';
        this.state = state;
        if (justStarted) setTimeout(() => this.field?.nativeElement.focus(), 4200);
      },
      error: (err: HttpErrorResponse) => {
        this.polling = false;
        if (err.status === 404 || err.status === 403) {
          this.stopPolling();
          this.game.forgetIdentity(this.code);
          this.who = null;
          this.state = null;
          this.lost = true;
          this.gone = err.status === 404;
          this.error = this.gone ? 'Cette salle n\'existe plus.' : '';
        } else if (++this.failures >= 3) {
          this.error = 'Connexion perdue, on réessaie…';
        }
      },
    });
  }

  start(): void {
    if (this.who) this.game.roomAction(this.who, 'start').subscribe({ error: (e) => (this.error = e.error?.error || '') });
  }

  again(): void {
    if (this.who) this.game.roomAction(this.who, 'again').subscribe();
  }

  leave(): void {
    const who = this.who;
    this.stopPolling();
    this.game.forgetIdentity(this.code);
    if (who) this.game.roomAction(who, 'leave').subscribe({ error: () => {} });
    this.router.navigate(['/jeu']);
  }

  submit(): void {
    const text = this.guess.trim();
    if (!this.who || !text || !this.playing || this.mine.solved) return;
    this.game.roomGuess(this.who, text).subscribe({
      next: (result) => {
        if (result.correct) {
          this.mine = { solved: true, gained: result.points || 0 };
        } else {
          this.wrong = true;
          this.guess = '';
          setTimeout(() => (this.wrong = false), 900);
        }
      },
      error: () => {},
    });
  }

  copy(): void {
    navigator.clipboard?.writeText(this.shareLink).then(
      () => {
        this.copied = true;
        setTimeout(() => (this.copied = false), 1800);
      },
      () => {},
    );
  }

  seconds(ms: number | null | undefined): string {
    return ms == null ? '' : `${(ms / 1000).toFixed(1)} s`;
  }

  poster(path: string | null): string {
    return path ? `https://image.tmdb.org/t/p/w342${path}` : '';
  }
}
