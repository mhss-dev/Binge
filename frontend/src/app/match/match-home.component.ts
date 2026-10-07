import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MovieService } from '../movie.service';
import { MatchService, MySession } from './match.service';

@Component({
  selector: 'app-match-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './match-home.component.html',
  styleUrl: './match-home.component.css',
})
export class MatchHomeComponent implements OnInit {
  creating = false;
  error = '';
  sessions: MySession[] = [];
  fan: string[] = [];

  constructor(private matchService: MatchService, private router: Router, private movieService: MovieService) {}

  ngOnInit(): void {
    this.movieService.getTrending().subscribe({
      next: (data) => {
        const results: { poster_path?: string | null }[] = Array.isArray(data?.results) ? data.results : [];
        this.fan = results
          .filter((m) => !!m.poster_path && /^\/[A-Za-z0-9_.-]{1,100}\.(jpg|jpeg|png|webp)$/.test(m.poster_path))
          .slice(0, 6)
          .map((m) => `https://image.tmdb.org/t/p/w342${m.poster_path}`);
      },
      error: () => (this.fan = []),
    });
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

  create(): void {
    if (this.creating) {
      return;
    }
    this.creating = true;
    this.error = '';
    this.matchService.createSession().subscribe({
      next: (res) => this.router.navigate(['/match', res.session.code]),
      error: (err) => {
        this.creating = false;
        this.error = err?.status === 429 ? 'Trop de salons créés, réessaie plus tard.' : 'Impossible de créer le salon pour le moment.';
      },
    });
  }
}
