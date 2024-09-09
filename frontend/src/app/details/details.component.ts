import { Component } from '@angular/core';
import { DiscoverService } from '../discover.service';
import { ActivatedRoute, RouterLink, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DetailsService } from '../details.service';
import { FavoritesService } from '../favorites.service';
import { ChangeDetectorRef } from '@angular/core';
import { WatchlistService } from '../watchlist.service';
import { WatchedService } from '../watched.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './details.component.html',
  styleUrl: './details.component.css'
})
export class DetailsComponent {
  movie: any = null;
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

  constructor(private authService: AuthService, private router: Router, private route: ActivatedRoute, private watched : WatchedService, private watchlist: WatchlistService, private detailsService: DetailsService, private favoritesService: FavoritesService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        const movieId = Number(id);
        this.loadMovieDetails(movieId);
        this.loadSimilarMovies(movieId);
      } else {
        console.error("L'ID du film n'a pas été trouvé?");
      }
    });

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        window.scrollTo(0, 0);
      }
    });
    this.authService.isLoggedIn$.subscribe(status => {
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
      },
      error: (error) => {
        this.error = 'Erreur lors de la récupération des détails du film';
        console.error(error);
      }
    });
  }
  
  private loadMovieLogo(id: number): void {
    this.detailsService.getLogoByID(id).subscribe({
      next: (logoData) => {
        if (logoData?.logos?.length > 0) {
          this.logoUrl = 'https://image.tmdb.org/t/p/w185' + logoData.logos[0].file_path;
          console.log(logoData);
        } else {
          this.logoUrl = undefined;
        }
      },
      error: (error) => {
        console.error('Erreur sur le fetch du logo', error);
      }
    });
  }
  
  private loadSimilarMovies(id: number): void {
    this.detailsService.getSimilarByID(id).subscribe({
      next: (similarData) => {
        this.similarMovies = similarData.results.sort((a :any, b: any) => {
          const dateA = new Date(a.release_date).getTime();
          const dateB = new Date(b.release_date).getTime();
          return dateB - dateA;
        });

        this.chunkedSimilarMovies = this.chunkArray(this.similarMovies, 6); 


      },
      error: (error) => {
        console.error('Erreur lors de la récupération des films similaires', error);
      }
    });
  }

  chunkedSimilarMovies: any[][] = [];

private chunkArray(arr: any[], chunkSize: number): any[][] {
  let result = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    result.push(arr.slice(i, i + chunkSize));
  }
  return result;
}

private sort(arr :any []) {


}
  

  getReal() {
    return this.movie?.credits?.crew?.filter((crewMember: any) => crewMember.job === 'Director') || [];
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
    }
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
    }
  });
}

checkIfFavorite(): void {
  this.favoritesService.getFavorites().subscribe({
    next: (favorites: { movie_id: number }[]) => {
      const favoriteMovieIds = favorites.map(fav => fav.movie_id);
      this.isFavorite = favoriteMovieIds.includes(this.movie.id);
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
      this.isWatchlist = watchlistIds.includes(this.movie.id);
      this.cdr.detectChanges();
    },
    error: (err: any) => {
      console.error('Erreur lors de la récupération de la watchlist :', err);
    }
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
      console.error('Erreur lors de l\'ajout du film à la watchlist :', err);
    }
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
      console.error('Erreur lors de la suppression du film de la liste de surveillance :', err);
    }
  });
}

checkIfWatched(): void {
  this.watched.getWatched().subscribe({
    next: (watched: { movie_id: number }[]) => {
      const watchedIds = watched.map(watch => watch.movie_id);
      this.isWatched = watchedIds.includes(this.movie.id);
      this.cdr.detectChanges();
    },
    error: (err: any) => {
      console.error('Erreur lors de la récupération des films regardés :', err);
    }
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
      console.error('Erreur lors de l\'ajout du film aux films regardés :', err);
    }
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
      console.error('Erreur lors de la suppression du film des films regardés :', err);
    }
  });
}
}