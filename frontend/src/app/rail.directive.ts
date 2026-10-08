import { AfterViewInit, Directive, ElementRef, NgZone, OnDestroy } from "@angular/core";

@Directive({ selector: "[appRail]", standalone: true, exportAs: "appRail" })
export class RailDirective implements AfterViewInit, OnDestroy {
  private cleanup: Array<() => void> = [];

  constructor(private host: ElementRef<HTMLElement>, private zone: NgZone) {}

  ngAfterViewInit(): void {
    const el = this.host.nativeElement;
    this.zone.runOutsideAngular(() => {
      const wheel = (event: WheelEvent) => {
        if (Math.abs(event.deltaY) <= Math.abs(event.deltaX) || el.scrollWidth <= el.clientWidth) {
          return;
        }
        event.preventDefault();
        el.scrollLeft += event.deltaY;
      };
      const update = () => {
        el.toggleAttribute("data-start", el.scrollLeft <= 2);
        el.toggleAttribute("data-end", el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
      };
      el.addEventListener("wheel", wheel, { passive: false });
      el.addEventListener("scroll", update, { passive: true });
      window.addEventListener("resize", update, { passive: true });
      const observer = new MutationObserver(update);
      observer.observe(el, { childList: true, subtree: true });
      update();
      this.cleanup.push(
        () => el.removeEventListener("wheel", wheel),
        () => el.removeEventListener("scroll", update),
        () => window.removeEventListener("resize", update),
        () => observer.disconnect()
      );
    });
  }

  slide(direction: number): void {
    const el = this.host.nativeElement;
    el.scrollBy({ left: direction * el.clientWidth * 0.7, behavior: "smooth" });
  }

  ngOnDestroy(): void {
    this.cleanup.forEach((fn) => fn());
  }
}
