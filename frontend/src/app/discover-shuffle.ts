// "Au hasard" in Découverte: pages are walked in a random order, each page is shuffled,
// and titles already shown on earlier visits are kept for the end of the list.

export const RANDOM_SORT = 'random';

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function randomPageOrder(totalPages: number): number[] {
  return shuffle(Array.from({ length: Math.max(0, totalPages) }, (_, i) => i + 1));
}

const MEMORY_DAYS = 30;
const MEMORY_MAX = 6000;

// Remembered in this browser only; storage can be missing (private mode), so every access is guarded.
export class ShownMemory {
  private shown: Record<string, number> = {};

  constructor(private key: string) {
    try {
      const raw = JSON.parse(localStorage.getItem(key) || '{}');
      const limit = Date.now() - MEMORY_DAYS * 24 * 3600 * 1000;
      for (const [id, at] of Object.entries(raw)) {
        if (typeof at === 'number' && at > limit) this.shown[id] = at;
      }
    } catch {
      this.shown = {};
    }
  }

  has(id: number): boolean {
    return id in this.shown;
  }

  remember(ids: number[]): void {
    if (!ids.length) return;
    const now = Date.now();
    ids.forEach((id) => (this.shown[id] = now));
    let entries = Object.entries(this.shown);
    if (entries.length > MEMORY_MAX) {
      entries = entries.sort((a, b) => b[1] - a[1]).slice(0, MEMORY_MAX);
      this.shown = Object.fromEntries(entries);
    }
    try {
      localStorage.setItem(this.key, JSON.stringify(this.shown));
    } catch {}
  }
}

export function readFlag(key: string, fallback: boolean): boolean {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value === '1';
  } catch {
    return fallback;
  }
}

export function saveFlag(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, value ? '1' : '0');
  } catch {}
}
