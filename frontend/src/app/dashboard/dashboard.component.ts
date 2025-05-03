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
import { Title } from '@angular/platform-browser';


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
  newBio: string = '';
  errorMessage: string | null = null;
  isLoggedIn: boolean | undefined;
  bio: string = '';

  followersCount: number = 0;
  followingCount: number = 0;
  showEditIcon: boolean = false;
  connectedDevices: any[] = [];


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
    private titleService: Title
  ) {}
  
  ngOnInit(): void {
    
   this.loadProfile();
   this.fetchConnectedDevices();
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
            this.bio = profileResponse.bio;
            this.titleService.setTitle('Binge • profil de ' + profileResponse.nickname);
            this.fetchProfileData();
            this.fetchFollowers(routeNickname);
            this.fetchFollowings(routeNickname);
            this.checkFollowingStatus(routeNickname);
          } else {
            this.nickname = '';
            this.bio = '';
          }
          this.isLoading = false;
        });
      } else {
        this.nickname = this.currentNickname;
        this.bio = response ? response.bio : '';
        this.fetchProfileData();
        this.fetchFollowers(this.nickname);
        this.fetchFollowings(this.nickname);
        this.checkFollowingStatus(this.nickname);
        this.isLoading = false;
      }
    });
  });
}

fetchConnectedDevices(): void {
  this.authService.getConnectedDevices().subscribe({
    next: (devices) => {
      this.connectedDevices = devices;      
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Erreur lors de la récupération des appareils connectés :', err);
      this.connectedDevices = [];
    }
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
          this.followersList = followers;
          this.cdr.detectChanges();        

      },
      error: (err) => {
          console.error('Erreur lors de la récupération des followers :', err);
          this.followersList = [];

          this.followersCount = 0; 
      }
  });
}

fetchFollowings(nickname: string): void {
  this.memberservice.getFollowings(nickname).subscribe({
      next: (followings: any[]) => {
        this.followingsList = followings;
        this.cdr.detectChanges();        

          this.followingCount = Array.isArray(followings) ? followings.length : 0; 
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des following:', err);
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
    for (let i = 1; i <= 24; i++) {
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
  if (data.favorites?.length) {
    const favoriteMovieIds = data.favorites.map((item: any) => item.movie_id);
    this.detailsService.loadBatchMovies(favoriteMovieIds, 10).subscribe({
      next: (movies: any[]) => {
        this.favorites = movies;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.favorites = [];
      }
    });
  } else {
    this.favorites = [];
  }

  if (data.watchlist?.length) {
    const watchlistMovieIds = data.watchlist.map((item: any) => item.movie_id);
    this.detailsService.loadBatchMovies(watchlistMovieIds, 10).subscribe({
      next: (movies: any[]) => {
        this.watchlist = movies;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.watchlist = [];
      }
    });
  } else {
    this.watchlist = [];
  }

  if (data.watched?.length) {
    const watchedMovieIds = data.watched.map((item: any) => item.movie_id);
    this.detailsService.loadBatchMovies(watchedMovieIds, 10).subscribe({
      next: (movies: any[]) => {
        this.watched = movies;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.watched = [];
      }
    });
  } else {
    this.watched = [];
  }
}
goToProfile(nickname: string) {
  this.router.navigate(['/profil', nickname]);
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

  onSaveNewBio(): void {
    if (this.newBio.length > 10) {
      this.errorMessage = 'Votre biographie est invalide ou dépasse 10 caractères.';
      this.cdr.detectChanges();
      return;
    }
    this.authService.changeBio(this.newBio).subscribe({
      next: (response) => {

        this.bio = this.newBio;
        this.userService.updateBio(this.newBio); 
        this.errorMessage = null;
  
        this.router.navigate(['/profil', this.nickname]);

        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status === 400) {
          console.error('Erreur de mise à jour de la bio :', err);
          this.errorMessage = 'Erreur lors de la mise à jour de la bio. Veuillez réessayer plus tard.';
        }
        this.cdr.detectChanges();
      }
    });
  }
  
  toggleWatched(movieId: number): void {
    const movie = this.movie.find((m: any) => m.id === movieId);

    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
      return;
    }
    if (!movie) {
      return;
    }

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