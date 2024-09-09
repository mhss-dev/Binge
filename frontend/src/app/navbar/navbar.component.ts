import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../auth.service';


@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  navbarClass: string = 'navbar-default'; 
  isLoggedIn = false;
  nickname: string | null = null;


  constructor(private authService: AuthService, private router: Router) {}

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
    });
  }
  
  getNickname(): void {
    if (this.authService.isLoggedIn$) {
      this.authService.getProfil().subscribe({
        next: (response: any) => {
          this.nickname = response.nickname;
        },
        error: (error: any) => {
          this.nickname = '';
        }
      });
    } else {
      this.nickname = '';
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
    scrollTo(id: string) : void {
    const element = document.querySelector(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
}
