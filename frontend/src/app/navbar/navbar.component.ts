import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { NotificationService } from 'app/notifications.service';
import { DetailsService } from 'app/details.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  isLoggedIn = false;
  nickname: string | null = null;
  isLogoVisible = true;
  isScrolled = false;
  isNavbarCollapsed = true;
  searchQuery = '';
  avatar = '';
  unreadNotifications: any[] = [];
  movieTitles: any[] = [];
  isSearchOpen = false;

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
    private movieService: DetailsService
  ) {}

  ngAfterViewInit(): void {
    if (this.isSearchOpen) {
      setTimeout(() => this.searchInput?.nativeElement.focus(), 50);
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
      },
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
    if (!this.searchQuery.trim()) {
      return;
    }

    this.router.navigate(['/search'], {
      queryParams: { query: this.searchQuery },
    });
    this.closeSearch();
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
    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        notification.read = true;
        this.unreadNotifications = this.unreadNotifications.filter((notif) => notif.id !== notification.id);
      },
    });
  }

  clearAllNotifications(): void {
    this.unreadNotifications.forEach((notification) => {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          notification.read = true;
        },
      });
    });

    this.unreadNotifications = [];
  }

  getTypeText(type: string): string {
    return this.typeMapping[type] || '';
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isScrolled = window.scrollY > 50;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isSearchOpen) {
      this.closeSearch();
    }
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
    this.isSearchOpen = true;
    this.closeNavbar();
    setTimeout(() => this.searchInput?.nativeElement.focus(), 50);
  }

  closeSearch(): void {
    this.isSearchOpen = false;
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
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Déconnexion échouée', err);
      },
    });
  }
}
