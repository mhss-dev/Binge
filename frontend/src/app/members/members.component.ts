import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MembersService } from '../members.service';
import { AuthService } from '../auth.service';
import { MatchService } from '../match/match.service';

type MemberSort = 'watched' | 'favorites' | 'watchlist' | 'name';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './members.component.html',
  styles: [':host { display: block; }'],
})
export class MembersComponent implements OnInit {
  members: any[] = [];
  query = '';
  sort: MemberSort = 'watched';
  me: string | null = null;
  inviting: string | null = null;
  error = '';
  loading = true;
  loadError = '';
  readonly skeleton = [0, 1, 2, 3, 4, 5];
  readonly sorts: { value: MemberSort; label: string }[] = [
    { value: 'watched', label: 'Films vus' },
    { value: 'favorites', label: 'Favoris' },
    { value: 'watchlist', label: 'Watchlist' },
    { value: 'name', label: 'A à Z' },
  ];

  constructor(
    private membersService: MembersService,
    private authService: AuthService,
    private matchService: MatchService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.membersService.getMembers().subscribe({
      next: (response) => {
        this.members = response;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        if (err?.status !== 404) {
          this.loadError = 'Impossible de charger les membres. Recharge la page dans un instant.';
        }
        this.cdr.detectChanges();
      },
    });
    this.authService.getProfil().subscribe({
      next: (profile) => {
        this.me = profile.nickname;
        this.cdr.detectChanges();
      },
      error: () => (this.me = null),
    });
  }

  get topThree(): any[] {
    const top = [...this.members].sort((a, b) => (b.watched_count || 0) - (a.watched_count || 0)).slice(0, 3);
    return top.length === 3 && (top[2].watched_count || 0) > 0 ? top : [];
  }

  // Rank comes from the whole list for the current sort, so filtering keeps each member's real place.
  get rows(): { member: any; rank: number | null }[] {
    const query = this.query.trim().toLowerCase();
    const key = { watched: 'watched_count', favorites: 'favorites_count', watchlist: 'watchlist_count' } as const;
    const sorted = [...this.members].sort((a, b) =>
      this.sort === 'name'
        ? String(a.nickname || '').localeCompare(String(b.nickname || ''), 'fr')
        : (b[key[this.sort]] || 0) - (a[key[this.sort]] || 0)
    );
    return sorted
      .map((member, index) => ({ member, rank: this.sort === 'name' ? null : index + 1 }))
      .filter((row) => !query || String(row.member.nickname || '').toLowerCase().includes(query));
  }

  trackByRow(index: number, row: { member: any }): string {
    return row.member.nickname ?? String(index);
  }

  avatar(member: any): string {
    const url = String(member?.avatar_url ?? '');
    return /^assets\/images\/(?:[1-9]|1\d|2[0-4])\.png$/.test(url) ? url : 'assets/images/7.png';
  }

  invite(nickname: string): void {
    if (this.inviting) {
      return;
    }
    this.inviting = nickname;
    this.error = '';
    this.matchService.createSession({}, nickname).subscribe({
      next: (res) => this.router.navigate(['/match', res.session.code]),
      error: () => {
        this.inviting = null;
        this.error = "Impossible de créer le match pour le moment.";
      },
    });
  }
}
