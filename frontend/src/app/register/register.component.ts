import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  username: string = '';
  password: string = '';
  nickname: string = '';
  registerMessage: string = '';
  alertType: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  onRegister(): void {
    this.authService.register(this.username, this.password, this.nickname).subscribe({
      next: (response) => {
        if (response.status === 409) {
          this.registerMessage = "Ce nom de compte ou pseudo existe déjà";
          this.alertType = 'alert-danger';
        } else if (response.status === 200) {
          this.registerMessage = "Inscription avec succès. Bienvenue " + this.nickname;
          this.alertType = 'alert-success';
          setTimeout(() => this.router.navigate(['/profil']), 3000)
        } else if (response.status === 400) {
          this.registerMessage = 'Tous les champs doivent être indiqués.';
          this.alertType = 'alert-danger';
        } else {
          this.registerMessage = 'Une erreur a eu lieu, réessayez.';
          this.alertType = 'alert-danger';
        }
      },
      error: (error) => {
        this.registerMessage = 'Une erreur a eu lieu, réessayez.';
        this.alertType = 'alert-danger'; 
      }
    });
  }
}
