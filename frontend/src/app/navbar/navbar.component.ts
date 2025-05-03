import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener } from '@angular/core';
import { Router, RouterLink, RouterOutlet, NavigationEnd, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth.service';
import { FormsModule, NgModel } from '@angular/forms';
import { DiscoverService } from 'app/discover.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule, FormsModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  isLoggedIn = false;
  nickname: string | null = null;
  isLogoVisible: boolean = true; 
  isScrolled: boolean = false;
  isNavbarCollapsed: boolean = true;
  isLoading: boolean = false;
  films: any[] = [];
  searchQuery: string = ''; 
  avatar: string = '';


  constructor(private route: ActivatedRoute, private authService: AuthService, private router: Router, private cdr: ChangeDetectorRef, private discoverService: DiscoverService) {}

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
  }

  ngOnInit(): void {

    this.authService.isLoggedIn$.subscribe({
      next: (status: boolean) => {
        this.isLoggedIn = status; 
        if (this.isLoggedIn) {
          this.getNickname();
        } else {
          return;
        }
      },
      error: (error: any) => {
        console.error("Erreur lors de la  récupération du status de connexion :", error);
      }
    })
  }

  searchFilms(): void {
    if (!this.searchQuery) return;
    
    this.router.navigate(['/search'], { queryParams: { query: this.searchQuery } });
  }
  
  

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50;
  }

  toggleNavbar(): void {
    this.isNavbarCollapsed = !this.isNavbarCollapsed;
  }
  
  
  toggleLogo() {
    this.isLogoVisible = !this.isLogoVisible;
  }

  getNickname(): void {
    if (this.authService.isLoggedIn$) {
      this.authService.getProfil().subscribe({
        next: (response: any) => {          
          this.nickname = response.nickname;
          this.avatar = response.avatar_url
          this.cdr.detectChanges(); 
        },
        error: (error: any) => {
          this.nickname = '';
          this.cdr.detectChanges(); 
        }
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
        }
      });
    }

    
}
