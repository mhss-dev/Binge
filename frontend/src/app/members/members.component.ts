import { ChangeDetectorRef, Component } from '@angular/core';
import { MembersService } from '../members.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './members.component.html',
  styleUrl: './members.component.css'
})

export class MembersComponent {
  members : any[] = [];
  
  constructor(private MembreService: MembersService, private cdr: ChangeDetectorRef) {}

  ngOnInit() : void {

    this.MembreService.getMembers().subscribe({
      next: (response) => {
        this.members = response;        
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des membres:', err)
      }
  })
}
    
}
