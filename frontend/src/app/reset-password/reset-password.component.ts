import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { AdminService } from '../admin.service';
import { PosterWallComponent } from '../poster-wall/poster-wall.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PosterWallComponent],
  templateUrl: './reset-password.component.html',
})
export class ResetPasswordComponent implements OnInit {
  state: 'checking' | 'invalid' | 'form' | 'done' = 'checking';
  nickname = '';
  username = '';
  password = '';
  confirm = '';
  error = '';
  sending = false;
  passwordType: 'password' | 'text' = 'password';
  private token = '';

  constructor(private adminService: AdminService, private titleService: Title) {}

  ngOnInit(): void {
    this.titleService.setTitle('Binge • nouveau mot de passe');
    // The token lives after "#" so it never reaches a server; take it out of the address bar and history.
    this.token = decodeURIComponent(window.location.hash.slice(1));
    history.replaceState(null, '', window.location.pathname);
    if (!this.token) {
      this.state = 'invalid';
      return;
    }
    this.adminService.checkResetToken(this.token).subscribe({
      next: (data) => {
        this.nickname = data.nickname;
        this.username = data.username;
        this.state = 'form';
      },
      error: () => (this.state = 'invalid'),
    });
  }

  togglePassword(): void {
    this.passwordType = this.passwordType === 'password' ? 'text' : 'password';
  }

  submit(): void {
    this.error = '';
    if (this.password.length < 8) {
      this.error = 'Le mot de passe doit faire au moins 8 caractères.';
      return;
    }
    if (new TextEncoder().encode(this.password).length > 72) {
      this.error = 'Le mot de passe est trop long.';
      return;
    }
    if (this.password !== this.confirm) {
      this.error = 'Les deux mots de passe ne sont pas identiques.';
      return;
    }
    this.sending = true;
    this.adminService.resetPassword(this.token, this.password).subscribe({
      next: () => {
        this.token = '';
        this.password = '';
        this.confirm = '';
        this.state = 'done';
      },
      error: (err) => {
        this.sending = false;
        if (err.status === 404) {
          this.state = 'invalid';
        } else {
          this.error = err.error?.error || 'Erreur, réessaie dans un instant.';
        }
      },
    });
  }
}
