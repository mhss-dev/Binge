import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, shareReplay, timeout } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GeoService {
  private readonly http = inject(HttpClient);

  // Asked once per visit; null when the country is unknown (local dev, edge function down).
  readonly country$: Observable<string | null> = this.http.get<{ country: string | null }>('/_geo').pipe(
    timeout(3000),
    map((res) => (res?.country || '').toUpperCase() || null),
    catchError(() => of(null)),
    shareReplay(1),
  );

  /** The visitor's country if it has providers, else any other country that has some. */
  pickRegion(results: Record<string, unknown>, country: string | null): string | undefined {
    if (country && results?.[country]) return country;
    return Object.keys(results || {}).sort()[0];
  }

  regionLabel(code: string): string {
    try {
      return new Intl.DisplayNames(['fr'], { type: 'region' }).of(code) || code;
    } catch {
      return code;
    }
  }
}
