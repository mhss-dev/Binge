import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FavoritesService } from '../favorites.service';
import { WatchlistService } from '../watchlist.service';
import { WatchedService } from '../watched.service';
import { DetailsService } from '../details.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { UserService } from 'app/services/user.service';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  nickname: string = '';
  movie: any = null;
  favorites: any[] = [];
  watchlist: any[] = [];
  watched: any[] = [];
  currentUserNickname: string = ''; 

  moviesPerPage = 45;
  combinedMovies: any=[];

  currentFavoritesPage = 1;
  currentWatchlistPage = 1;
  currentWatchedPage = 1;

  newNickname: string = '';
  errorMessage: string | null = null;
  isLoggedIn: boolean | undefined;


  constructor(
    private router: Router, 
    private authService: AuthService, 
    private watchedService: WatchedService, 
    private watchlistService: WatchlistService, 
    private favoritesService: FavoritesService, 
    private cdr: ChangeDetectorRef,
    private detailsService: DetailsService,
    private userService: UserService,
    private route: ActivatedRoute,
  ) {}
  
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const routeNickname = params.get('nickname');
  
      if (routeNickname) {
        
        this.authService.getProfil(routeNickname).subscribe({
          next: (response: any) => {
            this.nickname = response?.nickname ?? '';
            
            this.fetchFavorites();
            this.fetchWatchlist();
            this.fetchWatched();
            this.combineMovies();
          },
          error: (error: any) => {
            console.error('Erreur lors de la récupération du profil:', error);
            this.nickname = '';  
          }
        });
      } else {
        
        this.authService.getProfil().subscribe({
          next: (response: any) => {
            this.nickname = response?.nickname ?? '';
          },
          error: (error: any) => {
            console.error('Erreur lors de la récupération du profil:', error);
            this.nickname = ''; 
          }
        });  
      }
    });

  }
  

  
  fetchFavorites(): void {
    const routeNickname = this.route.snapshot.paramMap.get('nickname');
    
    this.favoritesService.getFavorites(routeNickname|| undefined).subscribe({
      next: (favorites: any[]) => {
        const movieIds = favorites.map(fav => fav.movie_id);
        const requests = movieIds.map(id => this.detailsService.getMovieByID(id));
        
        forkJoin(requests).subscribe({
          next: (movies) => {
            this.favorites = movies;
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Erreur sur la récupération des favoris:', err);
          }
        });
      },
      error: (err) => {
        console.error('Erreur sur la récupération des favoris:', err);
      }
    });
  }  
  
  
  fetchWatchlist(): void {
    const routeNickname = this.route.snapshot.paramMap.get('nickname');

    this.watchlistService.getWatchlist(routeNickname|| undefined).subscribe({
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
    const routeNickname = this.route.snapshot.paramMap.get('nickname');

    this.watchedService.getWatched(routeNickname|| undefined).subscribe({
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

  handleEnter(event: KeyboardEvent): void {
    this.onSaveNewNickname();
  }

  onSaveNewNickname(): void {
    this.authService.changeNickname(this.newNickname).subscribe({
      next: (response) => {
        console.log('Pseudo mis à jour :', response);
        
        
        this.userService.updateNickname(this.newNickname); 
        
        
        this.errorMessage = null;
        
        
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur de mise à jour du pseudo :', err); 
        this.errorMessage = 'Votre pseudonyme est invalide ou dépasse 20 caractères.';
        
        
        this.cdr.detectChanges();
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

combineMovies() : void {
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