import { Component, ElementRef, HostListener, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { GameAnswer, GameQuestion, GameService, GameType } from '../game.service';
import { NAME_KEY } from './game-room.component';

const ROUNDS = 10;
const BEST_KEY = 'binge:game:best';
const MAX_ROUND_POINTS = 100; // what a round pays when answered instantly
const HINT_EVERY = 6; // seconds between two hints
const AUTO_NEXT = 4.5; // seconds the answer stays up before the next round starts
const RESUME_GRACE = 2; // seconds left once the mouse leaves the answer

type Phase = 'menu' | 'loading' | 'round' | 'result' | 'done';
type Outcome = 'ok' | 'timeout' | 'skip';

interface RoundResult {
  answer: GameAnswer;
  outcome: Outcome;
  points: number;
}

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './game.component.html',
})
export class GameComponent implements OnDestroy {
  readonly rounds = ROUNDS;
  readonly maxScore = ROUNDS * MAX_ROUND_POINTS;
  readonly roundNumbers = Array.from({ length: ROUNDS }, (_, i) => i);
  readonly modes: { type: GameType | null; label: string; hint: string; icon: string }[] = [
    { type: null, label: 'Tout mélangé', hint: 'Un peu de chaque', icon: 'fa-shuffle' },
    { type: 'scene', label: 'Scènes', hint: 'Une image floue qui se précise', icon: 'fa-image' },
    { type: 'actors', label: 'Acteurs', hint: 'Trois visages, un film', icon: 'fa-user-group' },
    { type: 'synopsis', label: 'Synopsis', hint: 'Le résumé, titre caché', icon: 'fa-align-left' },
  ];

  multi = false;
  name = '';
  joinCode = '';
  creating = false;
  phase: Phase = 'menu';
  mode: GameType | null = null;
  question: GameQuestion | null = null;
  current: RoundResult | null = null;
  results: RoundResult[] = [];
  round = 0;
  score = 0;
  guess = '';
  wrong = false;
  error = '';
  elapsed = 0;
  best = 0;
  newRecord = false;

  // The answer stays up for a few seconds, then the next round starts by itself.
  // Hovering it, or clicking it, holds it there so the film page can be opened.
  resultElapsed = 0;
  hovering = false;
  pinned = false;

  private seen: number[] = [];
  private startedAt = 0;
  private resultStartedAt = 0;
  private ticker: ReturnType<typeof setInterval> | null = null;
  private resultTicker: ReturnType<typeof setInterval> | null = null;
  private sending = false;

  @ViewChild('field') field?: ElementRef<HTMLInputElement>;

  constructor(private game: GameService, private router: Router) {
    try {
      this.name = localStorage.getItem(NAME_KEY) || '';
      this.best = Number(localStorage.getItem(BEST_KEY)) || 0;
    } catch {}
  }

  ngOnDestroy(): void {
    this.stopTimers();
  }

  get remaining(): number {
    return this.question ? Math.max(0, this.question.duration - this.elapsed) : 0;
  }

  get progress(): number {
    return this.question ? this.remaining / this.question.duration : 0;
  }

  get resultProgress(): number {
    return Math.max(0, 1 - this.resultElapsed / AUTO_NEXT);
  }

  get held(): boolean {
    return this.hovering || this.pinned;
  }

  get visibleHints(): string[] {
    if (!this.question) return [];
    return this.question.hints.slice(0, Math.min(this.question.hints.length, Math.floor(this.elapsed / HINT_EVERY)));
  }

  get correctCount(): number {
    return this.results.filter((r) => r.outcome === 'ok').length;
  }

  get bestRound(): number {
    return Math.max(0, ...this.results.map((r) => r.points));
  }

  /** Scenes start blurred and sharpen as the time runs out. */
  get blur(): number {
    return Math.round(this.progress * 22);
  }

  dot(index: number): string {
    const result = this.results[index];
    if (result) return result.outcome === 'ok' ? 'ok' : 'ko';
    return index === this.round - 1 ? 'now' : '';
  }

  /** On the menu a mode card starts a solo game, or opens a room when playing with others. */
  pickMode(mode: GameType | null): void {
    if (!this.multi) return this.start(mode);
    const name = this.name.trim();
    if (!name || this.creating) return;
    this.creating = true;
    this.error = '';
    this.game.createRoom(name, mode).subscribe({
      next: (who) => {
        try {
          localStorage.setItem(NAME_KEY, name);
        } catch {}
        this.game.saveIdentity(who);
        this.router.navigate(['/jeu', who.code]);
      },
      error: () => {
        this.creating = false;
        this.error = 'Impossible de créer la salle, réessaie.';
      },
    });
  }

  joinRoom(): void {
    // A pasted link works as well as the bare code.
    const code = this.joinCode.trim().split('/').pop()?.toLowerCase();
    if (code) this.router.navigate(['/jeu', code]);
  }

  start(mode: GameType | null): void {
    this.mode = mode;
    this.round = 0;
    this.score = 0;
    this.results = [];
    this.seen = [];
    this.newRecord = false;
    this.next();
  }

  next(): void {
    this.stopTimers();
    if (this.results.length >= ROUNDS) return this.finish();
    this.phase = 'loading';
    this.error = '';
    this.game.question(this.mode, this.seen).subscribe({
      next: (question) => this.begin(question),
      error: () => {
        this.error = 'Impossible de charger une question, réessaie.';
        this.phase = this.round === 0 ? 'menu' : 'result';
      },
    });
  }

  private begin(question: GameQuestion): void {
    // The round only starts once the pictures are there, so a slow connection does not eat the time.
    const images = question.images || [];
    let pending = images.length;
    const go = () => {
      this.question = question;
      this.seen.push(question.filmId);
      this.round++;
      this.guess = '';
      this.wrong = false;
      this.current = null;
      this.elapsed = 0;
      this.phase = 'round';
      this.startedAt = Date.now();
      this.ticker = setInterval(() => this.tick(), 100);
      setTimeout(() => this.field?.nativeElement.focus());
    };
    if (!pending) return go();
    const done = () => --pending === 0 && go();
    images.forEach((src) => {
      const img = new Image();
      img.onload = img.onerror = done;
      img.src = src;
    });
  }

  private tick(): void {
    if (!this.question) return;
    this.elapsed = (Date.now() - this.startedAt) / 1000;
    if (this.elapsed >= this.question.duration) this.giveUp('timeout');
  }

  submit(): void {
    const text = this.guess.trim();
    if (!this.question || !text || this.sending || this.phase !== 'round') return;
    this.sending = true;
    this.game.guess(this.question.id, text).subscribe({
      next: (result) => {
        this.sending = false;
        if (result.correct && result.answer) {
          this.score += result.points || 0;
          this.showResult({ answer: result.answer, outcome: 'ok', points: result.points || 0 });
        } else {
          this.wrong = true;
          this.guess = '';
          setTimeout(() => (this.wrong = false), 900);
        }
      },
      error: () => (this.sending = false),
    });
  }

  giveUp(outcome: 'timeout' | 'skip' = 'skip'): void {
    if (!this.question || this.phase !== 'round') return;
    this.stopTimers();
    const filmId = this.question.filmId;
    this.game.reveal(this.question.id).subscribe({
      next: ({ answer }) => this.showResult({ answer, outcome, points: 0 }),
      error: () => this.showResult({ answer: { title: '?', year: '', poster_path: null, filmId }, outcome, points: 0 }),
    });
  }

  private showResult(result: RoundResult): void {
    this.stopTimers();
    this.current = result;
    this.results.push(result);
    this.phase = 'result';
    this.resultElapsed = 0;
    this.hovering = false;
    this.pinned = false;
    this.resultStartedAt = Date.now();
    this.resultTicker = setInterval(() => {
      if (this.held) return;
      this.resultElapsed += 0.1;
      if (this.resultElapsed >= AUTO_NEXT) this.next();
    }, 100);
  }

  hold(on: boolean): void {
    this.hovering = on;
    // Leaving the card gives a moment to move on, not a fresh countdown.
    if (!on) this.resultElapsed = Math.min(this.resultElapsed, AUTO_NEXT - RESUME_GRACE);
  }

  pin(): void {
    this.pinned = true;
  }

  @HostListener('document:keydown.enter', ['$event'])
  onEnter(event: Event): void {
    // A held key would skip rounds: only a press that starts well after the answer appeared counts.
    if (this.phase === 'result' && !(event as KeyboardEvent).repeat && Date.now() - this.resultStartedAt > 500) this.next();
  }

  private finish(): void {
    if (this.score > this.best) {
      this.newRecord = this.best > 0;
      this.best = this.score;
      try {
        localStorage.setItem(BEST_KEY, String(this.best));
      } catch {}
    }
    this.phase = 'done';
  }

  backToMenu(): void {
    this.stopTimers();
    this.phase = 'menu';
  }

  private stopTimers(): void {
    if (this.ticker) clearInterval(this.ticker);
    if (this.resultTicker) clearInterval(this.resultTicker);
    this.ticker = this.resultTicker = null;
  }

  poster(path: string | null): string {
    return path ? `https://image.tmdb.org/t/p/w342${path}` : '';
  }
}
