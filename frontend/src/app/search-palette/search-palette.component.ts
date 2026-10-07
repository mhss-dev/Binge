import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { Subject, Subscription, of } from "rxjs";
import { catchError, debounceTime, switchMap, tap } from "rxjs/operators";
import { DiscoverService } from "../discover.service";
import { SearchPaletteService } from "./search-palette.service";

const POSTER_PATH = /^\/[A-Za-z0-9_.-]{1,100}\.(jpg|jpeg|png|webp)$/;

@Component({
  selector: "app-search-palette",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./search-palette.component.html",
})
export class SearchPaletteComponent implements OnInit, OnDestroy {
  @ViewChild("field") field?: ElementRef<HTMLInputElement>;

  isOpen = false;
  query = "";
  results: any[] = [];
  loading = false;
  searched = false;
  active = -1;
  pending = false;

  private typed = new Subject<string>();
  private subscriptions = new Subscription();

  constructor(
    private discoverService: DiscoverService,
    private palette: SearchPaletteService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(this.palette.opened$.subscribe(() => this.open()));
    this.subscriptions.add(
      this.typed
        .pipe(
          debounceTime(250),
          tap((value) => {
            this.loading = value.length >= 2;
            if (!this.loading) {
              this.results = [];
              this.searched = false;
              this.active = -1;
            }
          }),
          switchMap((value) =>
            value.length < 2 ? of(null) : this.discoverService.searchFilms(value).pipe(catchError(() => of({ results: [] })))
          )
        )
        .subscribe((data) => {
          if (data) {
            this.results = (Array.isArray(data.results) ? data.results : []).filter((movie: any) => movie?.id).slice(0, 7);
            this.searched = true;
            this.active = this.results.length > 0 ? 0 : -1;
          }
          this.loading = false;
          this.pending = false;
          this.cdr.detectChanges();
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    document.body.style.overflow = "";
  }

  open(): void {
    this.isOpen = true;
    document.body.style.overflow = "hidden";
    this.cdr.detectChanges();
    this.field?.nativeElement.focus();
    this.field?.nativeElement.select();
  }

  close(): void {
    this.isOpen = false;
    document.body.style.overflow = "";
  }

  clear(): void {
    this.onType("");
    this.field?.nativeElement.focus();
  }

  onType(value: string): void {
    this.query = value;
    this.pending = true;
    this.typed.next(value.trim());
  }

  onKey(event: KeyboardEvent): void {
    if (event.key === "ArrowDown" && this.results.length > 0) {
      event.preventDefault();
      this.active = (this.active + 1) % this.results.length;
    } else if (event.key === "ArrowUp" && this.results.length > 0) {
      event.preventDefault();
      this.active = (this.active - 1 + this.results.length) % this.results.length;
    } else if (event.key === "Enter") {
      event.preventDefault();
      const picked = this.results[this.active];
      if (picked && this.searched && !this.pending) {
        this.pick(picked);
      } else {
        this.showAll();
      }
    }
  }

  pick(movie: any): void {
    this.close();
    this.router.navigate(["/film", movie.id]);
  }

  showAll(): void {
    const value = this.query.trim();
    if (!value) {
      return;
    }
    this.close();
    this.router.navigate(["/search"], { queryParams: { query: value } });
  }

  poster(path: string | null): string | null {
    return path && POSTER_PATH.test(path) ? "https://image.tmdb.org/t/p/w92" + path : null;
  }

  year(date: string | null): string {
    return date ? date.slice(0, 4) : "";
  }

  @HostListener("document:keydown", ["$event"])
  onShortcut(event: KeyboardEvent): void {
    if (event.key === "Escape" && this.isOpen) {
      this.close();
    } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      this.isOpen ? this.close() : this.open();
    }
  }
}
