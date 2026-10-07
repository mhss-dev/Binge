import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MovieService } from '../movie.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styles: [':host { display: block; }']
})
export class HeaderComponent implements OnInit, OnDestroy {
  films: any[] = [];
  index = 0;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private movieService: MovieService) {}

  get movie(): any | null {
    return this.films.length > 0 ? this.films[this.index % this.films.length] : null;
  }

  ngOnInit(): void {
    this.movieService.getNowPlayingMovies('BE').subscribe({
      next: (data) => {
        this.films = (data?.results ?? []).filter((film: { backdrop_path?: string | null }) => !!film.backdrop_path).slice(0, 6);
        this.start();
      },
      error: (error) => console.error('Erreur lors de la récupération des films en cours', error),
    });
  }

  ngOnDestroy(): void {
    this.stop();
  }

  pick(index: number): void {
    this.index = index;
    this.stop();
    this.start();
  }

  trackById(index: number, film: { id?: number }): number {
    return film.id ?? index;
  }

  scrollTo(id: string): void {
    const element = document.querySelector(`#${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  imageUrl(path: string | null | undefined, size: string): string {
    return path && /^\/[A-Za-z0-9_.-]{1,100}\.(jpg|jpeg|png|webp)$/.test(path) ? `https://image.tmdb.org/t/p/${size}${path}` : '';
  }

  private start(): void {
    if (this.timer || this.films.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    this.timer = setInterval(() => {
      if (!document.hidden) {
        this.index = (this.index + 1) % this.films.length;
      }
    }, 7000);
  }

  private stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
