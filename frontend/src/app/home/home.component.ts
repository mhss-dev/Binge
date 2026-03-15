import { Component } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { CardsComponent } from '../cards/cards.component';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeaderComponent, CardsComponent, RouterOutlet, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  constructor(private titleService: Title) {}

  ngOnInit(): void {
    this.titleService.setTitle('Binge • social & découverte de films');
  }
}
