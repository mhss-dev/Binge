import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FavoritesService } from '../favorites.service';
import { WatchlistService } from '../watchlist.service';
import { WatchedService } from '../watched.service';
import { DetailsService } from '../details.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { UserService } from 'app/services/user.service';
import { MembersService } from 'app/members.service';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {
  nickname: string = '';
  movie: any = null;
  favorites: any[] = [];
  watchlist: any[] = [];
  watched: any[] = [];
  profileImage: string | ArrayBuffer | null = null;
  currentNickname: string = '';
  currentProfile: any;

  avatars: string[] = this.getAvatars();


  selectedAvatar: string | null = null;

  moviesPerPage = 60;
  combinedMovies: any=[];
  isFollowing: boolean = false;


  currentFavoritesPage = 1;
  currentWatchlistPage = 1;
  currentWatchedPage = 1;

  newNickname: string = '';
  errorMessage: string | null = null;
  isLoggedIn: boolean | undefined;

  followersCount: number = 0;
  followingCount: number = 0;


  constructor(
    private router: Router, 
    private authService: AuthService, 
    private watchedService: WatchedService, 
    private watchlistService: WatchlistService, 
    private favoritesService: FavoritesService, 
    private cdr: ChangeDetectorRef,
    private detailsService: DetailsService,
    private userService: UserService,
    private route: ActivatedRoute,
    private memberservice: MembersService,
  ) {}
  
  ngOnInit(): void {
    
   this.loadProfile();
}

  loadProfile() : void {

    this.authService.getProfil().pipe(
      catchError((error) => {
          console.error('Erreur lors de la récupération du profil de l\'utilisateur connecté:', error);
          return of(null);
      })
  ).subscribe((response: any) => {
      if (response) {
          this.currentNickname = response.nickname;
      }
      
      this.route.paramMap.subscribe(params => {
          const routeNickname = params.get('nickname');

          if (routeNickname) {
              
              this.authService.getProfil(routeNickname).pipe(
                  catchError((error) => {
                      console.error('Erreur lors de la récupération du profil:', error);
                      if (error.status === 404) {
                          this.router.navigate(['/profil']);
                      }
                      return of(null);
                  })
              ).subscribe((profileResponse: any) => {
                  if (profileResponse) {
                      this.nickname = profileResponse.nickname; 
                      this.currentProfile = profileResponse;
                      
                      this.fetchFollowers(routeNickname);
                      this.fetchFavorites();
                      this.fetchWatched();
                      this.fetchWatchlist();
                      this.fetchFollowings(routeNickname);
                      this.checkFollowingStatus(routeNickname);
                  } else {
                      this.nickname = '';  
                  }
              });
          } else {
              this.nickname = this.currentNickname;
              console.log(this.nickname);

              this.fetchFollowers(this.nickname);
              this.fetchFollowings(this.nickname);
              this.checkFollowingStatus(this.nickname);
              this.fetchFavorites();
              this.fetchWatched();
              this.fetchWatchlist();
          }
      });
  });
  }

  checkFollowingStatus(nickname: string): void {
    this.memberservice.isFollowing(nickname).subscribe({
        next: (response: any) => {
            this.isFollowing = response.isFollowing; 
        },
        error: (err) => {
            this.isFollowing = false; 
        }
    });
}

  
  
fetchFollowers(nickname: string): void {
  this.memberservice.getFollowers(nickname).subscribe({
      next: (followers: any[]) => {
          this.followersCount = Array.isArray(followers) ? followers.length : 0; 
      },
      error: (err) => {
          console.error('Erreur lors de la récupération des followers :', err);
          this.followersCount = 0; 
      }
  });
}

fetchFollowings(nickname: string): void {
  this.memberservice.getFollowings(nickname).subscribe({
      next: (followings: any[]) => {
          this.followingCount = Array.isArray(followings) ? followings.length : 0; 
      },
      error: (err) => {
          console.error('Erreur lors de la récupération des following:', err);
          this.followingCount = 0; 
      }
  });
}


toggleFollow(): void {
  if (this.isFollowing) {
      this.memberservice.unfollowUser(this.nickname).subscribe({
          next: () => {
              this.isFollowing = false; 
              this.followersCount--; 
              this.cdr.detectChanges(); 

          },
          error: (err) => {
              console.error('Erreur unfollowing:', err);
          }
      });
  } else {
      this.memberservice.followUser(this.nickname).subscribe({
          next: () => {
              this.isFollowing = true; 
              this.followersCount++; 
              this.cdr.detectChanges(); 
          },
          error: (err) => {
              console.error('Erreur following :', err);
          }
      });
  }
}


  fetchFavorites(): void {
    const routeNickname = this.route.snapshot.paramMap.get('nickname');

    this.favoritesService.getFavorites(routeNickname || undefined).subscribe({
      next: (favorites: any[]) => {
        if (favorites.length === 0) {
          this.favorites = [];
          return;
        }

        favorites.reverse();
    
        const movieIds = favorites.map(fav => fav.movie_id);
        const requests = movieIds.map(id => this.detailsService.getMovieByID(id));
    
        forkJoin(requests).subscribe({
          next: (movies) => {
            this.favorites = movies;
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Fetch favoris :', err);
          }
        });
      },
      error: (err) => {
        console.error('Fetch favoris :', err);
      }
    });
    
  }
  

  selectAvatar(avatarUrl: string): void {
    this.selectedAvatar = avatarUrl;
  }
  
  saveAvatar(): void {
    if (this.selectedAvatar) {
      this.memberservice.updateAvatar(this.selectedAvatar).subscribe({
        next: (response) => {          
          this.currentProfile.avatarUrl = this.selectedAvatar;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
        }
      });
    }
  }
  
  
  getAvatars(): string[] {
    const images: string[] = [];
    for (let i = 1; i <= 13; i++) {
        images.push(`assets/images/${i}.png`);
    }
    return images;
}

  fetchWatchlist(): void {
    const routeNickname = this.route.snapshot.paramMap.get('nickname');

    this.watchlistService.getWatchlist(routeNickname|| undefined).subscribe({
      next: (watchlist: any[]) => {


        if (watchlist.length === 0) {
          this.watchlist = [];
          return;
        }

        watchlist.reverse();

        const movieIds = watchlist.map(item => item.movie_id);
        const requests = movieIds.map(id => this.detailsService.getMovieByID(id));
        
        forkJoin(requests).subscribe({
          next: (movies) => {
            this.watchlist = movies;
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Erreur lors de la récupération des détails du film :', err);
          }
        });
      },
      error: (err) => {
        console.error('Erreur lors de la récupération de la watchlist :', err);
      }
    });
  }


  fetchWatched(): void {
    const routeNickname = this.route.snapshot.paramMap.get('nickname');

    this.watchedService.getWatched(routeNickname|| undefined).subscribe({
      next: (watched: any[]) => {

        if (watched.length === 0) {
          this.watchlist = [];
          return;
        }

        watched.reverse();

        const movieIds = watched.map(item => item.movie_id);
        const requests = movieIds.map(id => this.detailsService.getMovieByID(id));
        
        forkJoin(requests).subscribe({
          next: (movies) => {
            this.watched = movies;
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Erreur lors de la récupération des détails du film :', err);
          }
        });
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des films regardés :', err);
      }

    });
  }

  handleEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onSaveNewNickname();
    }
  }

  onSaveNewNickname(): void {
    if (!this.newNickname || this.newNickname.length > 20) {
      this.errorMessage = 'Votre pseudonyme est invalide ou dépasse 20 caractères.';
      this.cdr.detectChanges();
      return;
    }

    this.authService.changeNickname(this.newNickname).subscribe({
      next: (response) => {
        console.log('Pseudo mis à jour :', response);
        this.userService.updateNickname(this.newNickname);
        this.errorMessage = null;
        
        
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur de mise à jour du pseudo :', err);
        this.errorMessage = 'Erreur lors de la mise à jour du pseudonyme. Veuillez réessayer plus tard.';
        this.cdr.detectChanges();
      }
    });
  }

  






  @HostListener('window:scroll', ['$event'])
  onScroll(event: any): void {
    const button = document.getElementById('back-to-top');
    if (button) {
      if (window.scrollY > 300) {
        button.classList.add('show');
      } else {
        button.classList.remove('show');
      }
    }
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
onLogout(): void {
  this.authService.logout().subscribe({
    next: () => {
      this.router.navigate(['login']); 
    },
    error: (err) => {
      console.error('Erreur lors de la déconnexion:', err);
    }
  });
}

combineMovies() : void {
  this.combinedMovies = [
    ...this.favorites.map(movie => ({ ...movie, type: 'Favorite' })),
    ...this.watchlist.map(movie => ({ ...movie, type: 'Watchlist' })),
    ...this.watched.map(movie => ({ ...movie, type: 'Watched' })),
  ];
}

getTotalPages(arrayLength: number): number[] {
  return Array(Math.ceil(arrayLength / this.moviesPerPage))
    .fill(0)
    .map((_, i) => i + 1);
}

get totalFavoritesPages(): number[] {
  return this.getTotalPages(this.favorites.length);
}

get totalWatchlistPages(): number[] {
  return this.getTotalPages(this.watchlist.length);
}

get totalWatchedPages(): number[] {
  return this.getTotalPages(this.watched.length);
}

paginatedFavorites() {
  const startIndex = (this.currentFavoritesPage - 1) * this.moviesPerPage;
  return this.favorites.slice(startIndex, startIndex + this.moviesPerPage);
}

paginatedWatchlist() {
  const startIndex = (this.currentWatchlistPage - 1) * this.moviesPerPage;
  return this.watchlist.slice(startIndex, startIndex + this.moviesPerPage);
}

paginatedWatched() {
  const startIndex = (this.currentWatchedPage - 1) * this.moviesPerPage;
  return this.watched.slice(startIndex, startIndex + this.moviesPerPage);
}

previousFavoritesPage() {
  if (this.currentFavoritesPage > 1) {
    this.currentFavoritesPage--;
  }
}

nextFavoritesPage() {
  if (this.currentFavoritesPage < this.totalFavoritesPages.length) {
    this.currentFavoritesPage++;
  }
}

goToFavoritesPage(pageNumber: number) {
  this.currentFavoritesPage = pageNumber;
}

previousWatchlistPage() {
  if (this.currentWatchlistPage > 1) {
    this.currentWatchlistPage--;
  }
}

nextWatchlistPage() {
  if (this.currentWatchlistPage < this.totalWatchlistPages.length) {
    this.currentWatchlistPage++;
  }
}

goToWatchlistPage(pageNumber: number) {
  this.currentWatchlistPage = pageNumber;
}

previousWatchedPage() {
  if (this.currentWatchedPage > 1) {
    this.currentWatchedPage--;
  }
}

nextWatchedPage() {
  if (this.currentWatchedPage < this.totalWatchedPages.length) {
    this.currentWatchedPage++;
  }
}

goToWatchedPage(pageNumber: number) {
  this.currentWatchedPage = pageNumber;
}
}