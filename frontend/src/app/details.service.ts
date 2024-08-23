import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class DetailsService {
  private apiUrl = `${environment.apiUrl}/films`;

  constructor(private http: HttpClient) { }

  getMovieByID(id: number): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    let params = new HttpParams();

    params = params.append('append_to_response', 'credits');    
    return this.http.get<any>(url, { params });
  }
}
