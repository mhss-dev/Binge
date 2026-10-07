import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MATCH_GENRES, MatchService, MySession } from './match.service';

@Component({
  selector: 'app-match-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './match-home.component.html',
  styleUrl: './match.component.css',
})
export class MatchHomeComponent implements OnInit {
  readonly genres = MATCH_GENRES;
  readonly years = [
    { value: 0, label: 'Toutes les époques' },
    { value: 2000, label: 'Depuis 2000' },
    { value: 2010, label: 'Depuis 2010' },
    { value: 2020, label: 'Depuis 2020' },
  ];

  title = '';
  selectedGenres: number[] = [];
  yearFrom = 0;
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

  toggleGenre(id: number): void {
    this.selectedGenres = this.selectedGenres.includes(id)
      ? this.selectedGenres.filter((g) => g !== id)
      : this.selectedGenres.length < 5
        ? [...this.selectedGenres, id]
        : this.selectedGenres;
  }

  create(): void {
    if (this.creating) {
      return;
    }
    this.creating = true;
    this.error = '';
    this.matchService
      .createSession(this.title.trim(), {
        genres: this.selectedGenres,
        yearFrom: this.yearFrom || undefined,
      })
      .subscribe({
        next: (res) => this.router.navigate(['/match', res.session.code]),
        error: (err) => {
          this.creating = false;
          this.error = err?.status === 429 ? 'Trop de salons créés, réessaie plus tard.' : 'Impossible de créer le salon pour le moment.';
        },
      });
  }
}
