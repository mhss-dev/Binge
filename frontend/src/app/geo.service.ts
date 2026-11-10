import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, shareReplay, timeout } from 'rxjs';

// Where streaming availability is looked up when the visitor's own country has nothing.
const FALLBACK_REGIONS = ['BE', 'FR', 'US'];

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

  /** The visitor's country if it has providers, else the first fallback region that has some. */
  pickRegion(results: Record<string, unknown>, country: string | null): string | undefined {
    return [country, ...FALLBACK_REGIONS].find((code): code is string => !!code && !!results?.[code]);
  }

  regionLabel(code: string): string {
    try {
      return new Intl.DisplayNames(['fr'], { type: 'region' }).of(code) || code;
    } catch {
      return code;
    }
  }
}
