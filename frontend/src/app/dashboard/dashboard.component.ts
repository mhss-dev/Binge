import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router, RouterLink } from '@angular/router';
import { FavoritesService } from '../favorites.service';
import { WatchlistService } from '../watchlist.service';
import { WatchedService } from '../watched.service';
import { DetailsService } from '../details.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  nickname: string | null = null;
  movie: any = null;
  favorites: any[] = [];
  watchlist: any[] = [];
  watched: any[] = [];

  moviesPerPage = 45;
  combinedMovies: any=[];

  currentFavoritesPage = 1;
  currentWatchlistPage = 1;
  currentWatchedPage = 1;

  constructor(
    private router: Router, 
    private authService: AuthService, 
    private watchedService: WatchedService, 
    private watchlistService: WatchlistService, 
    private favoritesService: FavoritesService, 
    private cdr: ChangeDetectorRef,
    private detailsService: DetailsService

  ) {}

  ngOnInit(): void {
    this.authService.getProfil().subscribe(response => {
      JSON.stringify(response);
      this.nickname = response.nickname;
    });
    
    this.fetchFavorites();
    this.fetchWatchlist();
    this.fetchWatched();
    this.combineMovies();

  }

  
  fetchFavorites(): void {
    this.favoritesService.getFavorites().subscribe({
      next: (favorites: any[]) => {
        const movieIds = favorites.map(fav => fav.movie_id);
        const requests = movieIds.map(id => this.detailsService.getMovieByID(id));
        
        forkJoin(requests).subscribe({
          next: (movies) => {
            this.favorites = movies;
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Error fetching movie details:', err);
          }
        });
      },
      error: (err) => {
        console.error('Error fetching favorites:', err);
      }
    });
  }

  fetchWatchlist(): void {
    this.watchlistService.getWatchlist().subscribe({
      next: (watchlist: any[]) => {
        const movieIds = watchlist.map(item => item.movie_id);
        const requests = movieIds.map(id => this.detailsService.getMovieByID(id));
        
        forkJoin(requests).subscribe({
          next: (movies) => {
            this.watchlist = movies;
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Erreur lors de la récupération des détails du film :', err);
          }
        });
      },
      error: (err) => {
        console.error('Erreur lors de la récupération de la watchlist :', err);
      }
    });
  }


  fetchWatched(): void {
    this.watchedService.getWatched().subscribe({
      next: (watched: any[]) => {
        const movieIds = watched.map(item => item.movie_id);
        const requests = movieIds.map(id => this.detailsService.getMovieByID(id));
        
        forkJoin(requests).subscribe({
          next: (movies) => {
            this.watched = movies;
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Erreur lors de la récupération des détails du film :', err);
          }
        });
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des films regardés :', err);
      }

    });
  }


  @HostListener('window:scroll', ['$event'])
  onScroll(event: any): void {
    const button = document.getElementById('back-to-top');
    if (button) {
      if (window.scrollY > 300) {
        button.classList.add('show');
      } else {
        button.classList.remove('show');
      }
    }
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
onLogout(): void {
  this.authService.logout().subscribe({
    next: () => {
      this.router.navigate(['login']); 
    },
    error: (err) => {
      console.error('Erreur lors de la déconnexion:', err);
    }
  });
}

combineMovies() {
  this.combinedMovies = [
    ...this.favorites.map(movie => ({ ...movie, type: 'Favorite' })),
    ...this.watchlist.map(movie => ({ ...movie, type: 'Watchlist' })),
    ...this.watched.map(movie => ({ ...movie, type: 'Watched' })),
  ];
}

getTotalPages(arrayLength: number): number[] {
  return Array(Math.ceil(arrayLength / this.moviesPerPage))
    .fill(0)
    .map((_, i) => i + 1);
}

get totalFavoritesPages(): number[] {
  return this.getTotalPages(this.favorites.length);
}

get totalWatchlistPages(): number[] {
  return this.getTotalPages(this.watchlist.length);
}

get totalWatchedPages(): number[] {
  return this.getTotalPages(this.watched.length);
}

paginatedFavorites() {
  const startIndex = (this.currentFavoritesPage - 1) * this.moviesPerPage;
  return this.favorites.slice(startIndex, startIndex + this.moviesPerPage);
}

paginatedWatchlist() {
  const startIndex = (this.currentWatchlistPage - 1) * this.moviesPerPage;
  return this.watchlist.slice(startIndex, startIndex + this.moviesPerPage);
}

paginatedWatched() {
  const startIndex = (this.currentWatchedPage - 1) * this.moviesPerPage;
  return this.watched.slice(startIndex, startIndex + this.moviesPerPage);
}

previousFavoritesPage() {
  if (this.currentFavoritesPage > 1) {
    this.currentFavoritesPage--;
  }
}

nextFavoritesPage() {
  if (this.currentFavoritesPage < this.totalFavoritesPages.length) {
    this.currentFavoritesPage++;
  }
}

goToFavoritesPage(pageNumber: number) {
  this.currentFavoritesPage = pageNumber;
}

previousWatchlistPage() {
  if (this.currentWatchlistPage > 1) {
    this.currentWatchlistPage--;
  }
}

nextWatchlistPage() {
  if (this.currentWatchlistPage < this.totalWatchlistPages.length) {
    this.currentWatchlistPage++;
  }
}

goToWatchlistPage(pageNumber: number) {
  this.currentWatchlistPage = pageNumber;
}

previousWatchedPage() {
  if (this.currentWatchedPage > 1) {
    this.currentWatchedPage--;
  }
}

nextWatchedPage() {
  if (this.currentWatchedPage < this.totalWatchedPages.length) {
    this.currentWatchedPage++;
  }
}

goToWatchedPage(pageNumber: number) {
  this.currentWatchedPage = pageNumber;
}
}