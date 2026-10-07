import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, inject, NgZone, DestroyRef } from '@angular/core';
import { watchScroll } from '../scroll.util';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../auth.service';
import { NotificationService } from 'app/notifications.service';
import { DetailsService } from 'app/details.service';
import { SearchPaletteService } from '../search-palette/search-palette.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  private readonly scrollWatch = watchScroll(inject(NgZone), inject(DestroyRef), () => (window.scrollY > 50) !== this.isScrolled, () => (this.isScrolled = window.scrollY > 50));
  isLoggedIn = false;
  nickname: string | null = null;
  isLogoVisible = true;
  isScrolled = false;
  isNavbarCollapsed = true;
  avatar = '';
  unreadNotifications: any[] = [];
  movieTitles: any[] = [];
  private wasLoggedIn = false;

  typeMapping: { [key: string]: string } = {
    watchlist: 'dans sa watchlist',
    watched: 'dans ses visionnés',
    favorite: 'dans ses favoris',
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
    private movieService: DetailsService,
    private searchPalette: SearchPaletteService
  ) {}

  ngOnInit(): void {
    this.authService.isLoggedIn$.subscribe({
      next: (status: boolean) => {
        this.isLoggedIn = status;
        if (this.isLoggedIn) {
          this.wasLoggedIn = true;
          this.getNickname();
          this.fetchNotifications();
        } else {
          this.nickname = null;
          this.avatar = '';
          this.unreadNotifications = [];
          this.notificationService.clearNotificationsState();
          this.closeNavbar();
          if (this.wasLoggedIn && this.requiresLogin(this.router.url)) {
            this.router.navigate(['/login']);
          }
          this.wasLoggedIn = false;
        }
      },
      error: (error: any) => {
        console.error('Erreur lors de la récupération du statut de connexion :', error);
      },
    });

    this.notificationService.getNotificationsState().subscribe((notifications) => {
      this.unreadNotifications = Array.isArray(notifications) ? notifications : [];
      this.unreadNotifications.forEach((notification) => {
        if (notification.movie_id && !this.movieTitles[notification.movie_id]) {
          this.fetchMovieTitle(notification.movie_id);
        }
      });
    });
  }

  private requiresLogin(url: string): boolean {
    const path = url.split('?')[0];
    return path === '/match' || path.startsWith('/membres') || path.startsWith('/profil/');
  }

  fetchNotifications(): void {
    this.notificationService.getNotifications().subscribe({
      next: (notifications) => {
        this.notificationService.setNotifications(notifications);
      },
    });
  }

  fetchMovieTitle(movieId: number): void {
    this.movieService.getMovieByID(movieId).subscribe((movie: any) => {
      this.movieTitles[movieId] = movie.title;
    });
  }

  markNotificationAsRead(notification: any): void {
    this.notificationService.markNotificationAsReadInState(notification.id);

    this.notificationService.markAsRead(notification.id).subscribe({
      error: () => {
        this.fetchNotifications();
      },
    });
  }

  clearAllNotifications(): void {
    const notificationsToClear = [...this.unreadNotifications];
    this.notificationService.clearNotificationsState();

    notificationsToClear.forEach((notification) => {
      this.notificationService.markAsRead(notification.id).subscribe({
        error: () => {
          this.fetchNotifications();
        },
      });
    });
  }

  getTypeText(type: string): string {
    return this.typeMapping[type] || '';
  }


  toggleNavbar(): void {
    this.isNavbarCollapsed = !this.isNavbarCollapsed;
    this.isLogoVisible = this.isNavbarCollapsed;
  }

  closeNavbar(): void {
    this.isNavbarCollapsed = true;
    this.isLogoVisible = true;
  }

  openSearch(): void {
    this.closeNavbar();
    this.searchPalette.open();
  }

  getNickname(): void {
    if (this.authService.isLoggedIn$) {
      this.authService.getProfil().subscribe({
        next: (response: any) => {
          this.nickname = response.nickname;
          this.avatar = response.avatar_url;
          this.cdr.detectChanges();
        },
        error: () => {
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
        this.notificationService.clearNotificationsState();
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Déconnexion échouée', err);
      },
    });
  }
}
