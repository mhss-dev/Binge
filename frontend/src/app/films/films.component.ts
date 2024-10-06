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
  sortOption: string = 'popularity.desc';

  

  constructor(private discoverService: DiscoverService,
    private route: ActivatedRoute,
    private favoritesService: FavoritesService,
    private cdr: ChangeDetectorRef,
    private watchlist: WatchlistService,
    private watched : WatchedService,
    private authService : AuthService,
  ) {}

  ngOnInit(): void {

    
    this.route.params.subscribe(params => {
      this.movieId = +params['id'];
      this.loadFilms(1); 
    });

    
    
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
    
    this.discoverService.getFilms(page, false, this.sortOption).subscribe({
      next: (data) => {
        if (data.items && Array.isArray(data.items)) {
          this.films = page === 1 ? [...data.items] : [...this.films, ...data.items];
          this.totalPages = data.totalPages;
          this.currentPage = page; 
          this.hasMore = this.currentPage < this.totalPages;
          this.checkIfFavorites(); 
          this.checkIfWatched(); 
          this.checkIfWatchlist(); 

          
        } else {
          console.error(data);
        }
        this.cdr.detectChanges();
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
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

  restoreScrollPosition(): void {
    const scrollPosition = sessionStorage.getItem('scrollPosition');
    if (scrollPosition) {
      window.scrollTo(0, +scrollPosition);
    }
  }
  @HostListener('window:scroll', ['$event'])
  onScroll(event: Event): void {
    if (this.isLoading || !this.hasMore) return;
  
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const bodyHeight = document.documentElement.scrollHeight;
  
    if (scrollTop + windowHeight >= bodyHeight - 100) {
      this.loadFilms(this.currentPage + 1);
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


  toggleFavorite(movieId: number): void {
    const movie = this.films.find(m => m.id === movieId);
  
    if (!movie) {
      return;
    }
  
  
    if (movie.isFavorite) {
      this.removeFromFavorites(movieId);
    } else {
      this.addToFavorites(movieId);
    }
  }

  addToFavorites(movieId: number): void {
    const isCurrentlyFavorite = this.films.find(movie => movie.id === movieId)?.isFavorite;
  
    if (isCurrentlyFavorite) {
      return;
    }
  
    this.favoritesService.addFavorite(movieId).subscribe({
      next: () => {
        const movie = this.films.find(m => m.id === movieId);
        if (movie) {
          movie.isFavorite = true;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
      }
    });
  }
  
  
  removeFromFavorites(movieId: number): void {
    const isCurrentlyFavorite = this.films.find(movie => movie.id === movieId)?.isFavorite;

    if (!isCurrentlyFavorite) {
        return;
    }

    this.favoritesService.removeFavorite(movieId).subscribe({
        next: () => {
            const movie = this.films.find(m => m.id === movieId);
            if (movie) {
                movie.isFavorite = false; 
            }
            this.cdr.detectChanges();
        },
        error: (err) => {
        }
    });
}

  
  
  checkIfFavorites(): void {
    this.favoritesService.getFavorites().subscribe({
      next: (favorites: { movie_id: number }[]) => {
        const favoriteMovieIds = favorites.map(fav => fav.movie_id);
  
        
        this.films.forEach(movie => {
          movie.isFavorite = favoriteMovieIds.includes(movie.id);
        });
  
        this.cdr.detectChanges(); 
      },
      error: (err) => {
      }
    });
  }
  

    

addWatchlist(movieId: number): void {

  const isCurrentlyInWatchlist = this.films.find(movie => movie.id === movieId)?.isWatchlist; 

  if (isCurrentlyInWatchlist) {
      return; 
  }

  this.watchlist.addWatchlist(movieId).subscribe({
      next: () => {
          const movie = this.films.find(m => m.id === movieId);
          if (movie) {
              movie.isWatchlist = true; 
          }
          this.cdr.detectChanges();
      },
      error: (err) => {
      }
  });
}


removeFromWatchlist(movieId: number): void {

  const isCurrentlyInWatchlist = this.films.find(movie => movie.id === movieId)?.isWatchlist; 

  if (!isCurrentlyInWatchlist) {
      return; 
  }

  this.watchlist.removeFromWatchlist(movieId).subscribe({
      next: () => {
          const movie = this.films.find(m => m.id === movieId);
          if (movie) {
              movie.isWatchlist = false; 
          }
          this.cdr.detectChanges();
      },
      error: (err) => {
      }
  });
}


toggleWatchlist(movieId: number): void {
    const movie = this.films.find(m => m.id === movieId);

    if (!movie) {
        return;
    }

    if (movie.isWatchlist) {
        this.removeFromWatchlist(movieId);
    } else {
        this.addWatchlist(movieId);
    }
}


checkIfWatchlist(): void {
    this.watchlist.getWatchlist().subscribe({
      next: (watchlist: { movie_id: number }[]) => {
        const watchlistMovieIds = watchlist.map(item => item.movie_id);

        
        this.films.forEach(movie => {
          movie.isWatchlist = watchlistMovieIds.includes(movie.id);
        });

        this.cdr.detectChanges(); 
      },
      error: (err) => {
      }
    });
}


  

toggleWatched(movieId: number): void {
  const movie = this.films.find(m => m.id === movieId);

  if (!movie) {
      return;
  }

  if (movie.isWatched) {
      this.removeWatched(movieId);
  } else {
      this.addWatched(movieId);
  }
}


checkIfWatched(): void {
  this.watched.getWatched().subscribe({
      next: (watched: { movie_id: number }[]) => {
          const watchedIds = watched.map(watch => watch.movie_id);
          
          
          this.films.forEach(movie => {
              movie.isWatched = watchedIds.includes(movie.id);
          });

          this.cdr.detectChanges(); 
      },
      error: (err: any) => {
      }
  });
}


addWatched(movieId: number): void {

  const isCurrentlyWatched = this.films.find(movie => movie.id === movieId)?.isWatched; 

  if (isCurrentlyWatched) {
      return; 
  }

  this.watched.addWatched(movieId).subscribe({
      next: () => {
          const movie = this.films.find(m => m.id === movieId);
          if (movie) {
              movie.isWatched = true; 
          }
          this.cdr.detectChanges();
      },
      error: (err) => {
      }
  });
}


removeWatched(movieId: number): void {

  const isCurrentlyWatched = this.films.find(movie => movie.id === movieId)?.isWatched; 

  if (!isCurrentlyWatched) {
      return; 
  }

  this.watched.removeWatched(movieId).subscribe({
      next: () => {
          const movie = this.films.find(m => m.id === movieId);
          if (movie) {
              movie.isWatched = false; 
          }
          this.cdr.detectChanges();
      },
      error: (err) => {
      }
  });
}
}