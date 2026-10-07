import { Component, HostListener, OnInit, signal } from '@angular/core';
import { MovieService } from '../movie.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-cards',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cards.component.html',
  styles: [':host { display: block; }'],
})
export class CardsComponent implements OnInit {
  movies: any[] = [];
  trendingMovies: any[] = [];
  upcomingMovies: any[] = [];
  toprated: any[] = [];
  error = '';
  minDate = '';
  maxDate = '';
  currentTab = 'nowPlaying';
  title = 'Actuellement au cinéma';

  nowPlayingDates: any;
  upcomingDates: any;
  isLoading = false;
  hasMore = true;
  isButtonVisible = signal(false);

  selectedRegion = 'BE';
  currentPage = 1;
  readonly tabOrder = ['nowPlaying', 'trending', 'toprated', 'upcoming'];
  readonly regions = [
    { value: 'BE', label: 'Belgique' },
    { value: 'FR', label: 'France' },
    { value: 'US', label: 'États-Unis' },
  ];

  constructor(private movieService: MovieService) {}

  ngOnInit(): void {
    this.fetchMovieData();
    this.updateTitle();
    this.updateDates();
  }

  fetchMovieData(): void {
    const nowPlaying$ = this.movieService.getNowPlayingMovies(this.selectedRegion, this.currentPage);
    const trending$ = this.movieService.getTrending();
    const upcoming$ = this.movieService.getUpcoming(this.selectedRegion, this.currentPage);
    const toprated$ = this.movieService.getTopRated(this.currentPage);

    forkJoin([nowPlaying$, trending$, upcoming$, toprated$]).subscribe({
      next: ([nowPlayingData, trendingData, upcomingData, topratedData]) => {
        this.movies = nowPlayingData.results;
        this.trendingMovies = trendingData.results;
        this.upcomingMovies = upcomingData.results;
        this.toprated = topratedData.items;
        this.nowPlayingDates = nowPlayingData.dates;
        this.upcomingDates = upcomingData.dates;
        this.updateDates();
      },
      error: (error) => {
        this.error = 'Dans 99% des cas, rafraîchir la page résout ce problème, qui est lié à Netlify.';
        console.error(error);
      },
      complete: () => {
        console.log('Données des films récupérées avec succès');
      },
    });
  }

  tabLabel(tab: string): string {
    return tab === 'nowPlaying' ? 'Au cinéma' : tab === 'trending' ? 'Tendances' : tab === 'toprated' ? 'Top notés' : 'Bientôt';
  }

  setRegion(region: string): void {
    this.selectedRegion = region;
    this.fetchMovieData();
  }

  imageUrl(path: string | null | undefined): string {
    return path && /^\/[A-Za-z0-9_.-]{1,100}\.(jpg|jpeg|png|webp)$/.test(path)
      ? `https://image.tmdb.org/t/p/w500${path}`
      : 'https://placehold.co/500x750?text=Aucun+poster';
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollPercentage = (scrollTop / scrollHeight) * 100;
    this.isButtonVisible.set(scrollPercentage > 30);
  }

  selectTab(tab: string): void {
    this.currentTab = tab;
    this.updateTitle();
    this.updateDates();
  }

  updateTitle(): void {
    switch (this.currentTab) {
      case 'nowPlaying':
        this.title = 'Actuellement au cinéma';
        break;
      case 'trending':
        this.title = 'Tendance de la semaine';
        break;
      case 'toprated':
        this.title = 'Les mieux évalués';
        break;
      case 'upcoming':
        this.title = 'Prochaines sorties';
        break;
      default:
        this.title = 'Actuellement au cinéma';
    }
  }

  updateDates(): void {
    switch (this.currentTab) {
      case 'nowPlaying':
        this.minDate = this.nowPlayingDates?.minimum;
        this.maxDate = this.nowPlayingDates?.maximum;
        break;
      case 'trending': {
        const today = new Date();
        const currentDay = today.getDay();
        const currentMonday = new Date(today);
        currentMonday.setDate(today.getDate() - (currentDay - 1));
        const nextMonday = new Date(currentMonday);
        nextMonday.setDate(currentMonday.getDate() + 7);
        this.minDate = currentMonday.toISOString().split('T')[0];
        this.maxDate = nextMonday.toISOString().split('T')[0];
        break;
      }
      case 'upcoming':
        this.minDate = this.upcomingDates?.minimum;
        this.maxDate = this.upcomingDates?.maximum;
        break;
      case 'toprated':
        this.minDate = new Date().toISOString().split('T')[0];
        this.maxDate = new Date().toISOString().split('T')[0];
        break;
      default:
        this.minDate = this.nowPlayingDates?.minimum;
        this.maxDate = this.nowPlayingDates?.maximum;
        break;
    }
  }

  getActiveMovies(): any[] {
    switch (this.currentTab) {
      case 'trending':
        return this.trendingMovies;
      case 'toprated':
        return this.toprated;
      case 'upcoming':
        return this.upcomingMovies;
      case 'nowPlaying':
      default:
        return this.movies;
    }
  }

  getActiveLabel(): string {
    return `${this.getActiveMovies().length} titres à explorer`;
  }

  showRegionSelector(): boolean {
    return this.currentTab === 'nowPlaying' || this.currentTab === 'upcoming';
  }

  trackByMovieId(index: number, movie: any): number {
    return movie.id ?? index;
  }
}
