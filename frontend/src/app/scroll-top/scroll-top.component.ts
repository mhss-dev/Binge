import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-scroll-top',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button *ngIf="visible" type="button" class="floating-action" (click)="top()" aria-label="Retour en haut">
      <i class="fa-solid fa-arrow-up"></i>
    </button>
  `,
})
export class ScrollTopComponent {
  visible = false;

  @HostListener('window:scroll', [])
  onScroll(): void {
    this.visible = (window.scrollY || document.documentElement.scrollTop) > 600;
  }

  top(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
