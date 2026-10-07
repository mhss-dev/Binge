import { ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { ToastService } from "./toast.service";

@Component({
  selector: "app-toast",
  standalone: true,
  template: `<div class="tt" [class.on]="visible" role="status" aria-live="polite"><span class="tt-dot"></span>{{ text }}</div>`,
})
export class ToastComponent implements OnInit, OnDestroy {
  text = "";
  visible = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private subscription?: Subscription;

  constructor(private toasts: ToastService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.subscription = this.toasts.messages$.subscribe((message) => {
      this.text = message;
      this.visible = true;
      if (this.timer) {
        clearTimeout(this.timer);
      }
      this.timer = setTimeout(() => {
        this.visible = false;
        this.cdr.detectChanges();
      }, 3200);
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }
}
