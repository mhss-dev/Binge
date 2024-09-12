import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class DetailsService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  getMovieByID(id: number): Observable<any> {
    const url = `${this.apiUrl}/films/${id}`;
    let params = new HttpParams();

    params = params.append('append_to_response', 'credits');    
    return this.http.get<any>(url, { params });
  }

  getLogoByID(id: number): Observable<any> {
    const url = `${this.apiUrl}/logo/${id}`;
    return this.http.get<any>(url);
  }
  getNetworkID(id: number): Observable<any> {
    const url = `${this.apiUrl}/network/${id}`;
    return this.http.get<any>(url);
  }
  getProviders(id: number): Observable<any> {
    const url = `${this.apiUrl}/providers/${id}`;
    return this.http.get<any>(url);
  }
  getSimilarByID(id: number): Observable<any> {
    const url = `${this.apiUrl}/similar/${id}`;
    return this.http.get<any>(url);
  }
}
