import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { nearBottom, watchScroll } from '../scroll.util';
import { SeriesService } from '../series.service';
import { SerieList, SerieLists, SeriesListsService } from '../series-lists.service';
import { AuthService } from '../auth.service';
import { ToastService } from '../toast/toast.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ERAS } from '../match/match.service';
import { RailDirective } from '../rail.directive';
import { readFilters, switchParams } from '../discover-kind';
import { RANDOM_SORT, ShownMemory, randomPageOrder, readFlag, saveFlag, shuffle } from '../discover-shuffle';
import { Observable, map, of, switchMap } from 'rxjs';

// "Au hasard" only draws from series with enough votes, or most pages would be near-empty unknowns.
const RANDOM_MIN_VOTES = 100;

@Component({
  selector: 'app-series',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RailDirective],
  templateUrl: './series.component.html',
  styleUrl: './series.component.css'
})
export class SeriesComponent implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private readonly toasts = inject(ToastService);
  private readonly scrollWatch = watchScroll(inject(NgZone), inject(DestroyRef), () => !this.isLoading && this.hasMore && nearBottom(), () => this.loadSeries(this.currentPage + 1));

  series: any[] = [];
  readonly kind: 'films' | 'series' = 'series';
  totalPages = 0;
  currentPage = 1;
  isLoading = false;
  hasMore = true;
  searchQuery = '';
  sortOption = RANDOM_SORT;
  hideWatched = readFlag('binge:hideWatched', true);
  private watchedIds = new Set<number>();
  private pageOrder: number[] = [];
  private deferred: any[] = [];
  private emptyFills = 0;
  private readonly memory = new ShownMemory('binge:shown:series');
  selectedGenre = '';
  selectedEra: number | null = null;
  featuredIndex = 0;
  isLoggedIn = false;
  private lists: SerieLists = { favorites: [], watched: [], watchlist: [] };
  readonly eraOptions = ERAS;
  readonly skeletons = Array.from({ length: 12 });
  readonly sortOptions = [
    { value: RANDOM_SORT, label: 'Au hasard' },
    { value: 'popularity.desc', label: 'Populaires' },
    { value: 'first_air_date.desc', label: 'Récentes' },
    { value: 'first_air_date.asc', label: 'Anciennes' },
    { value: 'popularity.asc', label: 'Moins connues' },
  ];
  readonly genreOptions = [
    { value: '', label: 'Tous les genres' },
    { value: '10759', label: 'Action & aventure' },
    { value: '16', label: 'Animation' },
    { value: '35', label: 'Comédie' },
    { value: '80', label: 'Crime' },
    { value: '99', label: 'Documentaire' },
    { value: '18', label: 'Drame' },
    { value: '10751', label: 'Famille' },
    { value: '10762', label: 'Enfants' },
    { value: '9648', label: 'Mystère' },
    { value: '10765', label: 'Science-fiction & fantastique' },
    { value: '10768', label: 'Guerre & politique' },
    { value: '10764', label: 'Téléréalité' },
    { value: '37', label: 'Western' },
  ];
  private loadToken = 0;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private featuredTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private seriesService: SeriesService,
    private seriesLists: SeriesListsService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private titleService: Title
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle('Binge • séries');
    localStorage.setItem('redirectUrl', window.location.pathname);
    const filters = readFilters(this.route.snapshot.queryParamMap, this.genreOptions);
    this.selectedGenre = filters.genre;
    this.selectedEra = filters.era;
    this.searchQuery = filters.query;
    if (this.searchQuery) {
      this.searchSeries(this.searchQuery);
    } else {
      this.loadSeries(1);
    }
    this.startFeatured();

    this.authService.isLoggedIn$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((status) => {
      this.isLoggedIn = status;
      if (status) {
        this.seriesLists.getLists().subscribe({
          next: (lists) => {
            this.lists = lists;
            if (!this.watchedIds.size) {
              this.watchedIds = new Set(lists.watched.map((entry) => entry.serie_id));
              this.fillViewport(0);
            }
            this.markLists(this.series);
            this.cdr.detectChanges();
          },
          error: () => {},
        });
      }
    });
  }

  private markLists(series: any[]): void {
    series.forEach((serie) => Object.assign(serie, this.stateFlags(serie.id)));
  }

  private stateFlags(serieId: number) {
    const state = SeriesListsService.stateOf(this.lists, serieId);
    return { isFavorite: state.favorite, isWatched: state.watched, isWatchlist: state.watchlist };
  }

  toggleList(serie: any, list: SerieList): void {
    if (!this.isLoggedIn) {
      this.toasts.show('Connecte-toi pour utiliser tes listes');
      return;
    }
    const inList = list === 'favorites' ? serie.isFavorite : list === 'watched' ? serie.isWatched : serie.isWatchlist;
    const labels: Record<SerieList, [string, string]> = {
      favorites: ['ajoutée aux favoris et aux vus', 'retirée des favoris'],
      watched: ['marquée comme vue', 'retirée des vus'],
      watchlist: ['ajoutée à la watchlist', 'retirée de la watchlist'],
    };
    const request = inList ? this.seriesLists.remove(list, serie.id) : this.seriesLists.add(list, serie.id);
    request.subscribe({
      next: (state) => {
        const entry = { serie_id: serie.id, added_at: new Date().toISOString() };
        const sync = (name: SerieList, on: boolean) => {
          const rest = this.lists[name].filter((item) => item.serie_id !== serie.id);
          this.lists[name] = on ? [entry, ...rest] : rest;
        };
        sync('favorites', state.favorite);
        sync('watched', state.watched);
        sync('watchlist', state.watchlist);
        Object.assign(serie, this.stateFlags(serie.id));
        this.toasts.show(`${serie.name} ${labels[list][inList ? 1 : 0]}`);
        this.cdr.detectChanges();
      },
      error: () => this.toasts.show('Erreur, réessaie dans un instant.'),
    });
  }

  ngOnDestroy(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    if (this.featuredTimer) {
      clearInterval(this.featuredTimer);
    }
  }

  // Hidden with the list known when the page opened: a series marked as seen here stays in place.
  get visibleSeries(): any[] {
    return this.hideWatched && this.isLoggedIn && this.watchedIds.size && !this.searchQuery.trim() ? this.series.filter((serie) => !this.watchedIds.has(serie.id)) : this.series;
  }

  toggleHideWatched(): void {
    this.hideWatched = !this.hideWatched;
    saveFlag('binge:hideWatched', this.hideWatched);
    this.fillViewport(0);
  }

  get featuredList(): any[] {
    return this.visibleSeries.filter((serie) => serie.backdrop_path).slice(0, 5);
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
    this.series = [];
    this.pageOrder = [];
    this.deferred = [];
    this.emptyFills = 0;
    this.loadSeries(1);
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
    this.searchTimer = setTimeout(() => this.searchSeries(this.searchQuery), 300);
  }

  loadSeries(page: number): void {
    if (this.isLoading || !this.hasMore) return;

    this.isLoading = true;
    const token = this.loadToken;
    const random = this.sortOption === RANDOM_SORT;
    const request$ = random ? this.randomPage(page) : this.seriesService.getSeries(page, this.sortOption, this.selectedGenre, this.selectedEra);

    request$.subscribe({
      next: (data) => {
        if (token !== this.loadToken) {
          return;
        }
        let added = 0;
        if (Array.isArray(data.items)) {
          const before = this.visibleSeries.length;
          // TMDB's popularity order shifts between pages, so a series can come back twice.
          const known = new Set(this.series.map((serie) => serie.id));
          let fresh = data.items.filter((serie: any) => !known.has(serie.id));
          if (random) {
            // Series shown on an earlier visit wait for the end of the list.
            fresh = shuffle(fresh);
            this.deferred.push(...fresh.filter((serie: any) => this.memory.has(serie.id)));
            fresh = fresh.filter((serie: any) => !this.memory.has(serie.id));
            this.memory.remember(fresh.map((serie: any) => serie.id));
          }
          this.markLists(fresh);
          this.series = page === 1 ? fresh : [...this.series, ...fresh];
          this.totalPages = data.totalPages;
          this.currentPage = page;
          this.hasMore = this.currentPage < this.totalPages;
          if (!this.hasMore && this.deferred.length) {
            this.markLists(this.deferred);
            this.series = [...this.series, ...this.deferred];
            this.deferred = [];
          }
          added = this.visibleSeries.length - before;
        }
        this.isLoading = false;
        this.cdr.detectChanges();
        this.fillViewport(added);
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

  // Walks every page of the current filters once, in an order drawn for this visit.
  private randomPage(step: number): Observable<any> {
    const fetch = (page: number) => this.seriesService.getSeries(page, 'popularity.desc', this.selectedGenre, this.selectedEra, RANDOM_MIN_VOTES);
    const order$ = this.pageOrder.length
      ? of(this.pageOrder)
      : fetch(1).pipe(map((data) => (this.pageOrder = randomPageOrder(data.totalPages || 0))));
    return order$.pipe(
      switchMap((order) => (order[step - 1] ? fetch(order[step - 1]) : of({ items: [] }))),
      map((data) => ({ ...data, totalPages: this.pageOrder.length }))
    );
  }

  // When hidden or already-shown series leave the screen short, keep loading so the scroll never stalls.
  private fillViewport(added: number): void {
    this.emptyFills = added > 0 ? 0 : this.emptyFills + 1;
    if (this.emptyFills > 8) return;
    setTimeout(() => {
      if (!this.isLoading && this.hasMore && nearBottom(300)) {
        this.loadSeries(this.currentPage + 1);
      }
    }, 50);
  }

  searchSeries(query: string): void {
    if (!query?.trim()) {
      this.reload();
      return;
    }

    this.loadToken++;
    const token = this.loadToken;
    this.isLoading = true;
    this.hasMore = false;
    this.featuredIndex = 0;
    this.series = [];

    this.seriesService.searchSeries(query).subscribe({
      next: (data) => {
        if (token !== this.loadToken) {
          return;
        }
        this.series = Array.isArray(data.results) ? data.results : [];
        this.markLists(this.series);
        this.isLoading = false;
        this.cdr.detectChanges();
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

  switchKind(kind: 'films' | 'series'): void {
    if (kind === this.kind) return;
    this.router.navigate(['/films'], { queryParams: switchParams('films', { genre: this.selectedGenre, era: this.selectedEra, query: this.searchQuery }) });
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.sortOption = RANDOM_SORT;
    this.selectedGenre = '';
    this.selectedEra = null;
    this.reload();
  }

  hasActiveFilters(): boolean {
    return Boolean(this.searchQuery || this.selectedGenre || this.selectedEra || this.sortOption !== RANDOM_SORT);
  }

  trackBySerieId(index: number, serie: any): number {
    return serie.id ?? index;
  }
}
