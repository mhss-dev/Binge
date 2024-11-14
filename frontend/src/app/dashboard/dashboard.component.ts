import { ChangeDetectorRef, Component, HostListener, OnInit, signal } from '@angular/core';
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
  followersList: any[] = [];
  followingsList: any[] = [];
  isLoading: boolean = true;


  watchlist: any[] = [];
  watched: any[] = [];
  profileImage: string | ArrayBuffer | null = null;
  currentNickname: string = '';
  currentProfile: any;
  isButtonVisible = signal(false);


  avatars: string[] = this.getAvatars();


  selectedAvatar: string | null = null;

  moviesPerPage = 300;
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

loadProfile(): void {
  this.isLoading = true;

  this.authService.getProfil().pipe(
    catchError((error) => {
      console.error('Erreur lors de la récupération du profil de l\'utilisateur connecté:', error);
      this.isLoading = false;
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
              this.router.navigate(['/profil', this.currentNickname]);
            }
            this.isLoading = false;
            return of(null);
          })
        ).subscribe((profileResponse: any) => {
          if (profileResponse) {
            this.nickname = profileResponse.nickname;
            this.currentProfile = profileResponse;
            this.fetchProfileData(); // Combined fetch method
            this.fetchFollowers(routeNickname);
            this.fetchFollowings(routeNickname);
            this.checkFollowingStatus(routeNickname);
          } else {
            this.nickname = '';
          }
          this.isLoading = false;
        });
      } else {
        this.nickname = this.currentNickname;
        this.fetchProfileData(); // Combined fetch method
        this.fetchFollowers(this.nickname);
        this.fetchFollowings(this.nickname);
        this.checkFollowingStatus(this.nickname);
        this.isLoading = false;
      }
    });
  });
}


checkFollowingStatus(nickname: string): void {
  const localData = localStorage.getItem(`isFollowing_${nickname}`);
  if (localData !== null) {
      this.isFollowing = JSON.parse(localData);
      return;
  }

  this.memberservice.isFollowing(nickname).subscribe({
      next: (response: any) => {
          this.isFollowing = response.isFollowing;
          localStorage.setItem(`isFollowing_${nickname}`, JSON.stringify(this.isFollowing));
      },
      error: (err) => {
          this.isFollowing = false;
      }
  });
}

fetchFollowers(nickname: string): void {
  const localData = localStorage.getItem(`followers_${nickname}`);
  if (localData) {
      const followers = JSON.parse(localData);
      this.followersCount = followers.length;
      this.followersList = followers;
      this.cdr.detectChanges();
      return;
  }

  this.memberservice.getFollowers(nickname).subscribe({
      next: (followers: any[]) => {
          this.followersCount = followers.length;
          this.followersList = followers;
          localStorage.setItem(`followers_${nickname}`, JSON.stringify(followers));
          this.cdr.detectChanges();
      },
      error: (err) => {
          this.followersList = [];
          this.followersCount = 0;
      }
  });
}

fetchFollowings(nickname: string): void {
  const localData = localStorage.getItem(`followings_${nickname}`);
  if (localData) {
      const followings = JSON.parse(localData);
      this.followingCount = followings.length;
      this.followingsList = followings;
      this.cdr.detectChanges();
      return;
  }

  this.memberservice.getFollowings(nickname).subscribe({
      next: (followings: any[]) => {
          this.followingCount = followings.length;
          this.followingsList = followings;
          localStorage.setItem(`followings_${nickname}`, JSON.stringify(followings));
          this.cdr.detectChanges();
      },
      error: (err) => {
          this.followingsList = [];
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
              localStorage.setItem(`isFollowing_${this.nickname}`, JSON.stringify(this.isFollowing));
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
              localStorage.setItem(`isFollowing_${this.nickname}`, JSON.stringify(this.isFollowing));
              this.cdr.detectChanges();
          },
          error: (err) => {
              console.error('Erreur following :', err);
          }
      });
  }
}


  

  selectAvatar(avatarUrl: string, event: MouseEvent): void {
    this.selectedAvatar = avatarUrl;

    const avatarOptions = document.querySelectorAll('.avatar-option');
    avatarOptions.forEach(option => {
        option.classList.remove('selected'); 
    });

    const target = event.currentTarget as HTMLElement;
    target.classList.add('selected');
  }
  
  saveAvatar(): void {
    if (this.selectedAvatar) {
      this.memberservice.updateAvatar(this.selectedAvatar).subscribe({
        next: () => {          
          this.currentProfile.avatar_url = this.selectedAvatar;
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
    for (let i = 1; i <= 20; i++) {
        images.push(`assets/images/${i}.png`);
    }
    return images;
}

fetchProfileData(): void {
  const routeNickname = this.route.snapshot.paramMap.get('nickname');

  this.memberservice.getProfileData(routeNickname || undefined).subscribe({
    next: (data: any) => {
      this.processProfileData(data);
    },
    error: (err) => {
      console.error('Erreur lors de la récupération des données du profil :', err);
    }
  });
}

processProfileData(data: any): void {
  if (data.favorites && data.favorites.length) {
      const favoriteMovieIds = data.favorites.map((item: any) => item.movie_id);
      const favoriteRequests = favoriteMovieIds.map((id: any) => this.detailsService.getMovieByID(id));

      forkJoin(favoriteRequests).subscribe({
          next: (movies: any) => {
              this.favorites = movies;
              localStorage.setItem(`favorites_${this.nickname}`, JSON.stringify(movies));
              this.cdr.detectChanges();
          },
          error: (err) => {
              this.favorites = [];
          }
      });
  } else {
      this.favorites = [];
  }

  if (data.watchlist && data.watchlist.length) {
      const watchlistMovieIds = data.watchlist.map((item: any) => item.movie_id);
      const watchlistRequests = watchlistMovieIds.map((id: any) => this.detailsService.getMovieByID(id));

      forkJoin(watchlistRequests).subscribe({
          next: (movies: any) => {
              this.watchlist = movies;
              localStorage.setItem(`watchlist_${this.nickname}`, JSON.stringify(movies));
              this.cdr.detectChanges();
          },
          error: (err) => {
              this.watchlist = [];
          }
      });
  } else {
      this.watchlist = [];
  }

  if (data.watched && data.watched.length) {
      const watchedMovieIds = data.watched.map((item: any) => item.movie_id);
      const watchedRequests = watchedMovieIds.map((id: any) => this.detailsService.getMovieByID(id));

      forkJoin(watchedRequests).subscribe({
          next: (movies: any) => {
              this.watched = movies;
              localStorage.setItem(`watched_${this.nickname}`, JSON.stringify(movies));
              this.cdr.detectChanges();
          },
          error: (err) => {
              this.watched = [];
          }
      });
  } else {
      this.watched = [];
  }
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
  
        this.nickname = this.newNickname;
        this.currentNickname = this.newNickname; 
        this.userService.updateNickname(this.newNickname); 
        this.errorMessage = null;
  
        this.router.navigate(['/profil', this.newNickname]);

        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status === 409) {
          this.errorMessage = 'Ce pseudonyme est déjà pris. Veuillez en choisir un autre.';
        } else {
          console.error('Erreur de mise à jour du pseudo :', err);
          this.errorMessage = 'Erreur lors de la mise à jour du pseudonyme. Veuillez réessayer plus tard.';
        }
        this.cdr.detectChanges();
      }
    });
  }
  
  


  @HostListener('window:scroll', ['$event'])
  onScroll(event: Event): void {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const bodyHeight = document.documentElement.scrollHeight;

    const scrollPercentage = (scrollTop / (bodyHeight - windowHeight)) * 100;

    this.isButtonVisible.set(scrollPercentage > 40);
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

}