import { CommonModule } from '@angular/common';
import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { DiscoverService } from '../discover.service';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FavoritesService } from '../favorites.service';
import { WatchlistService } from '../watchlist.service';
import { WatchedService } from '../watched.service';
import { AuthService } from '../auth.service';
import { NavbarComponent } from '../navbar/navbar.component'; 

@Component({
  selector: 'app-films',
  standalone: true,
  imports: [CommonModule, MatPaginatorModule, FormsModule, RouterLink],
  templateUrl: './films.component.html',
  styleUrl: './films.component.css'
})
export class FilmsComponent {
  films: any[] = [];
  imageRevealed: boolean = false;

  totalPages: number = 0;
  currentPage: number = 1;
  maxPages: number = 10;
  isLoading: boolean = false;
  hasMore: boolean = true; 
  searchQuery: string = ''; 
  windowScrolled = false;
  showBackToTop: boolean = false;

  movieId!: number;
  isFavorite: boolean = false; 
  isWatchlist: boolean = false; 
  isWatched: boolean = false; 
  isLoggedIn = false;
  nickname: string | null = null;

  constructor(private discoverService: DiscoverService,
    private route: ActivatedRoute,
    private favoritesService: FavoritesService,
    private cdr: ChangeDetectorRef,
    private watchlist: WatchlistService,
    private watched : WatchedService,
    private authService : AuthService,
    private NavbarComponent: NavbarComponent,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.movieId = +params['id']; 
    })
    this.NavbarComponent.navbarClass = 'navbar-default'; 
    this.loadFilms(1);

    this.authService.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status; 
      if (this.isLoggedIn) {
          this.getNickname();
      } else {
        return;
      }
    })
  }
  loadFilms(page: number): void {
    if (this.isLoading || !this.hasMore) return;

    this.isLoading = true;

    this.discoverService.getFilms(page).subscribe({
      next: (data) => {
        if (data.items && Array.isArray(data.items)) {
          this.films = [...this.films, ...this.shuffle(data.items)];
          this.totalPages = data.totalPages; 
          this.currentPage = data.currentPage;
          this.hasMore = this.currentPage < this.totalPages;
        } else {
          console.error('Erreur', data);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur', err);
        this.isLoading = false;
      }
    });
  }
  getNickname(): void {
    if (this.authService.isLoggedIn$) {
      this.authService.getProfil().subscribe({
        next: (response: any) => {
          this.nickname = response.nickname;
        },
        error: (error: any) => {
          this.nickname = '';
        }
      });
    } else {
      this.nickname = '';
    }
  }
  searchFilms(query: string): void {
    if (!query) return;

    this.isLoading = true;
    this.films = []; 

    
    
    this.discoverService.searchFilms(query).subscribe({
      next: (data) => {
        if (data.results && Array.isArray(data.results)) {
          this.films = this.shuffle(data.results);
        } else {
          console.error('Erreur', data);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur sur la searchbar :', err);
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

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  private getRandomPage(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }


  goToPage(page: number, event? : Event): void {
    if (event) {
      event.preventDefault();
    }
    if (page < 1 || page > this.totalPages) return; 
    this.loadFilms(page);
  }

  toggleFavorite(): void {
    if (this.isFavorite) {
      this.removeFromFavorites();
    } else {
      this.addToFavorites();
    }
  }
  toggleWatchlist(): void {
    if (this.isWatchlist) {
      this.removeFromWatchlist();
      
    } else {
      this.addWatchlist();
    }
  }
  
  toggleWatched(): void {
    if (this.isWatched) {
      this.removeWatched();
      
    } else {
      this.addWatched();
    }
  }
  
  
  addToFavorites(): void {
    this.favoritesService.addFavorite(this.movieId).subscribe({
      next: () => {
        console.log('Film ajouté aux favoris');
        this.isFavorite = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors de l\'ajout du film aux favoris :', err);
      }
    });
  }
  
  removeFromFavorites(): void {
    this.favoritesService.removeFavorite(this.movieId).subscribe({
      next: () => {
        console.log('Film retiré des favoris');
        this.isFavorite = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors de la suppression du film des favoris :', err);
      }
    });
  }
  
  checkIfFavorite(): void {
    this.favoritesService.getFavorites().subscribe({
      next: (favorites: { movie_id: number }[]) => {
        const favoriteMovieIds = favorites.map(fav => fav.movie_id);
        this.isFavorite = favoriteMovieIds.includes(this.movieId);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des favoris :', err);
      }
    });
  }
  
  checkIfWatchlist(): void {
    this.watchlist.getWatchlist().subscribe({
      next: (watchlist: { movie_id: number }[]) => {
        const watchlistIds = watchlist.map(watch => watch.movie_id);
        this.isWatchlist = watchlistIds.includes(this.movieId);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Erreur lors de la récupération de la watchlist :', err);
      }
    });
  }
  
  
  addWatchlist(): void {
    console.log('Méthode addWatchlist appelée');
    
    this.watchlist.addWatchlist(this.movieId).subscribe({
      next: () => {
        console.log('Film ajouté à la watchlist');
        this.isWatchlist = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors de l\'ajout du film à la watchlist :', err);
      }
    });
  }
  
  removeFromWatchlist(): void {
    console.log('Méthode removeFromWatchlist appelée');
    this.watchlist.removeFromWatchlist(this.movieId).subscribe({
      next: () => {
        console.log('Film retiré de la watchlist');
        this.isWatchlist = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors de la suppression du film de la watchlist :', err);
      }
    });
  }
  
  checkIfWatched(): void {
    this.watched.getWatched().subscribe({
      next: (watched: { movie_id: number }[]) => {
        const watchedIds = watched.map(watch => watch.movie_id);
        this.isWatched = watchedIds.includes(this.movieId);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Erreur lors de la récupération des films regardés :', err);
      }
    });
  }
  
  
  addWatched(): void {
    console.log('Méthode addWatched appelée');
    this.watched.addWatched(this.movieId).subscribe({
      next: () => {
        console.log('Film ajouté aux films regardés');
        this.isWatched = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors de l\'ajout du film aux films regardés :', err);
      }
    });
  }
  
  removeWatched(): void {
    console.log('Méthode removeFromWatched appelée');
    this.watched.removeWatched(this.movieId).subscribe({
      next: () => {
        console.log('Film retiré des films regardés');
        this.isWatched = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors de la suppression du film des films regardés :', err);
      }
    });
  }
}