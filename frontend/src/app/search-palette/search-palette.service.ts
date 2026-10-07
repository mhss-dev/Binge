import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

@Injectable({ providedIn: "root" })
export class SearchPaletteService {
  private openRequests = new Subject<void>();
  readonly opened$ = this.openRequests.asObservable();

  open(): void {
    this.openRequests.next();
  }
}
