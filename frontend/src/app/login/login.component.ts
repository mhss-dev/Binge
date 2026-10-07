import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MovieService } from 'app/movie.service';
import { catchError, forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  standalone: true,

  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  username: string = '';
  password: string = '';
  loginMessage: string = '';
  alertType: string = '';
  passwordType: string = 'password';
  wall: string[][] = [];

  constructor(private authService: AuthService, private router: Router, private movieService: MovieService) {}

  ngOnInit(): void {
    const page = (n: number) => this.movieService.getNowPlayingMovies('BE', n).pipe(catchError(() => of({ results: [] })));
    forkJoin([page(1), page(2)]).subscribe(([first, second]) => {
      const posters: string[] = [...(first?.results ?? []), ...(second?.results ?? [])]
        .map((movie: { poster_path?: string | null }) => movie.poster_path ?? '')
        .filter((path: string) => /^\/[A-Za-z0-9_.-]{1,100}\.(jpg|jpeg|png|webp)$/.test(path))
        .map((path: string) => `https://image.tmdb.org/t/p/w342${path}`);
      if (posters.length < 9) {
        return;
      }
      const rows: string[][] = [[], [], []];
      posters.forEach((url, index) => rows[index % 3].push(url));
      this.wall = rows.map((row) => [...row, ...row]);
    });
  }

  onLogin(): void {
    this.authService.login(this.username, this.password).subscribe({
      next: (response) => {

        const nickname = response.body.nickname;        
      
        if (response.status === 200) {
          this.loginMessage = 'Connexion réussie, redirection vers votre profil.';
          this.alertType = 'alert-success';
          
          const redirectUrl = localStorage.getItem('redirectUrl')

          if (redirectUrl) {
            this.router.navigateByUrl(redirectUrl);
          }
          this.router.navigate(['/profil', nickname]);
        } else if (response.status === 201) {
          this.loginMessage = 'Vous êtes déjà connecté, redirection en cours.';
          this.alertType = 'alert-warning';
          this.router.navigate(['/profil', nickname]);
        } else {
          this.loginMessage = 'Une erreur est survenue, veuillez réessayer.';
          this.alertType = 'alert-danger';
        }
      },      
      error: () => {
        this.loginMessage = 'Les identifiants ne sont pas valides, veuillez tenter à nouveau.';
        this.alertType = 'alert-danger';
      }
    });
  }

  togglePassword() {
    this.passwordType = this.passwordType === 'password' ? 'text' : 'password';
  }
  
  
  
  
}