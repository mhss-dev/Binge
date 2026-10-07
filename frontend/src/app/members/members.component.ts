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
  readonly sorts: { value: MemberSort; label: string }[] = [
    { value: 'watched', label: 'Plus actifs' },
    { value: 'favorites', label: 'Plus de favoris' },
    { value: 'watchlist', label: 'Plus de watchlist' },
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
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erreur lors de la récupération des membres:', err),
    });
    this.authService.getProfil().subscribe({
      next: (profile) => {
        this.me = profile.nickname;
        this.cdr.detectChanges();
      },
      error: () => (this.me = null),
    });
  }

  get podium(): any[] {
    const top = [...this.members].sort((a, b) => (b.watched_count || 0) - (a.watched_count || 0)).slice(0, 3);
    return top.length === 3 && (top[0].watched_count || 0) > 0 ? top : [];
  }

  get podiumOrder(): { member: any; rank: number }[] {
    const top = this.podium;
    return top.length === 3 ? [{ member: top[1], rank: 2 }, { member: top[0], rank: 1 }, { member: top[2], rank: 3 }] : [];
  }

  get filtered(): any[] {
    const query = this.query.trim().toLowerCase();
    const key = { watched: 'watched_count', favorites: 'favorites_count', watchlist: 'watchlist_count' } as const;
    return this.members
      .filter((member) => !query || String(member.nickname || '').toLowerCase().includes(query))
      .sort((a, b) =>
        this.sort === 'name'
          ? String(a.nickname || '').localeCompare(String(b.nickname || ''), 'fr')
          : (b[key[this.sort]] || 0) - (a[key[this.sort]] || 0)
      );
  }

  trackByNickname(index: number, member: any): string {
    return member.nickname ?? String(index);
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
