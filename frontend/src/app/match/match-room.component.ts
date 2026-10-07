import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';
import { WatchlistService } from '../watchlist.service';
import {
  MATCH_GENRES,
  MatchCard,
  MatchEntry,
  MatchMovie,
  MatchService,
  SessionInfo,
  SessionState,
} from './match.service';

type Phase = 'loading' | 'missing' | 'ended' | 'join' | 'play';

@Component({
  selector: 'app-match-room',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './match-room.component.html',
  styleUrl: './match.component.css',
})
export class MatchRoomComponent implements OnInit, OnDestroy {
  readonly genres = MATCH_GENRES;
  readonly imageBase = 'https://image.tmdb.org/t/p/';
  readonly noPoster = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGPgl9YFAACUAFiZIJ/AAAAAAElFTkSuQmCC';

  code = '';
  phase: Phase = 'loading';
  info: SessionInfo | null = null;
  state: SessionState | null = null;
  isLoggedIn = false;

  guestName = '';
  joinError = '';
  joining = false;

  tab: 'swipe' | 'matches' = 'swipe';
  deck: MatchCard[] = [];
  exhausted = false;
  loadingDeck = false;
  deckError = '';
  showDetails = false;

  dragX = 0;
  dragY = 0;
  dragging = false;
  leaving: 'left' | 'right' | null = null;

  celebration: MatchMovie | null = null;
  copied = false;
  editingGenres = false;
  draftGenres: number[] = [];
  watchlisted = new Set<number>();

  private startX = 0;
  private startY = 0;
  private shown = new Set<number>();
  private knownMatches = new Set<number>();
  private celebrationQueue: MatchMovie[] = [];
  private poll: ReturnType<typeof setInterval> | null = null;
  private firstState = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private matchService: MatchService,
    private authService: AuthService,
    private watchlistService: WatchlistService
  ) {}

  ngOnInit(): void {
    this.code = (this.route.snapshot.paramMap.get('code') ?? '').toLowerCase();
    this.authService.isLoggedIn$.subscribe((status) => (this.isLoggedIn = status));
    this.loadInfo();
  }

  ngOnDestroy(): void {
    if (this.poll) {
      clearInterval(this.poll);
    }
  }

  get link(): string {
    return `${window.location.origin}/match/${this.code}`;
  }

  get topCard(): MatchCard | null {
    return this.deck.length > 0 ? this.deck[0] : null;
  }

  get nextCards(): MatchCard[] {
    return this.deck.slice(1, 3);
  }

  get matches(): MatchEntry[] {
    return this.state ? this.state.matches : [];
  }

  get cardTransform(): string {
    if (this.leaving) {
      const dir = this.leaving === 'right' ? 1 : -1;
      return `translate(${dir * 140}%, -4%) rotate(${dir * 24}deg)`;
    }
    return `translate(${this.dragX}px, ${this.dragY}px) rotate(${this.dragX / 18}deg)`;
  }

  get likeOpacity(): number {
    return this.leaving === 'right' ? 1 : Math.min(1, Math.max(0, this.dragX / 100));
  }

  get passOpacity(): number {
    return this.leaving === 'left' ? 1 : Math.min(1, Math.max(0, -this.dragX / 100));
  }

  poster(path: string | null, size = 'w500'): string {
    return path ? `${this.imageBase}${size}${path}` : this.noPoster;
  }

  year(date: string): string {
    return date ? date.slice(0, 4) : '';
  }

  genreLabel(id: number): string {
    const genre = this.genres.find((g) => g.id === id);
    return genre ? genre.label : '';
  }

  loadInfo(): void {
    this.matchService.getSession(this.code).subscribe({
      next: (info) => {
        this.info = info;
        if (!info.session.open) {
          this.phase = 'ended';
        } else if (info.joined) {
          this.startPlaying();
        } else {
          this.phase = 'join';
        }
      },
      error: () => (this.phase = 'missing'),
    });
  }

  join(): void {
    if (this.joining) {
      return;
    }
    const name = this.guestName.trim();
    if (!this.isLoggedIn && !name) {
      this.joinError = 'Choisis un pseudo pour que les autres te reconnaissent.';
      return;
    }
    this.joining = true;
    this.joinError = '';
    this.matchService.join(this.code, name).subscribe({
      next: (res) => {
        if (res.guest_token) {
          this.matchService.saveGuestToken(this.code, res.guest_token);
        }
        this.joining = false;
        this.startPlaying();
      },
      error: (err) => {
        this.joining = false;
        this.joinError =
          err?.status === 409
            ? 'Ce salon est complet.'
            : err?.status === 410
              ? 'Ce salon est terminé.'
              : err?.status === 429
                ? 'Trop d’essais, réessaie dans un moment.'
                : 'Impossible de rejoindre le salon pour le moment.';
      },
    });
  }

  private startPlaying(): void {
    this.phase = 'play';
    this.refreshState();
    this.fetchDeck();
    if (!this.poll) {
      this.poll = setInterval(() => {
        if (!document.hidden && this.phase === 'play') {
          this.refreshState();
        }
      }, 6000);
    }
  }

  private refreshState(): void {
    this.matchService.getState(this.code).subscribe({
      next: (state) => {
        this.state = state;
        for (const entry of state.matches) {
          if (!this.knownMatches.has(entry.movie.id)) {
            this.knownMatches.add(entry.movie.id);
            if (!this.firstState) {
              this.celebrate(entry.movie);
            }
          }
        }
        this.firstState = false;
      },
      error: (err) => {
        if (err?.status === 410) {
          this.phase = 'ended';
        }
      },
    });
  }

  private celebrate(movie: MatchMovie): void {
    this.knownMatches.add(movie.id);
    if (this.celebration) {
      if (this.celebration.id !== movie.id && !this.celebrationQueue.some((m) => m.id === movie.id)) {
        this.celebrationQueue.push(movie);
      }
    } else {
      this.celebration = movie;
    }
  }

  closeCelebration(): void {
    const next = this.celebrationQueue.shift();
    this.celebration = next ?? null;
  }

  chooseMovie(movie: MatchMovie): void {
    this.matchService.pick(this.code, movie.id, true).subscribe({
      next: () => {
        this.refreshState();
        this.closeCelebration();
      },
      error: () => this.closeCelebration(),
    });
  }

  togglePick(entry: MatchEntry): void {
    this.matchService.pick(this.code, entry.movie.id, !entry.picked).subscribe({
      next: () => this.refreshState(),
    });
  }

  addToWatchlist(movieId: number): void {
    this.watchlistService.addWatchlist(movieId).subscribe({
      next: () => this.watchlisted.add(movieId),
      error: () => this.watchlisted.add(movieId),
    });
  }

  fetchDeck(): void {
    if (this.loadingDeck) {
      return;
    }
    this.loadingDeck = true;
    this.deckError = '';
    this.matchService.getDeck(this.code, 8).subscribe({
      next: (res) => {
        const fresh = res.cards.filter((card) => !this.shown.has(card.id));
        fresh.forEach((card) => this.shown.add(card.id));
        this.deck = [...this.deck, ...fresh];
        this.loadingDeck = false;
        if (res.cards.length === 0 && this.deck.length === 0) {
          this.exhausted = true;
        } else if (fresh.length === 0 && res.cards.length > 0) {
          setTimeout(() => this.fetchDeck(), 800);
        }
      },
      error: () => {
        this.loadingDeck = false;
        this.deckError = 'Impossible de charger les films pour le moment.';
      },
    });
  }

  swipe(liked: boolean): void {
    const card = this.topCard;
    if (!card || this.leaving) {
      return;
    }
    this.leaving = liked ? 'right' : 'left';
    this.matchService.swipe(this.code, card.id, liked).subscribe({
      next: (res) => {
        if (res.match && res.movie) {
          this.celebrate(res.movie);
        }
      },
      error: () => (this.deckError = 'Un vote n’a pas pu être enregistré, vérifie ta connexion.'),
    });
    setTimeout(() => {
      this.deck = this.deck.slice(1);
      this.leaving = null;
      this.dragX = 0;
      this.dragY = 0;
      this.showDetails = false;
      if (this.deck.length < 4) {
        this.fetchDeck();
      }
    }, 260);
  }

  onDown(event: PointerEvent): void {
    if (this.leaving) {
      return;
    }
    this.dragging = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  onMove(event: PointerEvent): void {
    if (!this.dragging) {
      return;
    }
    this.dragX = event.clientX - this.startX;
    this.dragY = (event.clientY - this.startY) * 0.4;
  }

  onUp(): void {
    if (!this.dragging) {
      return;
    }
    this.dragging = false;
    if (this.dragX > 110) {
      this.swipe(true);
    } else if (this.dragX < -110) {
      this.swipe(false);
    } else {
      if (Math.abs(this.dragX) < 6 && Math.abs(this.dragY) < 3) {
        this.showDetails = !this.showDetails;
      }
      this.dragX = 0;
      this.dragY = 0;
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    if (this.phase !== 'play' || this.tab !== 'swipe' || this.celebration || (target && /INPUT|TEXTAREA|SELECT/.test(target.tagName))) {
      return;
    }
    if (event.key === 'ArrowRight') {
      this.swipe(true);
    } else if (event.key === 'ArrowLeft') {
      this.swipe(false);
    }
  }

  async share(): Promise<void> {
    const title = this.info?.session.title || 'Match sur Binge';
    const nav = navigator as Navigator & { share?: (data: { title: string; text: string; url: string }) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share({ title, text: 'On swipe des films ensemble sur Binge ?', url: this.link });
        return;
      } catch {
        return;
      }
    }
    await this.copyLink();
  }

  async copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.link);
      this.copied = true;
      setTimeout(() => (this.copied = false), 2000);
    } catch {
      window.prompt('Copie ce lien', this.link);
    }
  }

  selectLink(event: FocusEvent): void {
    (event.target as HTMLInputElement).select();
  }

  startEditGenres(): void {
    this.draftGenres = [...(this.state?.session.filters.genres ?? this.info?.session.filters.genres ?? [])];
    this.editingGenres = true;
  }

  toggleDraft(id: number): void {
    this.draftGenres = this.draftGenres.includes(id)
      ? this.draftGenres.filter((g) => g !== id)
      : this.draftGenres.length < 5
        ? [...this.draftGenres, id]
        : this.draftGenres;
  }

  applyGenres(): void {
    this.matchService.updateFilters(this.code, { genres: this.draftGenres }).subscribe({
      next: () => {
        this.editingGenres = false;
        this.exhausted = false;
        this.shown = new Set<number>(this.deck.map((card) => card.id));
        this.fetchDeck();
        this.refreshState();
      },
      error: () => (this.deckError = 'Impossible de changer les genres.'),
    });
  }

  endRoom(): void {
    if (!window.confirm('Terminer ce salon pour tout le monde ?')) {
      return;
    }
    this.matchService.endSession(this.code).subscribe({
      next: () => this.router.navigate(['/match']),
    });
  }
}
