import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  HostListener,
  ViewChild,
} from '@angular/core';
import {
  Router,
  RouterLink,
  RouterOutlet,
  NavigationEnd,
  ActivatedRoute,
} from '@angular/router';
import { AuthService } from '../auth.service';
import { FormsModule, NgModel } from '@angular/forms';
import { DiscoverService } from 'app/discover.service';
import { NotificationService } from 'app/notifications.service';
import { catchError, forkJoin, of } from 'rxjs';
import { DetailsService } from 'app/details.service';

declare var bootstrap: any;

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  @ViewChild('searchInput') searchInput: any;
  isLoggedIn = false;
  nickname: string | null = null;
  isLogoVisible: boolean = true;
  isScrolled: boolean = false;
  isNavbarCollapsed: boolean = true;
  isLoading: boolean = false;
  films: any[] = [];
  searchQuery: string = '';
  avatar: string = '';
  unreadNotifications: any[] = [];
  notifications: any[] = [];
  movieTitles: any[] = [];
  isNotificationsOpen: boolean = false;
  typeMapping: { [key: string]: string } = {
  watchlist: 'dans sa watchlist',
  watched: 'dans ses visionnés',
  favorite: 'dans ses favoris',
};



  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
    private movieService: DetailsService

  ) {}
  ngAfterViewInit() {
    const navbarCollapse = document.getElementById('navbarNav');
    if (navbarCollapse) {
      navbarCollapse.addEventListener('show.bs.collapse', () => {
        this.isLogoVisible = true;
      });

      navbarCollapse.addEventListener('hide.bs.collapse', () => {
        this.isLogoVisible = false;
      });
    }
    const modalElement = document.getElementById('searchModal');

    if (modalElement) {
      modalElement.addEventListener('shown.bs.modal', () => {
        setTimeout(() => {
          if (this.searchInput) {
            this.searchInput.nativeElement.focus();
          }
        }, 200);
      });
    }
  }

ngOnInit(): void {
  this.authService.isLoggedIn$.subscribe({
    next: (status: boolean) => {
      this.isLoggedIn = status;
      if (this.isLoggedIn) {
        this.getNickname();
        this.fetchNotifications();
      } else {
        this.unreadNotifications = [];
      }
    },
    error: (error: any) => {
      console.error('Erreur lors de la récupération du statut de connexion :', error);
    }
  });

    this.notificationService.getNotifications().subscribe((notifications) => {
      this.unreadNotifications = Array.isArray(notifications) ? notifications : [];
      this.unreadNotifications.forEach((notification) => {
        if (notification.movie_id && !this.movieTitles[notification.movie_id]) {
          this.fetchMovieTitle(notification.movie_id);
        }
      });
    });
}

  searchFilms(): void {
    if (!this.searchQuery) return;

    this.router.navigate(['/search'], {
      queryParams: { query: this.searchQuery },
    });
    const modalElement = document.getElementById('searchModal');
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) {
      modal.hide();
    }
  }

  fetchNotifications(): void {
    this.notificationService.getNotifications().subscribe({
      next: (notifications) => {
        this.notificationService.setNotifications(notifications);
      },
      error: (err) => {
      },
    });
  }
    fetchMovieTitle(movieId: number): void {
    this.movieService.getMovieByID(movieId).subscribe((movie : any) => {
      this.movieTitles[movieId] = movie.title;
    });
  }

  markNotificationAsRead(notification: any): void {
    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        notification.read = true;
        this.unreadNotifications = this.unreadNotifications.filter(
          (notif) => notif.id !== notification.id
        );
      },
      error: (err) => {
      },
    });
}

  clearAllNotifications(): void {
    this.unreadNotifications.forEach((notification) => {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          notification.read = true;
        },
        error: (err) => {
        },
      });
    });

    this.unreadNotifications = [];
  }

getTypeText(type: string): string {
  return this.typeMapping[type] || '';
}
  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50;
  }

  toggleNavbar(): void {
    this.isNavbarCollapsed = !this.isNavbarCollapsed;
  }
  closeNavbar() {
    this.isNavbarCollapsed = true;
  }

  toggleLogo() {
    this.isLogoVisible = !this.isLogoVisible;
  }
  closeModalAfterEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.searchFilms();
    }
  }

  getNickname(): void {
    if (this.authService.isLoggedIn$) {
      this.authService.getProfil().subscribe({
        next: (response: any) => {
          this.nickname = response.nickname;
          this.avatar = response.avatar_url;
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          this.nickname = '';
          this.cdr.detectChanges();
        },
      });
    } else {
      this.nickname = '';
      this.cdr.detectChanges();
    }
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.isLoggedIn = false;
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Déconnexion échouée', err);
      },
    });
  }
}
