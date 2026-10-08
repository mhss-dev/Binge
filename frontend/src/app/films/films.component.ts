import { CommonModule } from '@angular/common';
import { Component, HostListener, ChangeDetectorRef, OnDestroy, signal, ViewChild, ElementRef, inject, NgZone, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { nearBottom, watchScroll } from '../scroll.util';
import { DiscoverService } from '../discover.service';
import { ERAS } from '../match/match.service';
import { RailDirective } from '../rail.directive';

import { FormsModule } from '@angular/forms';
import {
  ActivatedRoute,
  Router,
  RouterLink,
} from '@angular/router';
import { FavoritesService } from '../favorites.service';
import { WatchlistService } from '../watchlist.service';
import { WatchedService } from '../watched.service';
import { AuthService } from '../auth.service';
import { Title } from '@angular/platform-browser';
import { ToastService } from '../toast/toast.service';

@Component({
  selector: 'app-films',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RailDirective],
  templateUrl: './films.component.html',
  styles: [':host { display: block; }'],
})
export class FilmsComponent implements OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private readonly scrollWatch = watchScroll(inject(NgZone), inject(DestroyRef), () => !this.isLoading && this.hasMore && nearBottom(), () => this.loadFilms(this.currentPage + 1));

  private readonly toasts = inject(ToastService);
  films: any[] = [];

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
  selectedGenre: string = '';
  selectedEra: number | null = null;
  readonly eraOptions = ERAS;
  featuredIndex = 0;
  readonly skeletons = Array.from({ length: 12 });
  readonly sortOptions = [
    { value: 'popularity.desc', label: 'Populaires' },
    { value: 'primary_release_date.desc', label: 'Récents' },
    { value: 'primary_release_date.asc', label: 'Anciens' },
    { value: 'popularity.asc', label: 'Moins connus' },
  ];
  private loadToken = 0;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private featuredTimer: ReturnType<typeof setInterval> | null = null;
  readonly genreOptions = [
    { value: '', label: 'Tous les genres' },
    { value: '28', label: 'Action' },
    { value: '12', label: 'Aventure' },
    { value: '16', label: 'Animation' },
    { value: '35', label: 'Comédie' },
    { value: '80', label: 'Crime' },
    { value: '99', label: 'Documentaire' },
    { value: '18', label: 'Drame' },
    { value: '10751', label: 'Famille' },
    { value: '14', label: 'Fantastique' },
    { value: '36', label: 'Histoire' },
    { value: '27', label: 'Horreur' },
    { value: '10402', label: 'Musique' },
    { value: '9648', label: 'Mystère' },
    { value: '10749', label: 'Romance' },
    { value: '878', label: 'Science-fiction' },
    { value: '10770', label: 'Téléfilm' },
    { value: '53', label: 'Thriller' },
    { value: '10752', label: 'Guerre' },
    { value: '37', label: 'Western' },
  ];

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

    this.authService.isLoggedIn$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((status) => {
      this.isLoggedIn = status;
      if (this.isLoggedIn) {
        this.getNickname();
      } else {
        return;
      }
    });
    localStorage.setItem('redirectUrl', window.location.pathname);
    this.startFeatured();
  }

  ngOnDestroy(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    if (this.featuredTimer) {
      clearInterval(this.featuredTimer);
    }
  }

  get featuredList(): any[] {
    return this.films.filter((film) => film.backdrop_path).slice(0, 5);
  }

  get featured(): any | null {
    const list = this.featuredList;
    return list.length > 0 ? list[this.featuredIndex % list.length] : null;
  }

  private startFeatured(): void {
    if (this.featuredTimer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    this.featuredTimer = setInterval(() => {
      const count = this.featuredList.length;
      if (count > 1 && !document.hidden) {
        this.featuredIndex = (this.featuredIndex + 1) % count;
        this.cdr.detectChanges();
      }
    }, 7000);
  }

  pickFeatured(index: number): void {
    this.featuredIndex = index;
    if (this.featuredTimer) {
      clearInterval(this.featuredTimer);
      this.featuredTimer = null;
    }
    this.startFeatured();
  }

  imageUrl(path: string | null | undefined, size: string): string {
    return path && /^\/[A-Za-z0-9_.-]{1,100}\.(jpg|jpeg|png|webp)$/.test(path)
      ? `https://image.tmdb.org/t/p/${size}${path}`
      : 'https://placehold.co/500x750?text=Aucun+poster+disponible';
  }

  reload(): void {
    this.loadToken++;
    this.isLoading = false;
    this.hasMore = true;
    this.currentPage = 1;
    this.featuredIndex = 0;
    this.films = [];
    this.loadFilms(1);
  }

  setGenre(value: string): void {
    this.selectedGenre = value;
    this.searchQuery = '';
    this.reload();
  }

  setEra(value: number | null): void {
    this.selectedEra = this.selectedEra === value ? null : value;
    this.searchQuery = '';
    this.reload();
  }

  setSort(value: string): void {
    this.sortOption = value;
    this.searchQuery = '';
    this.reload();
  }

  onSearchInput(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => this.searchFilms(this.searchQuery), 300);
  }

  loadFilms(page: number): void {
    if (this.isLoading || !this.hasMore) return;

    this.isLoading = true;
    const token = this.loadToken;

    this.discoverService
      .getFilms(page, false, this.sortOption, this.selectedGenre, undefined, this.selectedEra)
      .subscribe({
        next: (data) => {
          if (token !== this.loadToken) {
            return;
          }
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
          if (token !== this.loadToken) {
            return;
          }
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
    if (!query?.trim()) {
      this.reload();
      return;
    }

    this.loadToken++;
    const token = this.loadToken;
    this.isLoading = true;
    this.hasMore = false;
    this.featuredIndex = 0;
    this.films = [];

    this.discoverService.searchFilms(query).subscribe({
      next: (data) => {
        if (token !== this.loadToken) {
          return;
        }
        if (data.results && Array.isArray(data.results)) {
          this.films = this.shuffle(data.results);
        } else {
          console.error('Erreur', data);
        }
        this.isLoading = false;
      },
      error: (err) => {
        if (token !== this.loadToken) {
          return;
        }
        console.error('Erreur sur la searchbar :', err);
        this.isLoading = false;
      },
    });
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.sortOption = 'popularity.desc';
    this.selectedGenre = '';
    this.selectedEra = null;
    this.reload();
  }

  hasActiveFilters(): boolean {
    return Boolean(this.searchQuery || this.selectedGenre || this.selectedEra || this.sortOption !== 'popularity.desc');
  }

  trackByMovieId(index: number, movie: any): number {
    return movie.id ?? index;
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
      this.showToast('Connecte-toi pour utiliser tes listes');
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
      this.showToast(`${movie.title} est déjà dans vos favoris`);
      return;
    }

    this.favoritesService.addFavorite(movieId).subscribe({
      next: () => {
        const movie = this.films.find((m) => m.id === movieId);
        if (movie) {
          const leftWatchlist = movie.isWatchlist;
          movie.isFavorite = true;
          movie.isWatched = true;
          movie.isWatchlist = false;
          this.showToast(`${movie.title} ajouté aux favoris et aux vus${leftWatchlist ? ', retiré de la watchlist' : ''}`);
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        if (err.status === 400) {
          this.showToast('Ce film est déjà dans vos favoris');
        } else {
          this.showToast(`Erreur lors de l'ajout aux favoris. Êtes-vous connecté(e) ?`);
          console.error('Erreur ajout aux favoris', err);
        }
      },
    });
  }

  showToast(message: string): void {
    this.toasts.show(message);
  }

  removeFromFavorites(movieId: number): void {
    const isCurrentlyFavorite = this.films.find(
      (movie) => movie.id === movieId
    )?.isFavorite;
    if (!isCurrentlyFavorite) {
      this.showToast("Ce film n'est pas dans vos favoris");
      return;
    }

    this.favoritesService.removeFavorite(movieId).subscribe({
      next: () => {
        const movie = this.films.find((m) => m.id === movieId);
        if (movie) {
          movie.isFavorite = false;
          this.showToast(`${movie.title} retiré des favoris`);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.showToast('Erreur lors de la suppression des favoris. Êtes-vous connecté(e) ?');
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
      this.showToast('Ce film est déjà dans votre watchlist');
      return;
    }

    this.watchlist.addWatchlist(movieId).subscribe({
      next: () => {
        const movie = this.films.find((m) => m.id === movieId);
        if (movie) {
          const leftWatched = movie.isWatched;
          if (leftWatched) {
            this.removeWatched(movieId);
          }
          movie.isWatchlist = true;
          this.showToast(`${movie.title} ajouté à la watchlist${leftWatched ? ', retiré des vus' : ''}`);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.showToast("Erreur lors de l'ajout à la watchlist. Êtes-vous connecté(e) ?");
      },
    });
  }

  removeFromWatchlist(movieId: number): void {
    const isCurrentlyInWatchlist = this.films.find(
      (movie) => movie.id === movieId
    )?.isWatchlist;
    if (!isCurrentlyInWatchlist) {
      this.showToast("Ce film n'est pas dans votre watchlist");
      return;
    }

    this.watchlist.removeFromWatchlist(movieId).subscribe({
      next: () => {
        const movie = this.films.find((m) => m.id === movieId);
        if (movie) {
          movie.isWatchlist = false;
          this.showToast(`${movie.title} retiré de la watchlist`);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.showToast("Erreur lors de la suppression de la watchlist. Êtes-vous connecté(e) ?");
      },
    });
  }

  toggleWatchlist(movieId: number): void {
    const movie = this.films.find((m) => m.id === movieId);

    if (!this.isLoggedIn) {
      this.showToast('Connecte-toi pour utiliser tes listes');
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
      this.showToast('Connecte-toi pour utiliser tes listes');
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
      this.showToast('Ce film est déjà dans vos vus');
      return;
    }

    this.watched.addWatched(movieId).subscribe({
      next: () => {
        const movie = this.films.find((m) => m.id === movieId);
        if (movie) {
          const leftWatchlist = movie.isWatchlist;
          movie.isWatched = true;
          movie.isWatchlist = false;
          this.showToast(`${movie.title} marqué comme vu${leftWatchlist ? ', retiré de la watchlist' : ''}`);
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        if (err.status === 400) {
          this.showToast('Ce film est déjà dans vos vus');
        } else {
          this.showToast("Erreur lors de l'ajout aux films vus. Êtes-vous connecté(e) ?");
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
      this.showToast("Ce film n'est pas dans vos vus");
      return;
    }

    this.watched.removeWatched(movieId).subscribe({
      next: () => {
        const movie = this.films.find((m) => m.id === movieId);
        if (movie) {
          movie.isWatched = false;
          this.showToast(`${movie.title} retiré des vus`);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.showToast('Erreur lors de la suppression des films vus.');
      },
    });
  }
}
