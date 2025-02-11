import { Component, ElementRef, ViewChild } from '@angular/core';
import { DiscoverService } from '../discover.service';
import {
  ActivatedRoute,
  RouterLink,
  Router,
  NavigationEnd,
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { DetailsService } from '../details.service';
import { FavoritesService } from '../favorites.service';
import { ChangeDetectorRef } from '@angular/core';
import { WatchlistService } from '../watchlist.service';
import { WatchedService } from '../watched.service';
import { AuthService } from '../auth.service';
import { DomSanitizer, SafeResourceUrl, Title, Meta } from '@angular/platform-browser';
@Component({
  selector: 'app-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './details.component.html',
  styleUrl: './details.component.css',
})
export class DetailsComponent {
  movie: any = null;
  collection: any;

  error: string | null = null;
  lastSearch: string | null = '';
  isFavorite: boolean = false;
  isWatchlist: boolean = false;
  isWatched: boolean = false;
  watchedCount = 0;
  watchlistCount = 0;
  favoriteCount = 0;
  isLoggedIn = false;
  chunkedActors: any[][] = [];
  logoUrl: string | undefined;
  similarMovies: any[] = [];
  watchProviders: any | null = null;
  trailerKey: string | null = null;
  trailerUrl: SafeResourceUrl | null = null;
  movies: any[] = [];


  @ViewChild('trailerModal') trailerModal!: ElementRef;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private watched: WatchedService,
    private watchlist: WatchlistService,
    private detailsService: DetailsService,
    private favoritesService: FavoritesService,
    private sanitizer: DomSanitizer,
    private titleService: Title,
    private metaService: Meta,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {


    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        const movieId = Number(id);
        this.loadMovieDetails(movieId);
        this.loadSimilarMovies(movieId);
        this.loadWatchProviders(movieId);
        this.loadTrailers(movieId); 
        
      } else {
        console.error("L'ID du film n'a pas été trouvé?");
      }
    });

    this.authService.isLoggedIn$.subscribe((status) => {
      this.isLoggedIn = status;
    });

  }
  
  private loadMovieDetails(id: number): void {
    this.detailsService.getMovieByID(id).subscribe({
      next: (data) => {
        this.movie = data;
        this.chunkActors();
        this.checkIfFavorite();
        this.checkIfWatchlist();
        this.checkIfWatched();
        this.loadMovieLogo(id);
        this.updateMetaTags();

      },
      error: (error) => {
        this.error = 'Erreur lors de la récupération des détails du film';
        console.error(error);
      },
    });
  }

  private updateMetaTags(): void {
    if (!this.movie) return;
  
    this.titleService.setTitle(this.movie.title ? 'Binge - ' + this.movie.title : 'Binge');
  
    this.metaService.updateTag({ name: 'description', content: this.movie.overview || 'Aucune description disponible.' });
    this.metaService.updateTag({ name: 'keywords', content: this.movie.genres?.map((g: any) => g.name).join(', ') || '' });
    this.metaService.updateTag({ property: 'og:title', content: 'Binge - ' + this.movie.title });
    this.metaService.updateTag({ property: 'og:description', content: this.movie.overview || '' });
    this.metaService.updateTag({ property: 'og:image', content: 'https://image.tmdb.org/t/p/original/' + this.movie.backdrop_path });
  }
  

  combinedProviders(): { provider_name: string; logo_path?: string }[] {
    const providers: { provider_name: string; logo_path?: string }[] = [];
    if (this.watchProviders?.flatrate) {
      providers.push(...this.watchProviders.flatrate);
    }
    if (this.watchProviders?.rent) {
      providers.push(...this.watchProviders.rent);
    }
    if (this.watchProviders?.buy) {
      providers.push(...this.watchProviders.buy);
    }
    const uniqueProviders = Array.from(new Map(providers.map(provider => [provider.logo_path, provider])).values());
    return uniqueProviders;
  }

  private loadTrailers(id: number): void {
    this.detailsService.getTeaserByID(id).subscribe({
      next: (data: any) => {
        if (Array.isArray(data.results)) {
          const trailers = data.results.filter((result: any) => result.type === 'Trailer');
          if (trailers.length > 0) {
            this.trailerKey = trailers[0].key;
            this.updateTrailerUrl();
          } else {
            console.error('Aucun trailer trouvé');
          }
        } else {
          console.error('Une erreur est survenue.');
        }
      },
      error: (error: any) => {
        console.error('Erreur lors de la récupération des bandes-annonces', error);
      },
    });
  }
  
  private updateTrailerUrl(): void {
    if (this.trailerKey) {
      const url = `https://www.youtube.com/embed/${this.trailerKey}?autoplay=1&mute=1&rel=0`;
      this.trailerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    } else {
      console.error("Erreur sur l'URL.");
    }
  }
  
  
  
  formatRuntime(minutes: number): string {
    if (!minutes) return '0 min';

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return `${hours}h${mins} min`;
  }

  private loadWatchProviders(id: number): void {
    this.detailsService.getProviders(id).subscribe({
      next: (data) => {
        const providers = data.results?.BE;  
        

        if (providers) {
          this.watchProviders = providers;  
        } else {
          this.watchProviders = null;  
        }
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des fournisseurs de streaming', error);
      },
    });
  }
  

  private loadMovieLogo(id: number): void {
    this.detailsService.getLogoByID(id).subscribe({
      next: (logoData) => {
        if (logoData?.logos?.length > 0) {
          this.logoUrl =
          'https://image.tmdb.org/t/p/w185' + logoData.logos[0].file_path;
        } else {
          this.logoUrl = undefined;
        }
      },
      error: (error) => {
        console.error('Erreur sur le fetch du logo', error);
      },
    });
  }

  private loadSimilarMovies(id: number): void {
    this.detailsService.getSimilarByID(id).subscribe({
      next: (similarData) => {
        this.similarMovies = similarData.results.sort((a: any, b: any) => {
          const dateA = new Date(a.release_date).getTime();
          const dateB = new Date(b.release_date).getTime();
          return dateB - dateA;
        });

        this.chunkedSimilarMovies = this.chunkArray(this.similarMovies, 6);
      },
      error: (error) => {
        console.error(
          'Erreur lors de la récupération des films similaires',
          error
        );
      },
    });
  }

  chunkedSimilarMovies: any[][] = [];
  chunkedCollectionsMovies: any[][] = [];

  private chunkArray(arr: any[], chunkSize: number): any[][] {
    let result = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
      result.push(arr.slice(i, i + chunkSize));
    }
    return result;
  }

private chunkMovies(movies: any[]): any[][] {
  const chunkSize = 6; 
  return Array.from({ length: Math.ceil(movies.length / chunkSize) }, (_, i) =>
    movies.slice(i * chunkSize, i * chunkSize + chunkSize)
  );
}

  getReal() {
    return (
      this.movie?.credits?.crew?.filter(
        (crewMember: any) => crewMember.job === 'Director'
      ) || []
    );
  }


  chunkActors(): void {
    const actors = this.movie?.credits?.cast || [];
    const chunkSize = 6;
    this.chunkedActors = [];

    for (let i = 0; i < actors.length; i += chunkSize) {
      this.chunkedActors.push(actors.slice(i, i + chunkSize));
    }
  }

  toggleFavorite(): void {
    if (this.isLoggedIn) {
      if (this.isFavorite) {
        this.removeFromFavorites();
      } else {
        this.addToFavorites();
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  toggleWatchlist(): void {
    if (this.isLoggedIn) {
      if (this.isWatchlist) {
        this.removeFromWatchlist();
      } else {
        this.addWatchlist();
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  toggleWatched(): void {
    if (this.isLoggedIn) {
      if (this.isWatched) {
        this.removeWatched();
      } else {
        this.addWatched();
      }
    } else {
      this.router.navigate(['/login']);
    }
  }

  addToFavorites(): void {
    this.favoritesService.addFavorite(this.movie.id).subscribe({
      next: () => {
        console.log('Film ajouté aux favoris');
        this.isFavorite = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur en ajoutant ce film aux favoris :', err);
      },
    });
  }

  removeFromFavorites(): void {
    this.favoritesService.removeFavorite(this.movie.id).subscribe({
      next: () => {
        console.log('Film retiré des favoris');
        this.isFavorite = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error en retirant ce film des favoris :', err);
      },
    });
  }

  checkIfFavorite(): void {
    this.favoritesService.getFavorites().subscribe({
      next: (favorites: { movie_id: number }[]) => {
        const favoriteMovieIds = favorites.map((fav) => fav.movie_id);
        this.isFavorite = favoriteMovieIds.includes(this.movie.id);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des favoris :', err);
      },
    });
  }

  checkIfWatchlist(): void {
    this.watchlist.getWatchlist().subscribe({
      next: (watchlist: { movie_id: number }[]) => {
        const watchlistIds = watchlist.map((watch) => watch.movie_id);
        this.isWatchlist = watchlistIds.includes(this.movie.id);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Erreur lors de la récupération de la watchlist :', err);
      },
    });
  }

  addWatchlist(): void {
    this.watchlist.addWatchlist(this.movie.id).subscribe({
      next: () => {
        console.log('Film ajouté à la watchlist');
        this.isWatchlist = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Erreur lors de l'ajout du film à la watchlist :", err);
      },
    });
  }

  removeFromWatchlist(): void {
    this.watchlist.removeFromWatchlist(this.movie.id).subscribe({
      next: () => {
        console.log('Film retiré de la watchlist');
        this.isWatchlist = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(
          'Erreur lors de la suppression du film de la watchlist :',
          err
        );
      },
    });
  }

  checkIfWatched(): void {
    this.watched.getWatched().subscribe({
      next: (watched: { movie_id: number }[]) => {
        const watchedIds = watched.map((watch) => watch.movie_id);
        this.isWatched = watchedIds.includes(this.movie.id);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(
          'Erreur lors de la récupération des films regardés :',
          err
        );
      },
    });
  }

  addWatched(): void {
    this.watched.addWatched(this.movie.id).subscribe({
      next: () => {
        console.log('Film ajouté aux films regardés');
        this.isWatched = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(
          "Erreur lors de l'ajout du film aux films regardés :",
          err
        );
      },
    });
  }

  removeWatched(): void {
    this.watched.removeWatched(this.movie.id).subscribe({
      next: () => {
        console.log('Film retiré des films regardés');
        this.isWatched = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(
          'Erreur lors de la suppression du film des films regardés :',
          err
        );
      },
    });
  }

}
