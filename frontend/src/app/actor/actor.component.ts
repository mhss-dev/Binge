import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, signal, inject, NgZone, DestroyRef } from '@angular/core';
import { nearBottom, watchScroll } from '../scroll.util';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DiscoverService } from 'app/discover.service';
import { DomSanitizer, SafeResourceUrl, Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-actor',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './actor.component.html',
  styleUrl: './actor.component.css'
})
export class ActorComponent {
  private readonly scrollWatch = watchScroll(inject(NgZone), inject(DestroyRef), () => !this.isLoading && this.hasMore && nearBottom(), () => this.loadFilms(this.currentPage + 1));
  actor: any;
  movies: any = [];
  error: any;
  isLoading: boolean = false;
  showBackToTop: boolean = false;
  hasMore: boolean = true;
  totalPages: number = 0;
  currentPage: number = 1;
  expanded: boolean = false; 
  maxBiographyLength: number = 500;

  constructor(private route: ActivatedRoute, private discoverService : DiscoverService, private cdr: ChangeDetectorRef, private titleService: Title, private metaService: Meta,) {}

  ngOnInit(): void {
    
    this.route.paramMap.subscribe((paramMap) => {
      const actorId = +paramMap.get('id')!;
      if (actorId) {
        this.getMoviesByActor(actorId, 1);
      }
    });
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
          if (this.actor) {
            this.updateMetaTags();
          }
        }
      },
      error: (err) => {
        console.error('Erreur dans la récupération des données', err);
        this.error = 'Erreur dans la récupération des données. Réessayez plus tard.';
      }
    });
  }
  
  loadFilms(page: number): void {
    
    if (this.isLoading || !this.hasMore || !this.actor || !this.actor.id) return;
  
    this.isLoading = true;
  
    this.discoverService.getMoviesByActor(this.actor.id, page).subscribe({
      next: (data) => {
        if (data && data.movies && Array.isArray(data.movies)) {
          this.movies = [...this.movies, ...this.filterDuplicates(data.movies)];
          this.totalPages = data.totalPages;
          this.currentPage = data.currentPage;
          this.hasMore = this.currentPage < this.totalPages;
        }
        this.isLoading = false; 
      },
      error: (err) => {
        console.error('Error fetching movies', err);
        this.isLoading = false; 
      }
    });
  }
  

  

  private updateMetaTags(): void {
    if (!this.actor) return;
  
    this.titleService.setTitle(this.actor.name ? 'Binge - ' + this.actor.name : 'Binge');
  
    this.metaService.updateTag({ name: 'description', content: this.actor.biography || 'Aucune description disponible.' });
    this.metaService.updateTag({ property: 'og:title', content: 'Binge - ' + this.actor.name });
    this.metaService.updateTag({ property: 'og:description', content: this.actor.biography || '' });
    this.metaService.updateTag({ property: 'og:image', content: 'https://image.tmdb.org/t/p/original/' + this.actor.profile_path });
  }

  private filterDuplicates(newMovies: any[]): any[] {
    const existingIds = new Set(this.movies.map((movie:any) => movie.id));
    return newMovies.filter(movie => !existingIds.has(movie.id));
  }

  getAge(birthday: string | null): number | string {
    if (!birthday) return '???';
    
    const birthDate = new Date(birthday);
    const timeDiff = Math.abs(Date.now() - birthDate.getTime()); 
    const age = Math.floor((timeDiff / (1000 * 3600 * 24)) / 365.25);
    return age + ' ans';
  }
  

}
