import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

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
    return this.http.get<any>(this.apiUrl, { headers: this.getAuthHeaders() }).pipe(
    )}
  }
