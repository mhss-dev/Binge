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
  passwordType: string = 'password';

  constructor(private authService: AuthService, private router: Router) {}


  onRegister(): void {
    this.authService.register(this.username, this.password, this.nickname).subscribe({
      next: () => {
        this.registerMessage = "Inscription réussie, bienvenue " + this.nickname + ' !';
        this.alertType = 'alert-success';
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (error) => {
        if (error.status === 409) {
          this.registerMessage = "Ce nom de compte ou pseudo existe déjà";
          this.alertType = 'alert-danger';
        } else if (error.status === 400) {
          this.registerMessage = 'Tous les champs doivent être indiqués.';
          this.alertType = 'alert-danger';
        } else {
          this.registerMessage = 'Une erreur a eu lieu, réessayez.';
          this.alertType = 'alert-danger';
        }
      }
    });
  }

  togglePassword() {
    this.passwordType = this.passwordType === 'password' ? 'text' : 'password';
  }
  
}
