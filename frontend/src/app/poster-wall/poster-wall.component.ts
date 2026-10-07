import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, forkJoin, of } from 'rxjs';
import { MovieService } from '../movie.service';

@Component({
  selector: 'app-poster-wall',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="wall" [class.contained]="contained" aria-hidden="true" *ngIf="rows.length > 0">
      <div class="row" *ngFor="let row of rows; let i = index" [class.rev]="i % 2 === 1">
        <div class="track">
          <img *ngFor="let url of row" [src]="url" alt="" referrerpolicy="no-referrer" />
        </div>
      </div>
    </div>
    <div class="shade" [class.contained]="contained"></div>
  `,
  styles: [`
    .wall { contain: layout paint; position: fixed; inset: -25%; display: grid; align-content: center; gap: 1rem; transform: rotate(-9deg); opacity: 0.6; }
    .wall.contained { position: absolute; opacity: 0.7; }
    .row { display: flex; overflow: hidden; }
    .track { display: flex; gap: 1rem; width: max-content; will-change: transform; animation: scroll 90s linear infinite; }
    .row.rev .track { animation-direction: reverse; animation-duration: 110s; }
    .track img { width: 150px; aspect-ratio: 2 / 3; object-fit: cover; border-radius: 14px; }
    .shade { position: fixed; inset: 0; background: radial-gradient(circle at center, rgba(7, 17, 31, 0.5), rgba(7, 17, 31, 0.93) 78%); }
    .shade.contained { position: absolute; background: rgba(7, 17, 31, 0.5); }
    @media (min-width: 992px) { .track img { width: 190px; } }
    @keyframes scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
    @media (prefers-reduced-motion: reduce) { .track { animation: none; } }
  `],
})
export class PosterWallComponent implements OnInit, OnChanges {
  @Input() posters: string[] | null = null;
  @Input() contained = false;
  rows: string[][] = [];

  constructor(private movieService: MovieService) {}

  ngOnInit(): void {
    if (this.posters) {
      return;
    }
    const page = (n: number) => this.movieService.getNowPlayingMovies('BE', n).pipe(catchError(() => of({ results: [] })));
    forkJoin([page(1), page(2)]).subscribe(([first, second]) => {
      const posters: string[] = [...(first?.results ?? []), ...(second?.results ?? [])]
        .map((movie: { poster_path?: string | null }) => movie.poster_path ?? '')
        .filter((path: string) => /^\/[A-Za-z0-9_.-]{1,100}\.(jpg|jpeg|png|webp)$/.test(path))
        .map((path: string) => `https://image.tmdb.org/t/p/w342${path}`);
      if (posters.length >= 9) {
        this.build(posters);
      }
    });
  }

  ngOnChanges(): void {
    if (this.posters && this.posters.length > 0) {
      this.build(this.posters);
    } else if (this.posters) {
      this.rows = [];
    }
  }

  private build(posters: string[]): void {
    let list = posters.slice(0, 45);
    while (list.length < 18) {
      list = list.concat(list);
    }
    const rows: string[][] = [[], [], []];
    list.forEach((url, index) => rows[index % 3].push(url));
    this.rows = rows.map((row) => [...row, ...row]);
  }
}
