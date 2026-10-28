import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl, Title } from '@angular/platform-browser';
import { SeriesService } from '../series.service';
import { SerieList, SerieState, SeriesListsService } from '../series-lists.service';
import { AuthService } from '../auth.service';
import { ToastService } from '../toast/toast.service';

@Component({
  selector: 'app-serie-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './serie-details.component.html',
  styles: [':host { display: block; }'],
})
export class SerieDetailsComponent implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private readonly onTrailerHidden = () => (this.trailerUrl = null);
  private readonly onTrailerShown = () => this.updateTrailerUrl();

  serie: any = null;
  error: string | null = null;
  logoUrl: string | undefined;
  trailerKey: string | null = null;
  trailerUrl: SafeResourceUrl | null = null;
  watchProviders: any | null = null;
  providerRegion = 'BE';
  seasons: any[] = [];
  selectedSeason: number | null = null;
  episodes: any[] = [];
  episodesLoading = false;
  activePanel: 'episodes' | 'cast' | 'similar' = 'episodes';
  overviewExpanded = false;
  copiedLink = false;
  isLoggedIn = false;
  listState: SerieState = { favorite: false, watched: false, watchlist: false };
  private readonly toasts = inject(ToastService);

  constructor(
    private route: ActivatedRoute,
    private seriesService: SeriesService,
    private seriesLists: SeriesListsService,
    private authService: AuthService,
    private router: Router,
    private sanitizer: DomSanitizer,
    private titleService: Title,
    private cdr: ChangeDetectorRef
  ) {}

  imageUrl(path: string | null | undefined, size: string, fallback = ''): string {
    return path && /^\/[A-Za-z0-9_.-]{1,100}\.(jpg|jpeg|png|webp)$/.test(path) ? `https://image.tmdb.org/t/p/${size}${path}` : fallback;
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = Number(params['id']);
      if (id) {
        this.loadSerie(id);
        localStorage.setItem('redirectUrl', window.location.pathname);
      }
    });

    this.authService.isLoggedIn$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((status) => {
      this.isLoggedIn = status;
      if (status && this.serie) {
        this.loadListState(this.serie.id);
      }
    });
  }

  ngAfterViewInit(): void {
    const modalElement = document.getElementById('trailerModal');
    modalElement?.addEventListener('hidden.bs.modal', this.onTrailerHidden);
    modalElement?.addEventListener('shown.bs.modal', this.onTrailerShown);
  }

  ngOnDestroy(): void {
    const modalElement = document.getElementById('trailerModal');
    modalElement?.removeEventListener('hidden.bs.modal', this.onTrailerHidden);
    modalElement?.removeEventListener('shown.bs.modal', this.onTrailerShown);
  }

  private loadSerie(id: number): void {
    this.serie = null;
    this.error = null;
    this.episodes = [];
    this.seriesService.getSerieByID(id).subscribe({
      next: (data) => {
        this.serie = data;
        this.overviewExpanded = false;
        this.copiedLink = false;
        this.activePanel = 'episodes';
        this.titleService.setTitle(data.name ? 'Binge - ' + data.name : 'Binge');

        const logo = (data.images?.logos || []).find((item: any) => item.iso_639_1 === 'fr') || data.images?.logos?.[0];
        this.logoUrl = logo ? this.imageUrl(logo.file_path, 'w185') : undefined;

        const trailers = (data.videos?.results || []).filter((video: any) => video.site === 'YouTube' && (video.type === 'Trailer' || video.type === 'Teaser'));
        const trailer = trailers.find((video: any) => video.iso_639_1 === 'fr' && video.type === 'Trailer') || trailers.find((video: any) => video.type === 'Trailer') || trailers[0];
        this.trailerKey = trailer?.key || null;

        const providers = data['watch/providers']?.results || {};
        const region = ['BE', 'FR', 'US'].find((item) => providers[item]);
        this.providerRegion = region || 'BE';
        this.watchProviders = region ? providers[region] : null;

        // Specials (season 0) go last: people come for the main seasons.
        const all = (data.seasons || []).filter((season: any) => season.episode_count > 0);
        this.seasons = [...all.filter((season: any) => season.season_number > 0), ...all.filter((season: any) => season.season_number === 0)];
        if (this.seasons.length > 0) {
          this.selectSeason(this.seasons[0].season_number);
        }
        this.listState = { favorite: false, watched: false, watchlist: false };
        if (this.isLoggedIn) {
          this.loadListState(data.id);
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Impossible de charger cette série.';
      },
    });
  }

  selectSeason(seasonNumber: number | string): void {
    const season = Number(seasonNumber);
    this.selectedSeason = season;
    this.episodesLoading = true;
    this.episodes = [];
    this.seriesService.getSeason(this.serie.id, season).subscribe({
      next: (data) => {
        if (this.selectedSeason !== season) return;
        this.episodes = data.episodes || [];
        this.episodesLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.episodesLoading = false;
      },
    });
  }

  private loadListState(serieId: number): void {
    this.seriesLists.getLists().subscribe({
      next: (lists) => {
        if (this.serie?.id !== serieId) return;
        this.listState = SeriesListsService.stateOf(lists, serieId);
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  toggleList(list: SerieList): void {
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }
    const inList = list === 'favorites' ? this.listState.favorite : this.listState[list];
    const labels: Record<SerieList, [string, string]> = {
      favorites: ['ajoutée aux favoris et aux vus', 'retirée des favoris'],
      watched: ['marquée comme vue', 'retirée des vus'],
      watchlist: ['ajoutée à la watchlist', 'retirée de la watchlist'],
    };
    const request = inList ? this.seriesLists.remove(list, this.serie.id) : this.seriesLists.add(list, this.serie.id);
    request.subscribe({
      next: (state) => {
        this.listState = state;
        this.toasts.show(`${this.serie.name} ${labels[list][inList ? 1 : 0]}`);
        this.cdr.detectChanges();
      },
      error: () => this.toasts.show('Erreur, réessaie dans un instant.'),
    });
  }

  private updateTrailerUrl(): void {
    if (this.trailerKey) {
      this.trailerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${this.trailerKey}?autoplay=1&mute=1&rel=0`);
    }
  }

  getYears(): string {
    const start = this.serie?.first_air_date?.slice(0, 4);
    if (!start) return 'Date inconnue';
    const end = this.serie.last_air_date?.slice(0, 4);
    if (this.serie.status === 'Returning Series' || this.serie.status === 'In Production') return `Depuis ${start}`;
    return end && end !== start ? `${start}–${end}` : start;
  }

  getStatus(): string {
    const labels: Record<string, string> = {
      'Returning Series': 'En cours',
      'In Production': 'En production',
      Ended: 'Terminée',
      Canceled: 'Annulée',
      Planned: 'Annoncée',
    };
    return labels[this.serie?.status] || '';
  }

  getSeasonsLabel(): string {
    const seasons = this.serie?.number_of_seasons || 0;
    const episodes = this.serie?.number_of_episodes || 0;
    return `${seasons} saison${seasons > 1 ? 's' : ''} · ${episodes} épisode${episodes > 1 ? 's' : ''}`;
  }

  formatRuntime(minutes: number | null | undefined): string {
    if (!minutes) return '';
    return minutes >= 60 ? `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, '0')}` : `${minutes} min`;
  }

  getLeadCast(): any[] {
    return (this.serie?.aggregate_credits?.cast || []).slice(0, 12);
  }

  getRole(actor: any): string {
    return actor.roles?.[0]?.character || 'Rôle inconnu';
  }

  getRecommendationList(): any[] {
    return (this.serie?.recommendations?.results || []).slice(0, 12);
  }

  combinedProviders(): { provider_name: string; logo_path?: string }[] {
    const providers = [...(this.watchProviders?.flatrate || []), ...(this.watchProviders?.rent || []), ...(this.watchProviders?.buy || [])];
    return Array.from(new Map(providers.map((provider: any) => [provider.logo_path, provider])).values());
  }

  getProviderRegionLabel(): string {
    const labels: Record<string, string> = { BE: 'Belgique', FR: 'France', US: 'Etats-Unis' };
    return labels[this.providerRegion] || this.providerRegion;
  }

  getOverview(): string {
    const overview = this.serie?.overview;
    if (!overview) return 'Aucune description disponible.';
    return this.overviewExpanded || overview.length <= 220 ? overview : `${overview.slice(0, 220)}...`;
  }

  canToggleOverview(): boolean {
    return Boolean(this.serie?.overview && this.serie.overview.length > 220);
  }

  toggleOverview(): void {
    this.overviewExpanded = !this.overviewExpanded;
  }

  selectPanel(panel: 'episodes' | 'cast' | 'similar'): void {
    this.activePanel = panel;
  }

  slide(track: HTMLElement, direction: number): void {
    track.scrollBy({ left: direction * track.clientWidth * 0.85, behavior: 'smooth' });
  }

  copyPageLink(): void {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        this.copiedLink = true;
        setTimeout(() => {
          this.copiedLink = false;
          this.cdr.detectChanges();
        }, 2000);
        this.cdr.detectChanges();
      })
      .catch(() => {
        this.copiedLink = false;
      });
  }

  trackByNumber(index: number, item: any): number {
    return item.episode_number ?? item.season_number ?? index;
  }
}
