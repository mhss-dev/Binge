import { ChangeDetectorRef, Component } from '@angular/core';
import { MembersService } from '../members.service';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FavoritesService } from 'app/favorites.service';
import { WatchedService } from 'app/watched.service';
import { WatchlistService } from 'app/watchlist.service';
import { DetailsService } from 'app/details.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './members.component.html',
  styleUrl: './members.component.css'
})

export class MembersComponent {
  members : any[] = [];

  favoritesCount: number = 0;
  watchedCount: number = 0;
  watchlistCount: number = 0;
  
  favorites: any[] = [];
  watched: any[] = [];
  watchlist: any[] = [];
  
  constructor(
    private MembreService: MembersService, 
    private favoritesService: FavoritesService,
    private detailsService: DetailsService,
    private watchedService: WatchedService,
    private watchlistService: WatchlistService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,


  ) {}

  ngOnInit() : void {

      this.fetchFavorites();
      this.fetchWatched();
      this.fetchWatchlist();

    this.MembreService.getMembers().subscribe({
      next: (response) => {
        this.members = response;        
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des membres:', err)
      }
  })
}

fetchFavorites(): void {
  const routeNickname = this.route.snapshot.paramMap.get('nickname');
  
  this.favoritesService.getFavorites(routeNickname || undefined).subscribe({
    next: (favorites: any[]) => {
      this.favoritesCount = favorites.length;
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Fetching favoris erreur :', err);
    }
  });
}

fetchWatched(): void {
  const routeNickname = this.route.snapshot.paramMap.get('nickname');
  
  this.watchedService.getWatched(routeNickname || undefined).subscribe({
    next: (watched: any[]) => {
      this.watchedCount = watched.length; 
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Fetching watched erreur :', err);
    }
  });
}

fetchWatchlist(): void {
  const routeNickname = this.route.snapshot.paramMap.get('nickname');
  
  this.watchlistService.getWatchlist(routeNickname || undefined).subscribe({
    next: (watchlist: any[]) => {
      this.watchlistCount = watchlist.length; 
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Fetching watchlist erreur :', err);
    }
  });
}
    
}
