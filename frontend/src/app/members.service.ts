import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MembersService {

  private apiUrl = `${environment.apiUrl}/members`;
  
  
  
  constructor(private http: HttpClient) { }
  
  private getAuthHeaders() : HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`)
  }
  
  getMembers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}`, { headers: this.getAuthHeaders() }).pipe(
        catchError(error => {
            console.error(error);
            return throwError(error);
        })
    );
  }

getFollowers(nickname: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/followers/${nickname}`, { headers: this.getAuthHeaders() });
}

isFollowing(nickname: string): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/isFollowing/${nickname}`, { headers: this.getAuthHeaders() });
}


getFollowings(nickname: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/followings/${nickname}`, { headers: this.getAuthHeaders() });
}

followUser(nickname: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/follow/${nickname}`, {}, { headers: this.getAuthHeaders() });
}

unfollowUser(nickname: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/unfollow/${nickname}`, { headers: this.getAuthHeaders() });
}


  
}

