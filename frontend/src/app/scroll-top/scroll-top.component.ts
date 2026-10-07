import { Component, HostListener, inject, NgZone, DestroyRef } from '@angular/core';
import { watchScroll } from '../scroll.util';
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
  private readonly scrollWatch = watchScroll(inject(NgZone), inject(DestroyRef), () => this.isFar() !== this.visible, () => (this.visible = this.isFar()));

  private isFar(): boolean {
    return (window.scrollY || document.documentElement.scrollTop) > 600;
  }

  visible = false;


  top(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
