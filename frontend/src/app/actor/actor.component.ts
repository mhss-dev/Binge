import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, NgZone, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { nearBottom, watchScroll } from '../scroll.util';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DiscoverService } from 'app/discover.service';
import { Title, Meta } from '@angular/platform-browser';

type CreditFilter = 'all' | 'movie' | 'tv';

@Component({
  selector: 'app-actor',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './actor.component.html',
  styleUrl: './actor.component.css'
})
export class ActorComponent {
  private readonly destroyRef = inject(DestroyRef);
  // Every credit comes in one call; the grid still grows as you scroll to keep the page light.
  private readonly scrollWatch = watchScroll(inject(NgZone), inject(DestroyRef), () => this.shownCount < this.filteredCredits.length && nearBottom(), () => this.showMore());
  private readonly pageSize = 24;
  actor: any;
  credits: any[] = [];
  error: any;
  shownCount = this.pageSize;
  creditFilter: CreditFilter = 'all';
  readonly filterOptions: { value: CreditFilter; label: string }[] = [
    { value: 'all', label: 'Tout' },
    { value: 'movie', label: 'Films' },
    { value: 'tv', label: 'Séries' },
  ];

  constructor(private route: ActivatedRoute, private discoverService: DiscoverService, private cdr: ChangeDetectorRef, private titleService: Title, private metaService: Meta) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((paramMap) => {
      const personId = +paramMap.get('id')!;
      if (personId) {
        this.loadPerson(personId);
      }
    });
  }

  private loadPerson(id: number): void {
    this.actor = null;
    this.credits = [];
    this.error = null;
    this.creditFilter = 'all';
    this.shownCount = this.pageSize;
    this.discoverService.getPerson(id).subscribe({
      next: (data) => {
        this.actor = data?.person || null;
        this.credits = Array.isArray(data?.credits) ? data.credits : [];
        if (this.actor) {
          this.updateMetaTags();
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur dans la récupération des données', err);
        this.error = 'Erreur dans la récupération des données. Réessayez plus tard.';
      }
    });
  }

  get filteredCredits(): any[] {
    return this.creditFilter === 'all' ? this.credits : this.credits.filter((credit) => credit.media_type === this.creditFilter);
  }

  get shownCredits(): any[] {
    return this.filteredCredits.slice(0, this.shownCount);
  }

  hasBothKinds(): boolean {
    return this.credits.some((credit) => credit.media_type === 'movie') && this.credits.some((credit) => credit.media_type === 'tv');
  }

  setFilter(value: CreditFilter): void {
    this.creditFilter = value;
    this.shownCount = this.pageSize;
  }

  showMore(): void {
    this.shownCount += this.pageSize;
  }

  creditLink(credit: any): any[] {
    return [credit.media_type === 'tv' ? '/serie' : '/film', credit.id];
  }

  trackByCredit(index: number, credit: any): string {
    return `${credit.media_type}:${credit.id}`;
  }

  private updateMetaTags(): void {
    if (!this.actor) return;

    this.titleService.setTitle(this.actor.name ? 'Binge - ' + this.actor.name : 'Binge');

    this.metaService.updateTag({ name: 'description', content: this.actor.biography || 'Aucune description disponible.' });
    this.metaService.updateTag({ property: 'og:title', content: 'Binge - ' + this.actor.name });
    this.metaService.updateTag({ property: 'og:description', content: this.actor.biography || '' });
    this.metaService.updateTag({ property: 'og:image', content: 'https://image.tmdb.org/t/p/original/' + this.actor.profile_path });
  }

  getAge(birthday: string | null): number | string {
    if (!birthday) return '???';

    const birthDate = new Date(birthday);
    const timeDiff = Math.abs(Date.now() - birthDate.getTime());
    const age = Math.floor((timeDiff / (1000 * 3600 * 24)) / 365.25);
    return age + ' ans';
  }
}
