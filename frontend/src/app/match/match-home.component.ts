import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PosterWallComponent } from '../poster-wall/poster-wall.component';
import { MATCH_GENRES, MatchService, MySession } from './match.service';

@Component({
  selector: 'app-match-home',
  standalone: true,
  imports: [CommonModule, RouterLink, PosterWallComponent],
  templateUrl: './match-home.component.html',
  styleUrl: './match-home.component.css',
})
export class MatchHomeComponent implements OnInit {
  readonly moods = MATCH_GENRES;
  mode: 'solo' | 'group' = 'solo';
  mood: number[] = [];
  creating = false;
  error = '';
  sessions: MySession[] = [];

  constructor(private matchService: MatchService, private router: Router) {}

  ngOnInit(): void {
    this.matchService.mySessions().subscribe({
      next: (sessions) => (this.sessions = sessions),
      error: () => (this.sessions = []),
    });
  }

  remove(session: MySession): void {
    this.matchService.endSession(session.code).subscribe({
      next: () => (this.sessions = this.sessions.filter((item) => item.code !== session.code)),
      error: () => (this.error = 'Impossible de supprimer ce salon pour le moment.'),
    });
  }

  toggleMood(id: number): void {
    this.mood = this.mood.includes(id) ? this.mood.filter((g) => g !== id) : this.mood.length < 3 ? [...this.mood, id] : this.mood;
  }

  isSolo(code: string): boolean {
    return this.matchService.isSolo(code);
  }

  create(): void {
    if (this.creating) {
      return;
    }
    this.creating = true;
    this.error = '';
    const solo = this.mode === 'solo';
    const filters = solo && this.mood.length > 0 ? { genres: this.mood } : {};
    this.matchService.createSession(filters).subscribe({
      next: (res) => {
        if (solo) {
          this.matchService.markSolo(res.session.code);
        }
        this.router.navigate(['/match', res.session.code]);
      },
      error: (err) => {
        this.creating = false;
        this.error = err?.status === 429 ? 'Trop de salons créés, réessaie plus tard.' : 'Impossible de créer le salon pour le moment.';
      },
    });
  }
}
