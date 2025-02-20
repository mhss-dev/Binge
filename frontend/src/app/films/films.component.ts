import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  HostListener,
  ChangeDetectorRef,
  signal,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { DiscoverService } from '../discover.service';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { FormsModule } from '@angular/forms';
import {
  ActivatedRoute,
  NavigationStart,
  Router,
  RouterLink,
} from '@angular/router';
import { FavoritesService } from '../favorites.service';
import { WatchlistService } from '../watchlist.service';
import { WatchedService } from '../watched.service';
import { AuthService } from '../auth.service';
import { Title } from '@angular/platform-browser';
import { Toast } from 'bootstrap'; // Import de Bootstrap Toast

@Component({
  selector: 'app-films',
  standalone: true,
  imports: [CommonModule, MatPaginatorModule, FormsModule, RouterLink],
  templateUrl: './films.component.html',
  styleUrl: './films.component.css',
})
export class FilmsComponent {
  @ViewChild('toastElement', { static: false }) toastElement!: ElementRef;

  toastMessage: string = '';
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
  isButtonVisible = signal(false);
  selectedGenre: string = '';

  constructor(
    private discoverService: DiscoverService,
    private route: ActivatedRoute,
    private favoritesService: FavoritesService,
    private cdr: ChangeDetectorRef,
    private watchlist: WatchlistService,
    private watched: WatchedService,
    private router: Router,
    private authService: AuthService,
    private titleService: Title
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.movieId = +params['id'];
      this.loadFilms(1);
      this.titleService.setTitle('Binge • social & découverte de films');
    });

    this.authService.isLoggedIn$.subscribe((status) => {
      this.isLoggedIn = status;
      if (this.isLoggedIn) {
        this.getNickname();
      } else {
        return;
      }
    });
  }

  loadFilms(page: number): void {
    if (this.isLoading || !this.hasMore) return;

    this.isLoading = true;

    this.discoverService
      .getFilms(page, false, this.sortOption, this.selectedGenre)
      .subscribe({
        next: (data) => {
          if (data.items && Array.isArray(data.items)) {
            this.films =
              page === 1 ? [...data.items] : [...this.films, ...data.items];
            this.totalPages = data.totalPages;
            this.currentPage = page;
            this.hasMore = this.currentPage < this.totalPages;
            this.checkIfFavorites();
            this.checkIfWatched();
            this.checkIfWatchlist();
            this.cdr.detectChanges();
          } else {
            console.error(data);
          }
          this.cdr.detectChanges();
          this.isLoading = false;
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;
        },
      });
  }

  getNickname(): void {
    if (this.authService.isLoggedIn$) {
      this.authService.getProfil().subscribe({
        next: (response: any) => {
          this.nickname = response.nickname;
        },
        error: (error: any) => {
          console.error('Erreur lors de la récupération du profil:', error);
          this.nickname = '';
        },
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
      },
    });
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(event: Event): void {
    if (this.isLoading || !this.hasMore) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const windowHeight =
      window.innerHeight || document.documentElement.clientHeight;
    const bodyHeight = document.documentElement.scrollHeight;

    if (scrollTop + windowHeight >= bodyHeight - 100) {
      this.loadFilms(this.currentPage + 1);
    }

    const scrollPercentage = (scrollTop / (bodyHeight - windowHeight)) * 100;

    this.isButtonVisible.set(scrollPercentage > 45);
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // saveScrollPosition(): void {
  //   sessionStorage.setItem('scrollPosition', window.scrollY.toString());
  //   console.log('Saved scroll position:', window.scrollY);
  // }

  // restoreScrollPosition(): void {
  //   const scrollPosition = sessionStorage.getItem('scrollPosition');
  //   if (scrollPosition) {
  //     window.scrollTo(0, +scrollPosition);
  //     console.log('Restored scroll position:', scrollPosition);
  //   }
  // }

  // ngOnDestroy(): void {
  //   this.saveScrollPosition();
  // }

  private shuffle(array: any[]): any[] {
    let currentIndex = array.length,
      randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex],
      ];
    }
    return array;
  }

  private getRandomPage(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  toggleFavorite(movieId: number): void {
    const movie = this.films.find((m) => m.id === movieId);

    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }

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
    const isCurrentlyFavorite = this.films.find(
      (movie) => movie.id === movieId
    )?.isFavorite;

    if (isCurrentlyFavorite) {
      const movie = this.films.find((m) => m.id === movieId);
      this.showToast(movie.title + ` est déjà dans vos favoris`);
      return;
    }

    this.favoritesService.addFavorite(movieId).subscribe({
      next: () => {
        const movie = this.films.find((m) => m.id === movieId);
        if (movie) {
          movie.isFavorite = true;
          this.showToast(movie.title + ` a été ajouté dans vos favoris`);
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        if (err.status === 400) {
          this.showToast(`Erreur: Le film est déjà dans les favoris.`);
        } else {
          this.showToast(`Erreur lors de l'ajout aux favoris.`);
          console.error('Erreur ajout aux favoris', err);
        }
      },
    });
  }

  showToast(message: string): void {
    this.toastMessage = message;
    this.cdr.detectChanges();
    const toast = new Toast(this.toastElement.nativeElement);
    toast.show();
  }

  removeFromFavorites(movieId: number): void {
    const isCurrentlyFavorite = this.films.find(
      (movie) => movie.id === movieId
    )?.isFavorite;
    if (!isCurrentlyFavorite) {
      this.showToast("Le film n'est pas dans vos favoris !");
      return;
    }

    this.favoritesService.removeFavorite(movieId).subscribe({
      next: () => {
        const movie = this.films.find((m) => m.id === movieId);
        if (movie) {
          movie.isFavorite = false;
          this.showToast(movie.title + ` a été retiré de vos favoris`);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.showToast('Erreur lors de la suppression des favoris.');
        console.error('Erreur lors de la suppression des favoris:', err);
      },
    });
  }

  checkIfFavorites(): void {
    this.favoritesService.getFavorites().subscribe({
      next: (favorites: { movie_id: number }[]) => {
        const favoritesMovieIds = favorites.map((item) => item.movie_id);

        this.films.forEach((movie) => {
          movie.isFavorite = favoritesMovieIds.includes(movie.id);
        });

        this.cdr.detectChanges();
      },
      error: (err) => {},
    });
  }

  addWatchlist(movieId: number): void {
    const isCurrentlyInWatchlist = this.films.find(
      (movie) => movie.id === movieId
    )?.isWatchlist;
    if (isCurrentlyInWatchlist) {
      this.showToast('Le film est déjà dans votre watchlist !');
      return;
    }

    this.watchlist.addWatchlist(movieId).subscribe({
      next: () => {
        const movie = this.films.find((m) => m.id === movieId);
        if (movie) {
          this.removeWatched(movieId);
          movie.isWatchlist = true;
          this.showToast(movie.title + ` a été ajouté dans votre watchlist`);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.showToast("Erreur lors de l'ajout à la watchlist.");
      },
    });
  }

  removeFromWatchlist(movieId: number): void {
    const isCurrentlyInWatchlist = this.films.find(
      (movie) => movie.id === movieId
    )?.isWatchlist;
    if (!isCurrentlyInWatchlist) {
      this.showToast("Le film n'est pas dans votre watchlist !");
      return;
    }

    this.watchlist.removeFromWatchlist(movieId).subscribe({
      next: () => {
        const movie = this.films.find((m) => m.id === movieId);
        if (movie) {
          movie.isWatchlist = false;
          this.showToast(movie.title + ` a été retiré de votre watchlist`);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.showToast('Erreur lors de la suppression de la watchlist.');
      },
    });
  }

  toggleWatchlist(movieId: number): void {
    const movie = this.films.find((m) => m.id === movieId);

    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }

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
        const watchlistMovieIds = watchlist.map((item) => item.movie_id);

        this.films.forEach((movie) => {
          movie.isWatchlist = watchlistMovieIds.includes(movie.id);
        });

        this.cdr.detectChanges();
      },
      error: (err) => {},
    });
  }

  toggleWatched(movieId: number): void {
    const movie = this.films.find((m) => m.id === movieId);

    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }
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
        const watchedIds = watched.map((watch) => watch.movie_id);

        this.films.forEach((movie) => {
          movie.isWatched = watchedIds.includes(movie.id);
        });

        this.cdr.detectChanges();
      },
      error: (err: any) => {},
    });
  }

  addWatched(movieId: number): void {
    const isCurrentlyWatched = this.films.find(
      (movie) => movie.id === movieId
    )?.isWatched;
    if (isCurrentlyWatched) {
      this.showToast('Le film est déjà marqué comme vu !');
      return;
    }

    this.watched.addWatched(movieId).subscribe({
      next: () => {
        const movie = this.films.find((m) => m.id === movieId);
        if (movie) {
          movie.isWatched = true;
          this.removeFromWatchlist(movieId);
          this.showToast(movie.title + ` a été ajouté dans vos films vus !`);
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        if (err.status === 400) {
          this.showToast(`Erreur : Le film est déjà dans les films vus.`);
        } else {
          this.showToast("Erreur lors de l'ajout aux films vus.");
          console.error('Erreur ajout aux films vus', err);
        }
      },
    });
  }

  removeWatched(movieId: number): void {
    const isCurrentlyWatched = this.films.find(
      (movie) => movie.id === movieId
    )?.isWatched;
    if (!isCurrentlyWatched) {
      this.showToast("Le film n'est pas marqué comme vu !");
      return;
    }

    this.watched.removeWatched(movieId).subscribe({
      next: () => {
        const movie = this.films.find((m) => m.id === movieId);
        if (movie) {
          movie.isWatched = false;
          this.showToast(movie.title + ` a été retiré de vos films vus !`);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.showToast('Erreur lors de la suppression des films vus.');
      },
    });
  }
}
