import { Component } from '@angular/core';
import { DiscoverService } from '../discover.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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


  constructor(private authService: AuthService, private route: ActivatedRoute, private watched : WatchedService, private watchlist: WatchlistService, private detailsService: DetailsService, private favoritesService: FavoritesService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    
  
    if (id) {
      this.detailsService.getMovieByID(Number(id)).subscribe({
        next: (data) => {
          this.movie = data;
          this.checkIfFavorite();
          this.checkIfWatchlist();
          this.checkIfWatched();
        },
        error: (error) => {
          this.error = 'Erreur lors de la récupération des détails du film';
          console.error(error);
        }
      });
    } else {
      console.error("L'ID du film n'a pas été trouvé?");
    }

    this.authService.isLoggedIn$.subscribe(status => {
      this.isLoggedIn = status;
    });
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