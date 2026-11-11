import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { GameAnswer, GameQuestion, GameService, GameType } from '../game.service';

const ROUNDS = 10;
const BEST_KEY = 'binge:game:best';
const HINT_EVERY = 6; // seconds between two hints

type Phase = 'menu' | 'loading' | 'round' | 'result' | 'done';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css',
})
export class GameComponent implements OnDestroy {
  readonly rounds = ROUNDS;
  readonly modes: { type: GameType | null; label: string; icon: string }[] = [
    { type: null, label: 'Tout mélangé', icon: 'fa-shuffle' },
    { type: 'scene', label: 'Scènes', icon: 'fa-image' },
    { type: 'actors', label: 'Acteurs', icon: 'fa-user-group' },
    { type: 'synopsis', label: 'Synopsis', icon: 'fa-align-left' },
  ];

  phase: Phase = 'menu';
  mode: GameType | null = null;
  question: GameQuestion | null = null;
  answer: GameAnswer | null = null;
  round = 0;
  score = 0;
  correctCount = 0;
  gained = 0;
  guess = '';
  wrong = false;
  error = '';
  elapsed = 0;
  best = 0;

  private seen: number[] = [];
  private startedAt = 0;
  private ticker: ReturnType<typeof setInterval> | null = null;
  private sending = false;

  @ViewChild('field') field?: ElementRef<HTMLInputElement>;

  constructor(private game: GameService) {
    try {
      this.best = Number(localStorage.getItem(BEST_KEY)) || 0;
    } catch {}
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  get remaining(): number {
    return this.question ? Math.max(0, this.question.duration - this.elapsed) : 0;
  }

  get progress(): number {
    return this.question ? this.remaining / this.question.duration : 0;
  }

  get visibleHints(): string[] {
    if (!this.question) return [];
    return this.question.hints.slice(0, Math.min(this.question.hints.length, Math.floor(this.elapsed / HINT_EVERY)));
  }

  /** Scenes start blurred and sharpen as the time runs out. */
  get blur(): number {
    return Math.round(this.progress * 22);
  }

  start(mode: GameType | null): void {
    this.mode = mode;
    this.round = 0;
    this.score = 0;
    this.correctCount = 0;
    this.seen = [];
    this.next();
  }

  next(): void {
    if (this.round >= ROUNDS) return this.finish();
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
      this.answer = null;
      this.gained = 0;
      this.elapsed = 0;
      this.phase = 'round';
      this.startedAt = Date.now();
      this.stopTimer();
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
    if (this.elapsed >= this.question.duration) this.giveUp();
  }

  submit(): void {
    const text = this.guess.trim();
    if (!this.question || !text || this.sending || this.phase !== 'round') return;
    this.sending = true;
    this.game.guess(this.question.id, text).subscribe({
      next: (result) => {
        this.sending = false;
        if (result.correct && result.answer) {
          this.gained = result.points || 0;
          this.score += this.gained;
          this.correctCount++;
          this.showResult(result.answer);
        } else {
          this.wrong = true;
          this.guess = '';
          setTimeout(() => (this.wrong = false), 500);
        }
      },
      error: () => (this.sending = false),
    });
  }

  giveUp(): void {
    if (!this.question || this.phase !== 'round') return;
    this.stopTimer();
    this.game.reveal(this.question.id).subscribe({
      next: ({ answer }) => this.showResult(answer),
      error: () => this.showResult({ title: '?', year: '', poster_path: null, filmId: this.question!.filmId }),
    });
  }

  private showResult(answer: GameAnswer): void {
    this.stopTimer();
    this.answer = answer;
    this.phase = 'result';
  }

  private finish(): void {
    if (this.score > this.best) {
      this.best = this.score;
      try {
        localStorage.setItem(BEST_KEY, String(this.best));
      } catch {}
    }
    this.phase = 'done';
  }

  backToMenu(): void {
    this.stopTimer();
    this.phase = 'menu';
  }

  private stopTimer(): void {
    if (this.ticker) clearInterval(this.ticker);
    this.ticker = null;
  }

  poster(path: string | null): string {
    return path ? `https://image.tmdb.org/t/p/w342${path}` : '';
  }
}
