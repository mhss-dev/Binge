import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  standalone: true,

  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  loginMessage: string = '';
  alertType: string = '';

  constructor(private authService: AuthService, private router: Router) {}


  onLogin(): void {
    this.authService.login(this.username, this.password).subscribe({
      next: (response) => {

        if (response.status === 200) {
          this.loginMessage = 'Connexion réussie, redirection vers votre profil.';
          this.alertType = 'alert-success';
          this.router.navigate(['/profil'])
        } else if (response.status === 201) {
          this.loginMessage = 'Vous êtes déjà connecté, redirection en cours.';
          this.alertType = 'alert-warning';
          setTimeout(() => this.router.navigate(['/profil']), 2000);
        } else {
          this.loginMessage = 'Une erreur est survenue, veuillez réessayer.';
          this.alertType = 'alert-danger';
        }
      },
      error: (err) => {
        this.loginMessage = 'Les identifiants ne sont pas valides, veuillez tenter à nouveau.';
        this.alertType = 'alert-danger';
      }
    });
  }
  
  
}