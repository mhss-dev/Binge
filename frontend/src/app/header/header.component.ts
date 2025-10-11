import { Component, ElementRef, AfterViewInit  } from '@angular/core';
import { MovieService } from '../movie.service';
import { CommonModule } from '@angular/common';
import { interval, Subscription } from 'rxjs';
import { DiscoverService } from 'app/discover.service';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, NgbToastModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {

  movie: any = {};
  error: string = '';
  loading: boolean = true;


  private subscription: Subscription = new Subscription();
  private readonly BACKDROP_UPDATE_INTERVAL = 5000;

  constructor(private movieService: MovieService, private el: ElementRef) {}

  ngOnInit(): void {
    this.loadMovies();
    this.setupBackgroundUpdater();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngAfterViewInit(): void {
  setTimeout(() => {
    this.animateSplitText();
  }, 500);
}

  private animateSplitText(): void {
    const elements = this.el.nativeElement.querySelectorAll('.split-text');
    elements.forEach((el: HTMLElement) => {
      const text = el.textContent || '';
      el.textContent = '';
      const letters = text.split('');
      letters.forEach((char, i) => {
        const span = document.createElement('span');
        span.textContent = char === ' ' ? '\u00A0' : char;
        span.style.display = 'inline-block';
        span.style.opacity = '0';
        span.style.transform = 'translateY(20px)';
        span.style.animation = `fadeInUp 0.5s forwards`;
        span.style.animationDelay = `${i * 0.05}s`;
        el.appendChild(span);
      });
    });
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
