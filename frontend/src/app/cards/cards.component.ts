import { Component } from '@angular/core';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MovieService } from '../movie.service';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-cards',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cards.component.html',
  styleUrl: './cards.component.css'
})
export class CardsComponent {
  movies: any[] = [];
  error: string = '';
  minDate: string = '';
  maxDate: string = '';

  constructor(private movieService: MovieService) { }

  ngOnInit(): void {
    this.movieService.getNowPlayingMovies().subscribe({
      next: (data) => {
        this.movies = data.results;
        this.minDate = data.dates.minimum;
        this.maxDate = data.dates.maximum;
      },
      error: (error) => {
        this.error = 'Erreur lors de la récupération des films';
        console.error(error);
      },
      complete: () => {
        console.log('Données des films récupérées avec succès');
      }
    });
  }
}