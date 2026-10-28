import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { AdminService, AdminUser } from '../admin.service';
import { ToastService } from '../toast/toast.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin.component.html',
})
export class AdminComponent implements OnInit {
  state: 'loading' | 'denied' | 'ready' = 'loading';
  users: AdminUser[] = [];
  query = '';
  resetFor: AdminUser | null = null;
  resetLink = '';
  resetExpires = '';
  copied = false;
  deleteFor: AdminUser | null = null;
  deleteConfirm = '';
  busy = false;

  constructor(private adminService: AdminService, private toasts: ToastService, private titleService: Title, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.titleService.setTitle('Binge • admin');
    this.loadUsers();
  }

  loadUsers(): void {
    this.adminService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.state = 'ready';
        this.cdr.detectChanges();
      },
      error: () => {
        this.state = 'denied';
        this.cdr.detectChanges();
      },
    });
  }

  get filteredUsers(): AdminUser[] {
    const q = this.query.trim().toLowerCase();
    return q ? this.users.filter((user) => user.nickname.toLowerCase().includes(q) || user.username.toLowerCase().includes(q) || String(user.id) === q) : this.users;
  }

  avatar(user: AdminUser): string {
    const url = String(user.avatar_url ?? '');
    return /^assets\/images\/(?:[1-9]|1\d|2[0-4])\.png$/.test(url) ? url : 'assets/images/7.png';
  }

  createLink(user: AdminUser): void {
    this.closePanels();
    this.busy = true;
    this.adminService.createResetLink(user.id).subscribe({
      next: (data) => {
        this.resetFor = user;
        this.resetLink = data.link;
        this.resetExpires = data.expires_at;
        user.reset_pending = true;
        this.busy = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.busy = false;
        this.toasts.show(err.error?.error || 'Impossible de créer le lien.');
      },
    });
  }

  copyLink(): void {
    navigator.clipboard.writeText(this.resetLink).then(() => {
      this.copied = true;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.copied = false;
        this.cdr.detectChanges();
      }, 2000);
    });
  }

  askDelete(user: AdminUser): void {
    this.closePanels();
    this.deleteFor = user;
  }

  confirmDelete(): void {
    const user = this.deleteFor;
    if (!user || this.deleteConfirm !== user.nickname) return;
    this.busy = true;
    this.adminService.deleteUser(user.id, this.deleteConfirm).subscribe({
      next: () => {
        this.users = this.users.filter((item) => item.id !== user.id);
        this.toasts.show(`Compte ${user.nickname} supprimé`);
        this.closePanels();
        this.busy = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.busy = false;
        this.toasts.show(err.error?.error || 'Suppression impossible.');
      },
    });
  }

  closePanels(): void {
    this.resetFor = null;
    this.resetLink = '';
    this.copied = false;
    this.deleteFor = null;
    this.deleteConfirm = '';
  }
}
