import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DiscoverService } from 'app/discover.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit {
  searchQuery: string = '';
  films: any[] = [];
  isLoading: boolean = false;

  constructor(private route: ActivatedRoute, private discoverService: DiscoverService) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['query'] || '';
      if (this.searchQuery) {
        this.searchFilms(this.searchQuery);
      }
    });
  }

  searchFilms(query: string): void {
    if (!query) return;

    this.isLoading = true;
    this.discoverService.searchFilms(query).subscribe({
      next: (data) => {
        if (data.results && Array.isArray(data.results)) {
          this.films = data.results;
        } else {
          console.error('Erreur', data);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur sur la recherche de films :', err);
        this.isLoading = false;
      }
    });
  }
}
