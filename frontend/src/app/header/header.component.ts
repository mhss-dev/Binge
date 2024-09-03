import { Component } from '@angular/core';
import { MovieService } from '../movie.service';
import { CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { DiscoverService } from 'app/discover.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {

  movie: any = {};
  error: string = '';
  loading: boolean = true;

  private subscription: Subscription = new Subscription();
  private readonly BACKDROP_UPDATE_INTERVAL = 5000;

  constructor(private movieService: DiscoverService) {}

  ngOnInit(): void {
    this.loadMovies();
    this.setupBackgroundUpdater();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadMovies() {
    this.movieService.getFilms().subscribe({
      next: (data) => {        
        this.movie = data.items[this.getRandomBackdrop(0, 20)];
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des films en cours', error);
        this.loading = false;
      }
    });
  }

  private getRandomBackdrop(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private setupBackgroundUpdater() {
    this.subscription.add(
      interval(this.BACKDROP_UPDATE_INTERVAL).subscribe(() => {
        this.loadMovies();
      })
    );
  }
}
