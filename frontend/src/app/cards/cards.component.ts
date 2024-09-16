import { AfterViewInit, Component, OnInit } from '@angular/core';
import { MovieService } from '../movie.service';
import { CommonModule } from '@angular/common';
import { RouterLink, Route } from '@angular/router';
import { forkJoin } from 'rxjs';
import * as bootstrap from 'bootstrap';
import { NgbAlert, NgbCarousel, NgbSlide } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-cards',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cards.component.html',
  styleUrl: './cards.component.css', 

})
export class CardsComponent implements OnInit {
  movies: any[] = [];
  trendingMovies: any[] = [];
  upcomingMovies: any[] = [];
  toprated: any[] = [];
  error: string = '';
  minDate: string = '';
  maxDate: string = '';

  constructor(private movieService: MovieService) {}

  ngOnInit(): void {
    this.fetchMovieData();
  }

  fetchMovieData(): void {
    const nowPlaying$ = this.movieService.getNowPlayingMovies();
    const trending$ = this.movieService.getTrending();
    const upcoming$ = this.movieService.getUpcoming();
    const toprated$ = this.movieService.getTopRated();

    forkJoin([nowPlaying$, trending$, upcoming$, toprated$]).subscribe({
      next: ([nowPlayingData, trendingData, upcomingData, topratedData]) => {
        this.movies = nowPlayingData.results;
        this.trendingMovies = trendingData.results;
        this.upcomingMovies = upcomingData.results;
        this.toprated = topratedData.results;
        this.minDate = nowPlayingData.dates.minimum;
        this.maxDate = nowPlayingData.dates.maximum;
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

    chunkArray(myArray: any[], chunkSize: number) {
    let results = [];
    for (let i = 0; i < myArray.length; i += chunkSize) {
      let chunk = myArray.slice(i, i + chunkSize);
      results.push(chunk);
    }
    return results;
  }

}