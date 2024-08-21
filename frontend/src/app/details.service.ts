import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class DetailsService {
  private apiUrl = 'http://localhost:3000/api/films';

  constructor(private http: HttpClient) { }

  getMovieByID(id: number): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    let params = new HttpParams();

    params = params.append('append_to_response', 'credits');

    const urlWithParams = `${url}&${params.toString()}`;
    console.log(urlWithParams);
    
    return this.http.get<any>(url, { params });
  }
}
