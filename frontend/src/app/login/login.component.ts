import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MovieService } from 'app/movie.service';
import { interval, Subscription } from 'rxjs';

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
  passwordType: string = 'password';
  movie: any = {};

  private subscription: Subscription = new Subscription();
  private readonly BACKDROP_UPDATE_INTERVAL = 5000;

  constructor(private authService: AuthService, private router: Router, private movieService: MovieService) {}


  ngOnInit(): void {
    this.loadMovies();
    this.setupBackgroundUpdater();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  
  loadMovies() {
    this.movieService.getNowPlayingMovies().subscribe({
      next: (data) => {        
        this.movie = data.results[this.getRandomBackdrop(0, data.results.length -1)];                
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des films en cours', error);
      }
    });
  }

  private getRandomBackdrop(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private setupBackgroundUpdater() {
    this.subscription.add(
      interval(this.BACKDROP_UPDATE_INTERVAL).subscribe(() => {
        this.loadMovies();
      })
    );
  }

  onLogin(): void {
    this.authService.login(this.username, this.password).subscribe({
      next: (response) => {


        const nickname = response.body.nickname;        
      
        if (response.status === 200) {
          this.loginMessage = 'Connexion réussie, redirection vers votre profil.';
          this.alertType = 'alert-success';
          // this.router.navigate(['/profil', nickname]);
          this.router.navigate(['/films']);
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