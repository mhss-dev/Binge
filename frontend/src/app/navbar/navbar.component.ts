import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener } from '@angular/core';
import { Router, RouterLink, RouterOutlet, NavigationEnd } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  isLoggedIn = false;
  nickname: string | null = null;
  isLogoVisible: boolean = true; 
  isScrolled = false;


  constructor(private authService: AuthService, private router: Router, private cdr: ChangeDetectorRef) {}

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

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50;
  }
  
  toggleLogo() {
    this.isLogoVisible = !this.isLogoVisible;
  }

  getNickname(): void {
    if (this.authService.isLoggedIn$) {
      this.authService.getProfil().subscribe({
        next: (response: any) => {
          this.nickname = response.nickname;
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
