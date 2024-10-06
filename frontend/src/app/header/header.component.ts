import { Component } from '@angular/core';
import { MovieService } from '../movie.service';
import { CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { DiscoverService } from 'app/discover.service';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, NgbToastModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {

  movie: any = {};
  error: string = '';
  loading: boolean = true;


  private subscription: Subscription = new Subscription();
  private readonly BACKDROP_UPDATE_INTERVAL = 5000;

  constructor(private movieService: MovieService) {}

  ngOnInit(): void {
    this.loadMovies();
    this.setupBackgroundUpdater();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  

  loadMovies() {
    this.movieService.getNowPlayingMovies().subscribe({
      next: (data) => {        
        this.movie = data.results[this.getRandomBackdrop(0, data.results.length -1)];        
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des films en cours', error);
        this.loading = false;
      }
    });
  }

  scrollTo(id: string): void {
    const element = document.querySelector(`#${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
