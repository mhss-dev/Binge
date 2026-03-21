import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../environments/environment';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/auth/notifications`;
  private notificationsSubject = new BehaviorSubject<any[]>([]);

  constructor(private http: HttpClient) {}

  getNotifications(): Observable<any[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    return this.http.get<any[]>(`${this.apiUrl}`, { headers }).pipe(
      catchError((error) => {
        throw error;
      })
    );
  }

  setNotifications(notifications: any[]): void {
    this.notificationsSubject.next(Array.isArray(notifications) ? notifications : []);
  }

  getNotificationsState(): Observable<any[]> {
    return this.notificationsSubject.asObservable();
  }

  markNotificationAsReadInState(notificationId: string): void {
    const updatedNotifications = this.notificationsSubject.value.filter(
      (notification) => notification.id !== notificationId
    );

    this.notificationsSubject.next(updatedNotifications);
  }

  clearNotificationsState(): void {
    this.notificationsSubject.next([]);
  }

  markAsRead(notificationId: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    return this.http.patch(`${this.apiUrl}/${notificationId}/mark-read`, {}, { headers }).pipe(
      catchError((error) => {
        throw error;
      })
    );
  }
}
