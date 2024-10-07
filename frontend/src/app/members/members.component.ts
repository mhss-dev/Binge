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
    private watchedService: WatchedService,
    private watchlistService: WatchlistService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,


  ) {}

    ngOnInit(): void {
      this.MembreService.getMembers().subscribe({
        next: (response) => {
          this.members = response;
          this.updateCounts();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Erreur lors de la récupération des membres:', err);
        }
      });
    }
  
    updateCounts(): void {
      const routeNickname = this.route.snapshot.paramMap.get('nickname');
      const currentUser = this.members.find(member => member.nickname === routeNickname);
  
      if (currentUser) {
        this.favoritesCount = currentUser.favorites_count || 0;
        this.watchedCount = currentUser.watched_count || 0;
        this.watchlistCount = currentUser.watchlist_count || 0;
      } else {
        this.favoritesCount = 0;
        this.watchedCount = 0;
        this.watchlistCount = 0;
      }
    }
  }