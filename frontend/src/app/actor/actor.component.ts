import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DiscoverService } from 'app/discover.service';

@Component({
  selector: 'app-actor',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './actor.component.html',
  styleUrl: './actor.component.css'
})
export class ActorComponent {
  actor: any;
  movies: any;
  error: any;
  isLoading: boolean = false;
  showBackToTop: boolean = false;
  hasMore: boolean = true;
  totalPages: number = 0;
  currentPage: number = 1;

  constructor(private route: ActivatedRoute, private discoverService : DiscoverService) {}


  ngOnInit(): void {
    const actorId = this.route.snapshot.paramMap.get('id');
    this.loadFilms(1);
    
    if (actorId) {
      this.getMoviesByActor(+actorId)
    }
  }
  private getMoviesByActor(id: number, page: number = 1): void {
    this.discoverService.getMoviesByActor(id, page).subscribe({
      next: (data) => {
        if (data) {
          this.actor = data.actor || null;
          this.movies = Array.isArray(data.movies) ? data.movies : [];
          this.totalPages = data.totalPages; 
          this.currentPage = data.currentPage;
          this.hasMore = this.currentPage < this.totalPages;
        }
      },
      error: (err) => {
        console.error('Erreur dans la récupération des données', err);
        this.error = 'Erreur dans la récupération des données. Réessayez plus tard.';
      }
    });
  }
  
  loadFilms(page: number): void {
    if (this.isLoading || !this.hasMore || this.actor === null) return;
  
    this.isLoading = true;
  
    this.discoverService.getMoviesByActor(page).subscribe({
      next: (data) => {
        if (data && data.movies && Array.isArray(data.movies)) {
          this.movies = [...this.movies, ...this.shuffle(data.movies)];
          this.totalPages = data.totalPages; 
          this.currentPage = data.currentPage;
          this.hasMore = this.currentPage < this.totalPages;
        } else {
          console.error('Erreur dans la récupération des données', data);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur dans la récupération des données', err);
        this.isLoading = false;
      }
    });
  }
  


  @HostListener('window:scroll', ['$event'])
  onScroll(event: Event): void {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const bodyHeight = document.documentElement.scrollHeight;
  
    if (scrollTop + windowHeight >= bodyHeight - 100) {
      if (this.hasMore) {
        this.loadFilms(this.currentPage + 1);
      }
    }
  
    this.showBackToTop = scrollTop > 50;
  }

  private shuffle(array: any[]): any[] {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
  }
  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

}
