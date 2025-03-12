import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
import { MovieService } from 'app/movie.service';

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

    loadMovies() {
      this.movieService.getNowPlayingMovies().subscribe({
        next: (data) => {        
          this.movie = data.results[2];                
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
  

  togglePassword() {
    this.passwordType = this.passwordType === 'password' ? 'text' : 'password';
  }
  
}
