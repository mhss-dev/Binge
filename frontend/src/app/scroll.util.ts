import { DestroyRef, NgZone } from "@angular/core";

export function watchScroll(zone: NgZone, destroyRef: DestroyRef, check: () => boolean, action: () => void): void {
  zone.runOutsideAngular(() => {
    const handler = () => {
      if (check()) {
        zone.run(action);
      }
    };
    window.addEventListener("scroll", handler, { passive: true });
    destroyRef.onDestroy(() => window.removeEventListener("scroll", handler));
  });
}

export function nearBottom(margin = 100): boolean {
  const top = window.scrollY || document.documentElement.scrollTop;
  const height = window.innerHeight || document.documentElement.clientHeight;
  return top + height >= document.documentElement.scrollHeight - margin;
}
