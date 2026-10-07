import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

@Injectable({ providedIn: "root" })
export class ToastService {
  private messages = new Subject<string>();
  readonly messages$ = this.messages.asObservable();

  show(message: string): void {
    this.messages.next(message);
  }
}
